import { esc } from './utils.js';
import { D } from './store.js';
import * as state from './state.js';
import { renderTasksHTML, renderSectionsListHTML } from './tasks/render.js';
import { initDrag, initFillInBoxDrag } from './tasks/interactions.js';
import { initTaskReorder } from './tasks/reorder.js';
import { buildVocabPanelHTML } from './vocab.js';
import { buildTranslatePanelHTML } from './translator.js';

export function toggleSB() {
  state.setSbOpen(!state.sbOpen);
  document.getElementById('sidebar').classList.toggle('collapsed', !state.sbOpen);
  const tb = document.getElementById('sbToggle');
  tb.classList.toggle('open', state.sbOpen);
  tb.textContent = state.sbOpen ? '‹' : '›';
}

export function renderSB() {
  const el = document.getElementById('folderList');
  if (!D.folders.length) {
    el.innerHTML =
      '<div style="padding:16px 10px;font-size:11px;color:var(--text3);font-family:var(--mono);line-height:1.8">Ще немає папок.<br>Натисни «＋ Папка»</div>';
    return;
  }
  el.innerHTML = D.folders
    .map((f) => {
      const ls = D.lessons[f.id] || [];
      const isOpen = state.cFid === f.id;
      return `<div class="folder-item ${isOpen ? 'open' : ''}">
      <div class="folder-hdr ${isOpen ? 'active' : ''}" data-action="toggle-folder" data-fid="${f.id}">
        <span style="font-size:13px">📁</span>
        <span class="f-name">${esc(f.name)}</span>
        <span class="f-cnt">${ls.length}</span>
        <span class="f-chev">▶</span>
      </div>
      <div class="f-lessons">
        ${ls
          .map(
            (l) =>
              `<div class="l-item ${state.cLid === l.id ? 'active' : ''}" data-action="open-lesson" data-fid="${f.id}" data-lid="${l.id}">
          <span class="l-dot"></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(l.name)}</span></div>`
          )
          .join('')}
        <div class="l-item" style="color:var(--accent);opacity:.75" data-action="open-cl" data-fid="${f.id}">
          <span style="font-size:13px">＋</span><span>Новий урок</span></div>
      </div>
    </div>`;
    })
    .join('');
}

export function toggleFolder(fid) {
  if (state.cFid === fid && !state.cLid) {
    state.setCFid(null);
    state.setCLid(null);
    showHome();
  } else {
    state.setCFid(fid);
    state.setCLid(null);
    showFolderView(
      D.folders.find((x) => x.id === fid),
      D.lessons[fid] || []
    );
  }
  renderSB();
}

export function setTopbar(title, bread, actions) {
  document.getElementById('tbTitle').textContent = title;
  document.getElementById('tbBread').innerHTML = bread;
  document.getElementById('tbActions').innerHTML = actions;
}

export function showHome() {
  state.setCFid(null);
  state.setCLid(null);
  renderSB();
  setTopbar('Головна', '', '');
  const tf = D.folders.length;
  const tl = Object.values(D.lessons).reduce((s, a) => s + a.length, 0);
  const tt = Object.values(D.lessons)
    .flatMap((a) => a)
    .reduce((s, l) => s + (l.tasks || []).length, 0);
  document.getElementById('mc').innerHTML = `<div style="padding:22px 26px;max-width:880px;width:100%">
    <div class="home-hero">
      <div class="hero-badge">Конструктор уроків EN</div>
      <div class="hero-title">Створюй уроки.<br>Будуй знання.</div>
      <div class="hero-sub">Папки → Уроки → Інтерактивні завдання для учнів.</div>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-num">${tf}</div><div class="stat-label">Папок</div></div>
        <div class="stat-card"><div class="stat-num">${tl}</div><div class="stat-label">Уроків</div></div>
        <div class="stat-card"><div class="stat-num">${tt}</div><div class="stat-label">Завдань</div></div>
      </div>
    </div>
    <div class="sec-title">📂 Всі папки</div>
    ${
      D.folders.length
        ? D.folders
            .map(
              (f) => `
      <div class="task-card tc-choose" style="cursor:pointer" data-action="toggle-folder" data-fid="${f.id}">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
          <div>
            <div style="font-size:14px;font-weight:700;margin-bottom:2px">${esc(f.name)}</div>
            <div style="font-size:11px;color:var(--text3);font-family:var(--mono)">${(D.lessons[f.id] || []).length} уроків</div>
          </div>
          <span style="font-size:18px;opacity:.4">›</span>
        </div>
      </div>`
            )
            .join('')
        : '<div class="empty-state"><div class="empty-icon">📁</div><div class="empty-text">Папок ще немає</div></div>'
    }
  </div>`;
}

export function showFolderView(folder, lessons) {
  setTopbar(
    folder.name,
    'Папка',
    `<button class="btn bp bsm" data-action="open-cl" data-fid="${folder.id}">＋ Урок</button>
    <button class="btn bd bsm" data-action="del-folder" data-fid="${folder.id}">🗑</button>`
  );
  document.getElementById('mc').innerHTML = `<div style="padding:22px 26px;max-width:880px;width:100%">
    <div style="margin-bottom:17px">
      <div style="font-size:19px;font-weight:800;margin-bottom:3px">${esc(folder.name)}</div>
      <div style="font-size:11px;color:var(--text3);font-family:var(--mono)">${lessons.length} уроків</div>
    </div>
    <div class="sec-title">📖 Уроки</div>
    ${
      lessons.length
        ? lessons
            .map(
              (l) => `
      <div class="task-card tc-fillin" style="cursor:pointer" data-action="open-lesson" data-fid="${folder.id}" data-lid="${l.id}">
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
        : '<div class="empty-state"><div class="empty-icon">📖</div><div class="empty-text">Уроків немає</div></div>'
    }
    <div class="add-task-btn" data-action="open-cl" data-fid="${folder.id}">＋ Додати урок</div>
  </div>`;
}

export function openLesson(fid, lid) {
  state.setCFid(fid);
  state.setCLid(lid);
  state.setCTab('lesson');
  state.setCSidePanel('tasks');
  renderSB();
  const folder = D.folders.find((x) => x.id === fid);
  const lesson = (D.lessons[fid] || []).find((x) => x.id === lid);
  if (!lesson) return;
  setTopbar(
    lesson.name,
    `<span>${esc(folder.name)}</span> › <span>${esc(lesson.name)}</span>`,
    `<button class="btn bd bsm" data-action="del-lesson" data-fid="${fid}" data-lid="${lid}">🗑 Урок</button>`
  );
  renderLessonLayout(lesson, fid);
}

export function renderLessonLayout(lesson, fid) {
  const tasks = lesson.tasks || [];

  document.getElementById('mc').innerHTML = `
    <div class="lesson-layout">
      <div class="lesson-left-icons" id="leftIcons">
        <div class="side-icon-btn active" id="si-tasks" title="Завдання" data-action="set-side-panel" data-panel="tasks">📋</div>
        <div class="side-icon-btn" id="si-vocab" title="Словник" data-action="set-side-panel" data-panel="vocab">📖</div>
        <div class="side-icon-btn" id="si-translate" title="Перекладач" data-action="set-side-panel" data-panel="translate">🔤</div>
      </div>
      <div class="lesson-content-area" id="lessonContentArea">
        <button class="change-unit-btn" data-action="show-folder" data-fid="${fid}">← Change unit</button>
        <div class="lesson-top-title">${esc(lesson.name)}</div>
        <div id="lessonTaskArea">
          ${renderTasksHTML(lesson, fid)}
        </div>
      </div>
      <div class="lesson-sections-sidebar" id="sectionsSidebar">
        <div class="sections-header">Sections</div>
        <div class="sections-list" id="sectionsList">
          ${renderSectionsListHTML(tasks)}
        </div>
        <div class="sections-footer">
          <div class="sections-score" id="sectionsScoreDisplay">0/0 correct</div>
          <button class="btn bgr" data-action="check-all" data-fid="${fid}" data-lid="${lesson.id}">✓ Check All</button>
          <button class="btn bg" data-action="reset-all" data-fid="${fid}" data-lid="${lesson.id}">↺ Reset</button>
        </div>
      </div>
    </div>`;
  initDrag();
  initFillInBoxDrag();
  initTaskReorder(fid, lesson.id);
}

export function setSidePanel(panel) {
  const prev = state.cSidePanel;
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
    panelEl.style.cssText =
      'width:300px;border-left:1px solid var(--border);background:var(--surface);overflow-y:auto;flex-shrink:0';
    panelEl.innerHTML = buildVocabPanelHTML();
    lca.parentElement.appendChild(panelEl);
  } else if (panel === 'translate') {
    const panelEl = document.createElement('div');
    panelEl.id = 'sidePanelArea';
    panelEl.style.cssText =
      'width:320px;border-left:1px solid var(--border);background:var(--surface);overflow-y:auto;flex-shrink:0';
    panelEl.innerHTML = buildTranslatePanelHTML();
    lca.parentElement.appendChild(panelEl);
  }
}

export function setLTab(tab, fid, lid) {
  state.setCTab(tab);
  document.querySelectorAll('.lesson-tab').forEach((t) => t.classList.remove('active'));
  const tEl = document.getElementById(`tab-${tab}`);
  if (tEl) tEl.classList.add('active');
  const lesson = (D.lessons[fid] || []).find((x) => x.id === lid);
  if (!lesson) return;
  const area = document.getElementById('lessonTaskArea');
  if (!area) return;
  area.innerHTML = `
    ${renderTasksHTML(lesson, fid)}`;
  initDrag();
  initFillInBoxDrag();
  initTaskReorder(fid, lid);
}
