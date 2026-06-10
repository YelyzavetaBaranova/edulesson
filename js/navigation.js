import { esc } from './utils.js';
import { D, getCourseRef, getLessonRef, save, saveVocab, loadVocab } from './store.js';
import * as state from './state.js';
import * as db from './db/index.js';
import { renderTasksHTML, renderSectionsListHTML } from './tasks/render.js';
import { initDrag, initFillInBoxDrag } from './tasks/interactions.js';
import { initTaskReorder } from './tasks/reorder.js';
import { buildVocabPanelHTML } from './vocab.js';
import { buildTranslatePanelHTML } from './translator.js';
import { buildTeacherHomeworkPanelHTML, buildStudentHomeworkPanelHTML, renderTeacherHomeworkList, renderStudentHomeworkList, createHomework } from './homework.js';
import { currentUser, isAdmin } from './auth.js';
import { updateProgress, getUserCourseIds, startLessonTimer, stopLessonTimer } from './progress.js';

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

function setActiveCourse(courseId) {
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
    el.innerHTML = `<button class="btn bg bsm" data-action="show-homework" style="flex:1;font-size:13px">📝 Домашнє завдання</button>
      <button class="btn bg bico" data-action="show-student-schedule" title="Розклад">📅</button>
      <button class="btn bg bico" data-action="show-home" title="Головна">🏠</button>
      <button class="btn bg bico" data-action="show-vocab-page" title="Словник">📖</button>`;
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
      el.innerHTML = '<div style="padding:16px 10px;font-size:11px;color:var(--text3);font-family:var(--mono);line-height:1.8">Немає доступних курсів</div>';
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
  const coursePicker = cids.length > 1 ? `
    <div class="course-picker" style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
      ${cids.map(cid => {
        const c = getCourseRef(cid);
        if (!c) return '';
        const active = cid === window.__enrolledCourseId ? 'background:var(--accent);color:#000' : 'background:var(--surface2);border:1px solid var(--border);color:var(--text2)';
        return `<button class="course-pill" style="padding:6px 16px;border-radius:20px;border:none;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--display);transition:all .12s;${active}" data-action="switch-course" data-cid="${c.id}">${esc(c.name)}</button>`;
      }).join('')}
    </div>` : '';
  document.getElementById('mc').innerHTML = `<div style="padding:22px 26px;max-width:880px;width:100%">
    <div class="home-hero">
      <div class="hero-badge">Мої курси</div>
      <div class="hero-title">Продовжуй навчання.</div>
      <div class="hero-sub">${tc ? `${tc} курсів · ${tl} уроків · ${tt} завдань` : 'Обери курс і продовжуй уроки'}</div>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-num">${tc}</div><div class="stat-label">Курсів</div></div>
        <div class="stat-card"><div class="stat-num">${tl}</div><div class="stat-label">Уроків</div></div>
        <div class="stat-card"><div class="stat-num">${tt}</div><div class="stat-label">Завдань</div></div>
      </div>
    </div>
    ${coursePicker}
    <div class="sec-title">📂 Всі курси</div>
    ${
      courses.length
        ? courses
            .map(
              (c) => `
      <div class="task-card tc-choose" style="cursor:pointer" data-action="toggle-folder" data-fid="${c.id}">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
          <div>
            <div style="font-size:14px;font-weight:700;margin-bottom:2px">${esc(c.name)}</div>
            <div style="font-size:11px;color:var(--text3);font-family:var(--mono)">${c.lessons.length} уроків</div>
          </div>
          <span style="font-size:18px;opacity:.4">›</span>
        </div>
      </div>`
            )
            .join('')
        : '<div class="empty-state"><div class="empty-icon">📁</div><div class="empty-text">Курсів ще немає</div></div>'
    }
  </div>`;
}

function buildHomeActions() {
  return `<button class="btn bd bsm" data-action="logout">🚪</button>`;
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
          ${isAdm ? `<button class="btn bp bsm" data-action="create-hw-from-lesson" data-fid="${courseId}" data-lid="${lesson.id}">📝 ДЗ</button>` : lessonDone ? '<div style="font-size:11px;color:var(--green);font-family:var(--mono);padding:6px 0">✓ Урок пройдено</div>' : `<button class="btn bp" data-action="mark-done" data-fid="${courseId}" data-lid="${lesson.id}">✓ Lesson done</button>`}
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
  state.setCFid(null);
  state.setCLid(null);
  renderSB();
  setTopbar('Домашнє завдання', '', `<button class="btn bg bsm" data-action="show-home">🏠</button>
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
  }
}

export async function showVocabPage() {
  state.setCFid(null);
  state.setCLid(null);
  renderSB();
  setTopbar('Словник', '', `<button class="btn bg bsm" data-action="show-home">🏠</button>
    <button class="btn bd bsm" data-action="logout">🚪</button>`);
  const { buildVocabPageHTML, renderVocabPage } = await import('./vocab.js');
  document.getElementById('mc').innerHTML = `<div style="padding:22px 26px;max-width:880px;width:100%">
    ${buildVocabPageHTML()}
  </div>`;
  await renderVocabPage();
}

export async function showProfile(userId, courseId) {
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
  stopLessonTimer();
  state.setCFid(null);
  state.setCLid(null);
  renderSB();
  setTopbar('📅 Розклад', '', `<button class="btn bg bsm" data-action="show-home">🏠</button>
    <button class="btn bd bsm" data-action="logout">🚪</button>`);
  const userId = currentUser?.id;
  if (!userId) return;
  const schedules = await db.getByIndex('schedule', 'user_id', userId);
  const allLessons = await db.getAll('lessons');
  const allCourses = await db.getAll('courses');
  const now = new Date().toISOString().slice(0, 10);
  const grouped = schedules.filter(s => s.date >= now).sort((a, b) => a.date.localeCompare(b.date));
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
    ${html || '<div style="color:var(--text3);font-size:13px;font-family:var(--mono);padding:20px 0">Немає запланованих занять</div>'}
  </div>`;
}
