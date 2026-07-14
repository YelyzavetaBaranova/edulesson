import { esc } from '../utils.js';
import { NAMES, INTERACTIVE_TYPES } from '../constants.js';
import {
  buildChoose,
  buildFillIn,
  buildFillInBox,
  buildOrder,
  buildPhoto,
  buildGallery,
  buildVideo,
  buildWordwall,
  buildGame,
  buildTextBlock,
  buildMatch,
} from './builders.js';

const BUILDERS = {
  choose: buildChoose,
  fillin: buildFillIn,
  fillinbox: buildFillInBox,
  order: buildOrder,
  photo: buildPhoto,
  gallery: buildGallery,
  video: buildVideo,
  wordwall: buildWordwall,
  game: buildGame,
  text: buildTextBlock,
  match: buildMatch,
};

export function renderTask(t, i, fid, lid) {
  const build = BUILDERS[t.type];
  const body = build ? build(t) : '';
  const isInteractive = INTERACTIVE_TYPES.includes(t.type);
  const num = String(i + 1).padStart(2, '0');

  let hintHtml = '';
  if (t.hint || t.hintImg) {
    const htxt = t.hint ? `<div>${esc(t.hint)}</div>` : '';
    const himg = t.hintImg ? `<img src="${t.hintImg}" alt="hint">` : '';
    hintHtml = `
      <div class="hint-btn" id="ht-${t.id}" data-action="toggle-hint" data-tid="${t.id}">
        <i class="hint-chev">▶</i> 💡 Підказка
      </div>
      <div class="hint-body" id="hb-${t.id}">${htxt}${himg}</div>`;
  }

  return `
  <div class="task-card tc-${t.type}" id="tc-${t.id}" data-task-input="${isInteractive ? t.input.replace(/"/g, '&quot;').replace(/\n/g, '&#10;') : ''}">
    <div class="task-drag-handle" draggable="true" data-tid="${t.id}" title="Перетягни, щоб змінити порядок">⠿</div>
    <div class="task-number">${num}</div>
    ${t.instruction ? `<div class="t-instr">${esc(t.instruction)}</div>` : ''}
    <div class="task-body" id="tb-${t.id}">${body}</div>
    ${isInteractive ? `<div class="task-fb" id="fb-${t.id}"></div>` : ''}
    ${hintHtml}
    <div class="task-bottom">
      ${
        isInteractive
          ? `
        <div class="task-actions-left">
          <button class="btn bgr bsm" data-action="check-one" data-tid="${t.id}" data-type="${t.type}">✓ Check</button>
          <button class="btn bamb bsm" id="sa-${t.id}" style="display:none" data-action="show-answer" data-tid="${t.id}" data-type="${t.type}">👁 Show answer</button>
          <button class="btn breset bsm" data-action="reset-task" data-tid="${t.id}" data-type="${t.type}">↺ Reset</button>
        </div>`
          : '<div></div>'
      }
      <div class="task-menu-wrap">
        <button class="task-menu-btn" data-action="toggle-task-menu" data-tid="${t.id}">•••</button>
        <div class="task-menu-pop" id="tmenu-${t.id}">
          <div class="tm-item" data-action="move-task-up" data-fid="${fid}" data-lid="${lid}" data-tid="${t.id}">↑ Вище</div>
          <div class="tm-item" data-action="move-task-down" data-fid="${fid}" data-lid="${lid}" data-tid="${t.id}">↓ Нижче</div>
          <div class="tm-item" data-action="edit-task" data-fid="${fid}" data-lid="${lid}" data-tid="${t.id}">✏️ Редагувати</div>
          <div class="tm-item danger" data-action="del-task" data-fid="${fid}" data-lid="${lid}" data-tid="${t.id}">🗑 Видалити</div>
        </div>
      </div>
    </div>
  </div>`;
}

export function getTaskTitle(t, i) {
  if (t.instruction) return t.instruction;
  return `${NAMES[t.type] || t.type}`;
}

export function renderSectionsListHTML(tasks) {
  if (!tasks.length) return '<div style="color:var(--text3);font-size:11px;font-family:var(--mono);padding:8px">No tasks yet</div>';
  return tasks
    .map((t, i) => {
      const title = getTaskTitle(t, i);
      const num = String(i + 1).padStart(2, '0');
      return `<div class="section-item"><span class="si-num">${num}</span><span>${esc(title)}</span></div>`;
    })
    .join('');
}

export function renderTasksHTML(lesson, fid) {
  const tasks = lesson.tasks || [];
  let html = '';
  if (!tasks.length) {
    html =
      '<div class="empty-state"><div class="empty-icon">✏️</div><div class="empty-text">Завдань ще немає.<br>Натисни «＋ Додати завдання»</div></div>';
  } else {
    html += `<div id="tasksList" data-fid="${fid}" data-lid="${lesson.id}">`;
    tasks.forEach((t, i) => {
      html += renderTask(t, i, fid, lesson.id);
    });
    html += '</div>';
  }
  html += `<div class="add-task-btn" data-action="open-ct" data-fid="${fid}" data-lid="${lesson.id}">＋ Додати завдання</div>`;
  return html;
}
