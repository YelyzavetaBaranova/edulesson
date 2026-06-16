import { esc } from './utils.js';
import { D, getCourseRef, getLessonRef, save, saveVocab, loadVocab, loadFromDB } from './store.js';
import * as state from './state.js';
import { NAMES } from './constants.js';
import * as db from './db/index.js';
import { renderTasksHTML, renderSectionsListHTML } from './tasks/render.js';
import { initDrag, initFillInBoxDrag } from './tasks/interactions.js';
import { initTaskReorder } from './tasks/reorder.js';
import { buildVocabPanelHTML } from './vocab.js';
import { buildTranslatePanelHTML } from './translator.js';
import { buildTeacherHomeworkPanelHTML, buildStudentHomeworkPanelHTML, renderTeacherHomeworkList, renderStudentHomeworkList, createHomework } from './homework.js';
import { currentUser, isAdmin } from './auth.js';
import { updateProgress, getUserCourseIds, startLessonTimer, stopLessonTimer } from './progress.js';

/* ─── Auto-refresh for student pages ─── */

function stopStudentRefresh() {
  if (state.refreshInterval) {
    clearInterval(state.refreshInterval);
    state.setRefreshInterval(null);
  }
}

function startStudentRefresh() {
  stopStudentRefresh();
  if (isAdmin()) return;
  state.setRefreshInterval(setInterval(async () => {
    if (isAdmin() || state.cLid) { stopStudentRefresh(); return; }
    await loadFromDB();
    await ensureEnrolled();
    switch (state.currentView) {
      case 'home': await showHome(); break;
      case 'schedule': await showStudentSchedule(); break;
      case 'profile': await showStudentProfile(); break;
      case 'homework': await showHomeworkPanel(); break;
    }
  }, 60000));
}

let adminTab = 'materials';
let studentVisibleLessonIds = null;

function getFilteredCourses() {
  if (isAdmin()) return D.courses;
  const enrolledId = window.__enrolledCourseId;
  if (enrolledId) return D.courses.filter(c => c.id === enrolledId);
  return [];
}

function getFilteredLessons(courseId) {
  const course = getCourseRef(courseId);
  if (!course) return [];
  if (isAdmin()) return course.lessons;
  if (studentVisibleLessonIds) {
    return course.lessons.filter(l => studentVisibleLessonIds.includes(l.id));
  }
  return [];
}

async function ensureEnrolled() {
  if (isAdmin()) return;
  const cids = await getUserCourseIds();
  window.__enrolledCourseIds = cids;
  if (!cids.length) {
    window.__enrolledCourseId = null;
    window.__enrolledChecked = true;
    return;
  }
  const saved = localStorage.getItem('activeCourseId');
  if (saved && cids.includes(Number(saved))) {
    window.__enrolledCourseId = Number(saved);
  } else {
    window.__enrolledCourseId = cids[0];
    localStorage.setItem('activeCourseId', cids[0]);
  }
  window.__enrolledChecked = true;
  await refreshVisibleLessons();
}

export function setActiveCourse(courseId) {
  if (!window.__enrolledCourseIds || !window.__enrolledCourseIds.includes(Number(courseId))) return;
  window.__enrolledCourseId = Number(courseId);
  localStorage.setItem('activeCourseId', courseId);
}

async function refreshVisibleLessons(courseId) {
  studentVisibleLessonIds = null;
  const cid = courseId || window.__enrolledCourseId;
  if (!cid) return;
  const course = getCourseRef(cid);
  if (!course) return;
  const allProgress = await db.getByIndex('progress', 'user_id', currentUser.id);
  const ids = [];
  for (const lesson of course.lessons) {
    ids.push(lesson.id);
    const p = allProgress.find(pr => pr.lesson_id === lesson.id);
    if (!p || p.status !== 'done') break;
  }
  studentVisibleLessonIds = ids;
}

export function toggleSB() {
  state.setSbOpen(!state.sbOpen);
  document.getElementById('sidebar').classList.toggle('collapsed', !state.sbOpen);
  const tb = document.getElementById('sbToggle');
  tb.classList.toggle('open', state.sbOpen);
  tb.textContent = state.sbOpen ? '‹' : '›';
}

function renderAdminTabs() {
  const el = document.getElementById('sbTabs');
  if (!el) return;
  el.innerHTML = `
    <button class="sb-tab ${adminTab === 'students' ? 'active' : ''}" data-action="admin-tab" data-tab="students">👥 Учні</button>
    <button class="sb-tab ${adminTab === 'schedule' ? 'active' : ''}" data-action="admin-tab" data-tab="schedule">📅 Розклад</button>
    <button class="sb-tab ${adminTab === 'materials' ? 'active' : ''}" data-action="admin-tab" data-tab="materials">📦 Матеріали</button>
    <button class="sb-tab ${adminTab === 'homework' ? 'active' : ''}" data-action="show-homework">📝 ДЗ</button>`;
}

function renderSBHWSection() {
  const el = document.getElementById('sbHWSection');
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = `
    <div class="sb-hw-header">
      <span class="hw-ico">📁</span>
      <span>Домашні роботи</span>
    </div>
    <div class="sb-hw-actions">
      <button class="sb-hw-btn" data-action="show-homework">
        <span class="hw-btn-ico">📝</span>
        <span class="hw-btn-lbl">Перевірка</span>
      </button>
      <button class="sb-hw-btn" data-action="show-homework">
        <span class="hw-btn-ico">📊</span>
        <span class="hw-btn-lbl">Статус</span>
      </button>
      <button class="sb-hw-btn" data-action="show-homework">
        <span class="hw-btn-ico">📋</span>
        <span class="hw-btn-lbl">Архів</span>
      </button>
    </div>`;
}

function renderSBActions() {
  const el = document.getElementById('sbActions');
  if (!el) return;
  if (isAdmin()) {
    el.innerHTML = '';
  } else {
    el.innerHTML = `
      <div style="display:flex;gap:6px;width:100%">
        <button class="btn bg bsm" data-action="show-home" style="flex:1;font-size:13px">🏠</button>
        <button class="btn bg bico" data-action="show-student-profile" title="Кабінет">👤</button>
        <button class="btn bg bico" data-action="show-student-schedule" title="Розклад">📅</button>
      </div>
      <div style="display:flex;gap:6px;width:100%;margin-top:4px">
        <button class="btn bg bsm" data-action="show-homework" style="flex:1;font-size:13px">📝 ДЗ</button>
        <button class="btn bg bico" data-action="show-vocab-page" title="Словник">📖</button>
      </div>`;
  }
}

function renderSBBottom() {
  const el = document.getElementById('sbBottom');
  if (!el) return;
  el.style.display = 'flex';
  el.innerHTML = `
    <button class="sb-bottom-btn" data-action="show-home" title="Головна">🏠</button>
    <button class="sb-bottom-btn" data-action="show-vocab-page" title="Словник">📖</button>`;
}

export function renderSB() {
  const sbHW = document.getElementById('sbHWSection');
  const sbBot = document.getElementById('sbBottom');
  if (isAdmin()) {
    document.getElementById('sbTabs').style.display = 'flex';
    renderAdminTabs();
    renderSBHWSection();
    renderSBBottom();
    if (sbHW) sbHW.style.display = 'block';
    if (sbBot) sbBot.style.display = 'flex';
  } else {
    document.getElementById('sbTabs').style.display = 'none';
    if (sbHW) sbHW.style.display = 'none';
    if (sbBot) sbBot.style.display = 'none';
  }
  renderSBActions();
  const el = document.getElementById('folderList');
  const courses = getFilteredCourses();
  if (isAdmin() && adminTab !== 'materials') {
    el.innerHTML = '';
    return;
  }
  if (!courses.length) {
    if (isAdmin()) {
      el.innerHTML = '<div style="padding:16px 10px;font-size:11px;color:var(--text3);font-family:var(--mono);line-height:1.8">Ще немає курсів.<br>Натисни «＋ Курс» унизу</div>';
    } else {
      el.innerHTML = '<div style="padding:16px 10px;font-size:11px;color:var(--text3);font-family:var(--mono);line-height:1.8;text-align:center">Немає доступних курсів</div>';
    }
    return;
  }
  if (courses.length) {
    el.innerHTML = `<div class="folder-grid">
      ${courses.map(c => `<div class="folder-grid-item" data-action="toggle-folder" data-fid="${c.id}">
        <div class="fi-ico">📁</div>
        <div class="fi-name">${esc(c.name)}</div>
      </div>`).join('')}
    </div>
    ${isAdmin() ? `<button class="add-course-btn" data-action="show-new-course">＋ Новий курс</button>` : ''}`;
  }
}

export function toggleFolder(courseId) {
  if (state.cFid === courseId && !state.cLid) {
    state.setCFid(null);
    state.setCLid(null);
    showHome();
  } else {
    state.setCFid(courseId);
    state.setCLid(null);
    showCourseView(getCourseRef(courseId));
  }
  renderSB();
}

export function setTopbar(title, bread, actions) {
  document.getElementById('tbTitle').textContent = title;
  document.getElementById('tbBread').innerHTML = bread || '';
  document.getElementById('tbActions').innerHTML = actions || '';
  const userArea = document.getElementById('tbUserArea');
  if (userArea) {
    userArea.innerHTML = `
      <div class="tb-user">
        <div class="tb-user-info">
          <div class="tb-user-name">Вітаю, ${esc(currentUser?.name || '')}!</div>
          <div class="tb-user-role">${currentUser?.role === 'admin' ? 'Admin' : 'Student'}</div>
        </div>
        <div class="tb-user-avatar">${(currentUser?.name || 'A')[0].toUpperCase()}</div>
      </div>`;
  }
  const extra = document.getElementById('tbExtra');
  if (extra) extra.innerHTML = '';
}

export async function showHome() {
  stopLessonTimer();
  stopStudentRefresh();
  state.setCurrentView('home');
  state.setCFid(null);
  state.setCLid(null);
  await ensureEnrolled();
  renderSB();
  const courses = getFilteredCourses();
  const userName = currentUser?.name || 'Користувач';
  const isAdm = isAdmin();
  setTopbar(`Вітаю, ${userName}!`, '', buildHomeActions());
  if (isAdm) {
    const homeCourses = D.courses;
    document.getElementById('mc').innerHTML = `<div style="padding:22px 26px;max-width:960px;width:100%">
      <div style="margin-bottom:20px">
        <div style="font-size:26px;font-weight:800;margin-bottom:6px">🏠 Головна</div>
        <div style="font-size:14px;color:var(--text3);font-family:var(--mono)">Оберіть розділ у бічній панелі</div>
      </div>
      ${homeCourses.length ? `
      <div class="sec-title" style="margin-bottom:12px;font-size:12px">📂 Матеріали</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">
        ${homeCourses.map(c => `
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px 12px;border-radius:14px;background:var(--surface2);border:1px solid var(--border);cursor:pointer;transition:all .12s" data-action="toggle-folder" data-fid="${c.id}">
          <div style="font-size:48px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,.3))">📁</div>
          <div style="font-size:14px;font-weight:700;text-align:center">${esc(c.name)}</div>
          <div style="font-size:12px;color:var(--text3);font-family:var(--mono)">${c.lessons.length} уроків</div>
        </div>`).join('')}
      </div>` : '<div class="empty-state"><div class="empty-icon">📁</div><div class="empty-text">Курсів ще немає</div></div>'}
    </div>`;
    return;
  }
  const cids = window.__enrolledCourseIds || [];
  const tc = courses.length;
  const tl = courses.reduce((s, c) => s + c.lessons.length, 0);
  const tt = courses.reduce((s, c) => s + c.lessons.reduce((a, l) => a + (l.tasks || []).length, 0), 0);
  const activeCourseName = courses.length ? esc(courses[0]?.name || '') : '';
  document.getElementById('mc').innerHTML = `<div style="padding:22px 26px;max-width:880px;width:100%">
    <div class="home-hero">
      <div class="hero-badge">${activeCourseName || 'Мої курси'}</div>
      <div class="hero-title">Продовжуй навчання.</div>
      <div class="hero-sub">${tc ? `${tc} курсів · ${tl} уроків · ${tt} завдань` : ''}</div>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-num">${tc}</div><div class="stat-label">Курсів</div></div>
        <div class="stat-card"><div class="stat-num">${tl}</div><div class="stat-label">Уроків</div></div>
        <div class="stat-card"><div class="stat-num">${tt}</div><div class="stat-label">Завдань</div></div>
      </div>
    </div>
    ${
      courses.length
        ? `<div class="sec-title">📂 Уроки</div>` +
          courses.map(c => `
      <div class="task-card tc-choose" style="cursor:pointer" data-action="toggle-folder" data-fid="${c.id}">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
          <div>
            <div style="font-size:14px;font-weight:700;margin-bottom:2px">${esc(c.name)}</div>
            <div style="font-size:11px;color:var(--text3);font-family:var(--mono)">${c.lessons.length} уроків · ${c.lessons.reduce((a, l) => a + (l.tasks || []).length, 0)} завдань</div>
          </div>
          <span style="font-size:18px;opacity:.4">›</span>
        </div>
      </div>`).join('')
        : '<div class="empty-state"><div class="empty-icon">📁</div><div class="empty-text">Немає доступних уроків</div></div>'
    }
    ${!isAdm ? `<div id="studentHomeHomework"></div>` : ''}
  </div>`;
  if (!isAdm) await renderStudentHomeHomework();
  if (!isAdm) startStudentRefresh();
}

function buildHomeActions() {
  if (isAdmin()) return `<button class="btn bd bsm" data-action="logout">🚪</button>`;
  return `<button class="btn bg bsm" data-action="show-student-profile">👤 Кабінет</button>
    <button class="btn bg bsm" data-action="show-student-schedule">📅 Розклад</button>
    <button class="btn bd bsm" data-action="logout">🚪</button>`;
}

export function showCourseView(course) {
  if (!course) return showHome();
  const isAdm = isAdmin();
  const lessons = isAdm ? course.lessons : getFilteredLessons(course.id);
  setTopbar(
    course.name,
    'Курс',
    `${isAdm ? `<button class="btn bp bsm" data-action="open-cl" data-fid="${course.id}">＋ Урок</button>
    <button class="btn bd bsm" data-action="del-folder" data-fid="${course.id}">🗑</button>` : ''}
    <button class="btn bd bsm" data-action="logout">🚪</button>`
  );
  document.getElementById('mc').innerHTML = `<div style="padding:22px 26px;max-width:880px;width:100%">
    <div style="margin-bottom:17px">
      <div style="font-size:19px;font-weight:800;margin-bottom:3px">${esc(course.name)}</div>
      <div style="font-size:11px;color:var(--text3);font-family:var(--mono)">${course.lessons.length} уроків · ${isAdm ? '' : lessons.length + ' доступно'}</div>
    </div>
    <div class="sec-title">📖 Уроки</div>
    ${
      lessons.length
        ? lessons
            .map(
              (l) => `
      <div class="task-card tc-fillin" style="cursor:pointer" data-action="open-lesson" data-fid="${course.id}" data-lid="${l.id}">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
          <div>
            <div style="font-size:14px;font-weight:700;margin-bottom:2px">${esc(l.name)}</div>
            <div style="font-size:11px;color:var(--text3);font-family:var(--mono)">${(l.tasks || []).length} завдань</div>
          </div>
          <span style="font-size:18px;opacity:.4">›</span>
        </div>
      </div>`
            )
            .join('')
        : '<div class="empty-state"><div class="empty-icon">📖</div><div class="empty-text">Немає доступних уроків</div></div>'
    }
    ${!isAdm ? '' : `<div class="add-task-btn" data-action="open-cl" data-fid="${course.id}">＋ Додати урок</div>`}
  </div>`;
}

export async function openLesson(courseId, lessonId) {
  stopStudentRefresh();
  if (!isAdmin()) {
    const visible = getFilteredLessons(courseId);
    if (!visible.find(l => l.id === Number(lessonId))) {
      return showHome();
    }
  }
  state.setCFid(courseId);
  state.setCLid(lessonId);
  state.setCTab('lesson');
  state.setCSidePanel('tasks');
  renderSB();
  const course = getCourseRef(courseId);
  const lesson = getLessonRef(courseId, lessonId);
  if (!course || !lesson) return;
  await updateProgress(lessonId, 'in_progress');
  startLessonTimer(lessonId, courseId);
  const isAdm = isAdmin();
  setTopbar(
    lesson.name,
    `<span>${esc(course.name)}</span> › <span>${esc(lesson.name)}</span>`,
    `${isAdm ? `<button class="btn bd bsm" data-action="del-lesson" data-fid="${courseId}" data-lid="${lessonId}">🗑 Урок</button>` : ''}
    <button class="btn bd bsm" data-action="logout">🚪</button>`
  );
  await renderLessonLayout(lesson, courseId, isAdm);
}

export async function renderLessonLayout(lesson, courseId, isAdm) {
  const tasks = lesson.tasks || [];
  let lessonDone = false;
  if (!isAdm) {
    const p = await db.getByIndex('progress', 'user_id', currentUser.id);
    const found = p.find(pr => pr.lesson_id === lesson.id);
    lessonDone = found?.status === 'done';
  }

  document.getElementById('mc').innerHTML = `
    <div class="lesson-layout">
      <div class="lesson-left-icons" id="leftIcons">
        <div class="side-icon-btn active" id="si-tasks" title="Завдання" data-action="set-side-panel" data-panel="tasks">📋</div>
        <div class="side-icon-btn" id="si-vocab" title="Словник" data-action="set-side-panel" data-panel="vocab">📖</div>
        <div class="side-icon-btn" id="si-translate" title="Перекладач" data-action="set-side-panel" data-panel="translate">🔤</div>
      </div>
      <div class="lesson-content-area" id="lessonContentArea">
        <button class="change-unit-btn" data-action="show-folder" data-fid="${courseId}">← Change unit</button>
        <div class="lesson-top-title">${esc(lesson.name)}</div>
        <div id="lessonTaskArea">
          ${renderTasksHTML(lesson, courseId)}
        </div>
      </div>
      <div class="lesson-sections-sidebar" id="sectionsSidebar">
        <div class="sections-header">Sections</div>
        <div class="sections-list" id="sectionsList">
          ${renderSectionsListHTML(tasks)}
        </div>
        <div class="sections-footer">
          <div class="sections-score" id="sectionsScoreDisplay">0/0 correct</div>
          <button class="btn bgr" data-action="check-all" data-fid="${courseId}" data-lid="${lesson.id}">✓ Check All</button>
          <button class="btn bg" data-action="reset-all" data-fid="${courseId}" data-lid="${lesson.id}">↺ Reset</button>
          ${isAdm ? `<button class="btn bp bsm" data-action="create-hw-from-lesson" data-fid="${courseId}" data-lid="${lesson.id}">📝 ДЗ</button>` : lessonDone ? '<div style="font-size:11px;color:var(--green);font-family:var(--mono);padding:6px 0">✓ Урок пройдено</div>' : '<div style="font-size:11px;color:var(--text3);font-family:var(--mono);padding:6px 0">Виконайте всі завдання</div>'}
        </div>
      </div>
    </div>`;
  initDrag();
  initFillInBoxDrag();
  initTaskReorder(courseId, lesson.id);
}

export function setSidePanel(panel) {
  state.setCSidePanel(panel);
  document.querySelectorAll('.side-icon-btn').forEach((b) => b.classList.remove('active'));
  const si = document.getElementById(`si-${panel}`);
  if (si) si.classList.add('active');

  const existing = document.getElementById('sidePanelArea');
  if (existing) existing.remove();

  if (panel === 'tasks') {
    const sectionsSidebar = document.getElementById('sectionsSidebar');
    if (sectionsSidebar) sectionsSidebar.style.display = 'flex';
    return;
  }

  const sectionsSidebar = document.getElementById('sectionsSidebar');
  if (sectionsSidebar) sectionsSidebar.style.display = 'none';

  const lca = document.getElementById('lessonContentArea');
  if (!lca) return;

  if (panel === 'vocab') {
    const panelEl = document.createElement('div');
    panelEl.id = 'sidePanelArea';
    panelEl.style.cssText = 'width:300px;border-left:1px solid var(--border);background:var(--surface);overflow-y:auto;flex-shrink:0';
    panelEl.innerHTML = buildVocabPanelHTML(state.cLid);
    lca.parentElement.appendChild(panelEl);
    const inp = document.getElementById('viWord');
    if (inp) inp.focus();
  } else if (panel === 'translate') {
    const panelEl = document.createElement('div');
    panelEl.id = 'sidePanelArea';
    panelEl.style.cssText = 'width:320px;border-left:1px solid var(--border);background:var(--surface);overflow-y:auto;flex-shrink:0';
    panelEl.innerHTML = buildTranslatePanelHTML();
    lca.parentElement.appendChild(panelEl);
  }
}

export function setLTab(tab, fid, lid) {
  state.setCTab(tab);
  document.querySelectorAll('.lesson-tab').forEach((t) => t.classList.remove('active'));
  const tEl = document.getElementById(`tab-${tab}`);
  if (tEl) tEl.classList.add('active');
  const lesson = getLessonRef(fid, lid);
  if (!lesson) return;
  const area = document.getElementById('lessonTaskArea');
  if (!area) return;
  area.innerHTML = `
    ${renderTasksHTML(lesson, fid)}`;
  initDrag();
  initFillInBoxDrag();
  initTaskReorder(fid, lid);
}

export function showAdminPanel() {
  return showStudentsTab();
}

export function showStudentsTab() {
  if (!isAdmin()) return showHome();
  adminTab = 'students';
  state.setCFid(null);
  state.setCLid(null);
  renderSB();
  setTopbar('', '', `<button class="btn bg bsm" data-action="show-home">🏠</button>
    <button class="btn bd bsm" data-action="logout">🚪</button>`);
  document.getElementById('tbTitle').innerHTML = '<span class="tb-ico">💜</span>Students';
  const mc = document.getElementById('mc');
  mc.innerHTML = `
    <div style="padding:16px 24px;flex:1;display:flex;flex-direction:column;overflow-y:auto">
      <div class="warning-banner">
        <span class="wb-icon">⚠️</span>
        <span class="wb-text">There is homework pending review</span>
        <button class="wb-btn" data-action="show-homework">→ Learn more</button>
      </div>
      <div class="search-row">
        <div class="search-wrap">
          <span class="search-ico">🔍</span>
          <input type="text" placeholder="Search" id="studentSearch">
        </div>
        <button class="filter-btn">🔍 Filter</button>
      </div>
      <div class="tag-row">
        <button class="tag-btn active">All</button>
        <button class="tag-btn">Live classes</button>
      </div>
      <div class="view-tools">
        <div class="view-tools-left">
          <button class="view-btn" title="Grid view">▦</button>
          <button class="view-btn active" title="List view">≡</button>
          <button class="sort-btn">↕ Sort by creation date</button>
        </div>
      </div>
      <hr class="dashed-divider">
      <div class="student-counter" id="studentCounter">Number of students 0</div>
      <div id="adminStudentList"></div>
    </div>`;
  import('./admin.js').then(m => m.renderAdminPanel());
}

export async function showScheduleTab() {
  if (!isAdmin()) return showHome();
  adminTab = 'schedule';
  state.setCFid(null);
  state.setCLid(null);
  renderSB();
  setTopbar('📅 Розклад', '', `<button class="btn bg bsm" data-action="show-home">🏠</button>
    <button class="btn bd bsm" data-action="logout">🚪</button>`);
  const { buildScheduleHTML, initScheduleEditor } = await import('./schedule.js');
  document.getElementById('mc').innerHTML = `<div style="padding:22px 26px;max-width:960px;width:100%">
    ${buildScheduleHTML()}
  </div>`;
  await initScheduleEditor();
}

export function showMaterialsTab() {
  if (!isAdmin()) return showHome();
  adminTab = 'materials';
  state.setCFid(null);
  state.setCLid(null);
  renderSB();
  setTopbar('📦 Матеріали', '', `<button class="btn bg bsm" data-action="show-home">🏠</button>
    <button class="btn bd bsm" data-action="logout">🚪</button>`);
  document.getElementById('mc').innerHTML = `<div style="padding:22px 26px;max-width:880px;width:100%">
    <div style="margin-bottom:24px">
      <div style="font-size:19px;font-weight:800;margin-bottom:6px">📦 Матеріали</div>
      <div style="font-size:12px;color:var(--text3);font-family:var(--mono)">Оберіть курс у бічній панелі</div>
    </div>
  </div>`;
}

export async function showHomeworkPanel() {
  stopStudentRefresh();
  state.setCurrentView('homework');
  state.setCFid(null);
  state.setCLid(null);
  renderSB();
  setTopbar('Домашнє завдання', '', `<button class="btn bg bsm" data-action="show-home">🏠</button>
    <button class="btn bg bsm" data-action="show-student-profile">👤 Кабінет</button>
    <button class="btn bd bsm" data-action="logout">🚪</button>`);
  if (isAdmin()) {
    document.getElementById('mc').innerHTML = `<div style="padding:22px 26px;max-width:960px;width:100%">
      ${buildTeacherHomeworkPanelHTML()}
    </div>`;
    await renderTeacherHomeworkList();
  } else {
    document.getElementById('mc').innerHTML = `<div style="padding:22px 26px;max-width:880px;width:100%">
      ${buildStudentHomeworkPanelHTML()}
    </div>`;
    await renderStudentHomeworkList();
    startStudentRefresh();
  }
}

export async function showVocabPage() {
  state.setCFid(null);
  state.setCLid(null);
  renderSB();
  setTopbar('Словник', '', `<button class="btn bg bsm" data-action="show-home">🏠</button>
    <button class="btn bg bsm" data-action="show-homework">📝 ДЗ</button>
    <button class="btn bd bsm" data-action="logout">🚪</button>`);
  const { buildVocabPageHTML, renderVocabPage } = await import('./vocab.js');
  document.getElementById('mc').innerHTML = `<div style="padding:22px 26px;max-width:880px;width:100%">
    ${buildVocabPageHTML()}
  </div>`;
  await renderVocabPage();
}

export async function showHomeworkDetailView(hwId) {
  stopStudentRefresh();
  state.setCurrentView('homework');
  state.setCFid(null);
  state.setCLid(null);
  renderSB();
  setTopbar('Домашнє завдання', '', `<button class="btn bg bsm" data-action="show-home">🏠</button>
    <button class="btn bg bsm" data-action="show-homework">📋 До списку</button>
    <button class="btn bg bsm" data-action="show-student-profile">👤 Кабінет</button>
    <button class="btn bd bsm" data-action="logout">🚪</button>`);

  const all = await db.getAll('homework');
  const hw = all.find(h => h.id === Number(hwId));
  if (!hw) { showHomeworkPanel(); return; }
  if (isAdmin()) { showHomeworkPanel(); return; }

  const lesson = await db.get('lessons', hw.lesson_id);
  const course = getCourseRef(hw.course_id);
  const tasks = hw.tasks || [];
  const { renderHomeworkTask } = await import('./homework.js');

  document.getElementById('mc').innerHTML = `<div style="padding:22px 26px;max-width:720px;width:100%">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px">
      <div>
        <div style="font-size:18px;font-weight:700">${esc(lesson?.name || 'Урок')}</div>
        <div style="font-size:12px;color:var(--text3);font-family:var(--mono)">${esc(course?.name || '')} · ${tasks.length} завдань · ${hw.status}</div>
      </div>
      ${hw.status === 'returned' ? '<span style="font-size:11px;padding:4px 10px;border-radius:6px;background:var(--amber);color:#000;font-family:var(--mono)">🔙 Повернено на доопрацювання</span>' : ''}
    </div>
    <div id="homeworkDetailTasks">
      ${tasks.map((t, i) => renderHomeworkTask(t, i, hw.course_id, hw.lesson_id)).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
      <button class="btn bgr bsm" data-action="hw-check-all" data-hw-id="${hw.id}" data-course-id="${hw.course_id}" data-lesson-id="${hw.lesson_id}" style="font-size:13px">✓ Перевірити все</button>
      <button class="btn bd bsm" data-action="hw-reset-all" data-hw-id="${hw.id}" data-course-id="${hw.course_id}" data-lesson-id="${hw.lesson_id}" style="font-size:13px">↺ Скинути все</button>
      <button class="btn bg bsm" data-action="hw-mark-done" data-hw-id="${hw.id}" style="font-size:13px;margin-left:auto">✓ Позначити виконаним</button>
    </div>
  </div>`;
  startStudentRefresh();
}

export async function showProfile(userId, courseId) {
  stopStudentRefresh();
  if (!isAdmin()) return showHome();
  if (!courseId) window.__profileCourseId = null;
  else window.__profileCourseId = courseId;
  const { buildProfileHTML, renderProfile } = await import('./profile.js');
  state.setCFid(null);
  state.setCLid(null);
  renderSB();
  setTopbar('Профіль учня', '', `<button class="btn bg bsm" data-action="show-students">👥</button>
    <button class="btn bd bsm" data-action="logout">🚪</button>`);
  document.getElementById('mc').innerHTML = `<div style="padding:22px 26px;max-width:880px;width:100%">
    ${await buildProfileHTML(userId, window.__profileCourseId)}
  </div>`;
  await renderProfile(userId);
}

export async function showStudentSchedule() {
  if (isAdmin()) return;
  stopStudentRefresh();
  stopLessonTimer();
  state.setCurrentView('schedule');
  state.setCFid(null);
  state.setCLid(null);
  renderSB();
  setTopbar('📅 Розклад', '', `<button class="btn bg bsm" data-action="show-home">🏠</button>
    <button class="btn bg bsm" data-action="show-student-profile">👤 Кабінет</button>
    <button class="btn bd bsm" data-action="logout">🚪</button>`);
  const userId = currentUser?.id;
  if (!userId) return;
  const activeCid = window.__enrolledCourseId;
  const schedules = await db.getByIndex('schedule', 'user_id', userId);
  const allLessons = await db.getAll('lessons');
  const allCourses = await db.getAll('courses');
  const now = new Date().toISOString().slice(0, 10);
  let grouped = schedules.filter(s => s.date >= now).sort((a, b) => a.date.localeCompare(b.date));
  if (activeCid) grouped = grouped.filter(s => s.course_id === activeCid);
  const html = grouped.map(s => {
    const course = allCourses.find(c => c.id === s.course_id);
    let lessonNames = [];
    try { lessonNames = JSON.parse(s.lesson_ids_json || '[]').map(id => { const l = allLessons.find(x => x.id === id); return l ? l.name : ''; }).filter(Boolean); } catch {}
    return `<div style="padding:12px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;margin-bottom:8px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
        <div>
          <div style="font-size:14px;font-weight:600">${s.date}</div>
          <div style="font-size:12px;color:var(--text3)">${course ? esc(course.name) : '—'}</div>
          <div style="font-size:12px;color:var(--text2);margin-top:4px">${lessonNames.join(' · ') || '—'}</div>
        </div>
        <div style="font-size:24px">📚</div>
      </div>
    </div>`;
  }).join('');
  document.getElementById('mc').innerHTML = `<div style="padding:22px 26px;max-width:640px;width:100%">
    <div class="sec-title" style="margin-bottom:16px">📅 Мій розклад</div>
    ${activeCid ? `<div style="font-size:12px;color:var(--text3);font-family:var(--mono);margin-bottom:8px">${esc(getCourseRef(activeCid)?.name || '')}</div>` : ''}
    ${html || '<div style="color:var(--text3);font-size:13px;font-family:var(--mono);padding:20px 0">Немає запланованих занять</div>'}
  </div>`;
  startStudentRefresh();
}

export async function showStudentProfile() {
  if (isAdmin()) return;
  stopStudentRefresh();
  stopLessonTimer();
  state.setCurrentView('profile');
  state.setCFid(null);
  state.setCLid(null);
  renderSB();
  setTopbar('👤 Мій кабінет', '', `<button class="btn bg bsm" data-action="show-home">🏠</button>
    <button class="btn bg bsm" data-action="show-student-schedule">📅 Розклад</button>
    <button class="btn bd bsm" data-action="logout">🚪</button>`);

  const uid = currentUser?.id;
  if (!uid) { document.getElementById('mc').innerHTML = ''; return; }
  const allUsers = await db.getAll('users');
  const user = allUsers.find(u => u.id === uid);
  if (!user) { document.getElementById('mc').innerHTML = ''; return; }

  const enrollments = await db.getAll('enrollments');
  const userEnrollments = enrollments.filter(e => e.user_id === uid);
  const activeCid = window.__enrolledCourseId;
  const course = activeCid ? getCourseRef(activeCid) : null;

  const allProgress = await db.getAll('progress');
  const userProgress = allProgress.filter(p => p.user_id === uid);
  const courseProgress = activeCid && course ? userProgress.filter(p => course.lessons.some(l => l.id === p.lesson_id)) : [];

  const totalLessons = course ? course.lessons.length : 0;
  const doneLessons = courseProgress.filter(p => p.status === 'done').length;
  const pct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

  const lastDone = courseProgress.filter(p => p.status === 'done').sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
  const lastLesson = lastDone.length > 0 ? lastDone[0] : null;
  const lastLessonName = lastLesson && course ? (course.lessons.find(l => l.id === lastLesson.lesson_id)?.name || '—') : '—';

  const allHomework = await db.getAll('homework');
  const userHomework = activeCid ? allHomework.filter(h => h.user_id === uid && h.course_id === activeCid) : [];

  const allSchedules = await db.getByIndex('schedule', 'user_id', uid);
  const upcomingSchedules = allSchedules.filter(s => s.date >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const allLessons = await db.getAll('lessons');
  const scheduleHtml = upcomingSchedules.length ? `
    <div class="sec-title-sm" style="margin-bottom:6px;margin-top:14px">📅 Найближчі заняття</div>
    ${upcomingSchedules.map(s => {
      let lessonNames = [];
      try { lessonNames = JSON.parse(s.lesson_ids_json || '[]').map(id => { const l = allLessons.find(x => x.id === id); return l ? l.name : ''; }).filter(Boolean); } catch {}
      return `<div style="padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;font-size:12px;margin-bottom:4px">
        <span style="font-weight:600">${s.date}</span> · ${lessonNames.join(', ') || '—'}
      </div>`;
    }).join('')}
    <button class="btn bg bsm" data-action="show-student-schedule" style="margin-top:6px;font-size:11px">📅 Весь розклад</button>` : '';

  const hwHtml = userHomework.length ? `
    <div class="sec-title-sm" style="margin-bottom:6px;margin-top:14px">📝 Домашні завдання</div>
    ${userHomework.map(h => {
      const lesson = allLessons.find(l => l.id === h.lesson_id);
      return `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;font-size:12px;margin-bottom:4px">
        <span style="font-size:10px;color:${h.status === 'done' ? 'var(--green)' : h.status === 'returned' ? 'var(--amber)' : 'var(--text3)'}">${h.status === 'done' ? '✓' : h.status === 'returned' ? '↺' : '◷'}</span>
        <span style="flex:1">${esc(lesson?.name || '—')}</span>
        <span style="font-size:10px;color:var(--text3);font-family:var(--mono)">${h.status}</span>
      </div>`;
    }).join('')}` : '';

  const archivedCourses = [];
  for (const enrolled of userEnrollments) {
    const c = getCourseRef(enrolled.course_id);
    if (!c || !c.lessons.length) continue;
    const courseLessonsDone = c.lessons.every(l => userProgress.some(p => p.lesson_id === l.id && p.status === 'done'));
    if (courseLessonsDone) archivedCourses.push(c);
  }
  const archivedHtml = archivedCourses.length ? `
    <div class="sec-title-sm" style="margin-bottom:6px;margin-top:14px">📦 Архів</div>
    <div style="display:flex;flex-wrap:wrap;gap:4px">${archivedCourses.map(c => `<span style="padding:3px 10px;border-radius:20px;background:var(--green);color:#000;font-size:11px;font-weight:600">${esc(c.name)} ✓</span>`).join('')}</div>` : '';

  document.getElementById('mc').innerHTML = `<div style="padding:22px 26px;max-width:640px;width:100%">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
      <div style="width:48px;height:48px;border-radius:50%;background:var(--accent2);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800">${(user.name || '?')[0].toUpperCase()}</div>
      <div>
        <div style="font-size:20px;font-weight:800">${esc(user.name)}</div>
        <div style="font-size:12px;color:var(--text3);font-family:var(--mono)">${esc(user.email)}</div>
        <div style="font-size:12px;font-weight:600;margin-top:4px">${course ? esc(course.name) : 'Курс не обрано'}</div>
      </div>
      <div style="margin-left:auto;text-align:center">
        <div style="font-size:24px;font-weight:800">${pct}%</div>
        <div style="font-size:10px;color:var(--text3);font-family:var(--mono)">прогрес</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">
      <div style="text-align:center;padding:10px;background:var(--surface2);border-radius:10px">
        <div style="font-size:18px;font-weight:700">${doneLessons}</div>
        <div style="font-size:10px;color:var(--text3)">пройдено</div>
      </div>
      <div style="text-align:center;padding:10px;background:var(--surface2);border-radius:10px">
        <div style="font-size:18px;font-weight:700">${totalLessons - doneLessons}</div>
        <div style="font-size:10px;color:var(--text3)">залишилось</div>
      </div>
      <div style="text-align:center;padding:10px;background:var(--surface2);border-radius:10px">
        <div style="font-size:18px;font-weight:700">${userHomework.filter(h => h.status === 'done').length}</div>
        <div style="font-size:10px;color:var(--text3)">ДЗ виконано</div>
      </div>
      <div style="text-align:center;padding:10px;background:var(--surface2);border-radius:10px">
        <div style="font-size:14px;font-weight:700">${esc(getCourseRef(activeCid)?.name || '')}</div>
        <div style="font-size:9px;color:var(--text3)">активний курс</div>
      </div>
    </div>

    <div class="last-lesson-card" style="padding:12px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;margin-bottom:6px">
      <div style="font-size:11px;color:var(--text3);font-family:var(--mono);margin-bottom:4px">⏺ Останній пройдений урок</div>
      <div style="font-size:14px;font-weight:600">${lastLesson ? esc(lastLessonName) : '—'}</div>
      ${lastLesson && activeCid ? `<button class="btn bp bsm" style="margin-top:8px;font-size:11px" data-action="go-to-student-lesson" data-course-id="${activeCid}" data-lesson-id="${lastLesson.lesson_id}">→ До уроку</button>` : ''}
    </div>

    ${scheduleHtml}
    ${hwHtml}
    ${archivedHtml}
  </div>`;
  startStudentRefresh();
}

export async function renderStudentHomeHomework() {
  const el = document.getElementById('studentHomeHomework');
  if (!el) return;
  const activeCid = window.__enrolledCourseId;
  if (!activeCid) { el.innerHTML = ''; return; }
  const allHomework = await db.getAll('homework');
  const userHw = allHomework.filter(h => h.user_id === currentUser?.id && h.course_id === activeCid && h.status !== 'done');
  if (!userHw.length) return;
  const allLessons = await db.getAll('lessons');
  el.innerHTML = `
    <div class="sec-title" style="margin-top:16px">📝 Активні домашні завдання</div>
    ${userHw.map(h => {
      const lesson = allLessons.find(l => l.id === h.lesson_id);
      const tasks = h.tasks || [];
      const typeBadges = [...new Set(tasks.map(t => t.type))].slice(0, 3).map(t => NAMES[t] || t);
      return `<div style="padding:12px 14px;background:var(--surface2);border:1px solid ${h.status === 'returned' ? 'var(--amber)' : 'var(--accent)'};border-radius:10px;margin-bottom:8px;border-left:3px solid ${h.status === 'returned' ? 'var(--amber)' : 'var(--accent)'}">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:${tasks.length ? '8px' : '0'}">
          <div>
            <div style="font-size:13px;font-weight:600">${esc(lesson?.name || '—')}</div>
            <div style="font-size:11px;color:var(--text3);font-family:var(--mono)">${tasks.length} завдань · ${esc(typeBadges.join(', '))}</div>
          </div>
          ${h.status === 'returned' ? '<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:var(--amber);color:#000;font-family:var(--mono)">🔙 Повернено</span>' : ''}
        </div>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
          <button class="btn bb bsm" data-action="show-homework" style="font-size:11px;padding:4px 10px">📝 Відкрити ДЗ</button>
          <button class="btn bgr bsm" data-action="hw-mark-done" data-hw-id="${h.id}" style="font-size:11px;padding:4px 10px">✓ Виконано</button>
        </div>
      </div>`;
    }).join('')}`;
}

export function showToast(msg) {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;bottom:24px;right:24px;background:var(--surface);border:1px solid var(--border2);border-radius:12px;padding:14px 20px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 8px 30px rgba(0,0,0,.5);max-width:360px;transition:opacity .2s';
  d.textContent = msg;
  document.body.appendChild(d);
  setTimeout(() => { d.style.opacity = '0'; d.style.transition = 'opacity .2s'; setTimeout(() => d.remove(), 200); }, 3000);
}
