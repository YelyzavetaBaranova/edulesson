import * as db from './db/index.js';
import { getLessonRef } from './store.js';
import { currentUser } from './auth.js';
import { esc } from './utils.js';
import { INTERACTIVE_TYPES } from './constants.js';

export async function syncHomework(lessonId) {
  if (!currentUser || currentUser.role === 'admin') return;
  const all = await db.getAll('homework');
  const existing = all.filter((h) => h.lesson_id === lessonId && h.user_id === currentUser.id);
  const existingMap = {};
  existing.forEach((h) => { existingMap[h.task_id] = h; });

  const allLessons = await db.getAll('lessons');
  const lesson = allLessons.find((l) => l.id === lessonId);
  if (!lesson) return;

  const tasks = lesson.tasks || [];
  for (const task of tasks) {
    if (!INTERACTIVE_TYPES.includes(task.type)) continue;
    if (!existingMap[task.id]) {
      await db.add('homework', {
        user_id: currentUser.id,
        lesson_id: lessonId,
        task_id: task.id,
        title: task.instruction || task.type,
        status: 'todo',
        created_at: new Date().toISOString(),
      });
    }
  }
}

export async function markHomeworkDone(taskId) {
  if (!currentUser) return;
  const all = await db.getAll('homework');
  const hw = all.find((h) => h.task_id === taskId && h.user_id === currentUser.id);
  if (hw) {
    hw.status = 'done';
    await db.put('homework', hw);
  }
}

export async function markHomeworkDoneById(hwId) {
  const hw = await db.get('homework', hwId);
  if (hw) {
    hw.status = 'done';
    await db.put('homework', hw);
  }
}

export function buildHomeworkPanelHTML() {
  return `<div class="vocab-panel" style="max-width:600px">
    <div class="vocab-title">📝 Домашнє завдання</div>
    <div id="homeworkList"></div>
  </div>`;
}

export async function renderHomeworkList() {
  const el = document.getElementById('homeworkList');
  if (!el) return;
  const all = await db.getAll('homework');
  const userHw = all.filter((h) => h.user_id === currentUser?.id && h.status === 'todo');
  if (!userHw.length) {
    el.innerHTML = '<div style="color:var(--text3);font-size:12px;font-family:var(--mono);padding:8px 0">Домашнього завдання немає 🎉</div>';
    return;
  }
  el.innerHTML = userHw.map((h) => {
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 13px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;margin-bottom:6px">
      <span style="flex:1;font-size:13px">${esc(h.title)}</span>
      <span style="font-size:10px;color:var(--text3);font-family:var(--mono)">ID: ${h.lesson_id.toString().slice(0, 6)}</span>
      <button class="btn bgr bsm" data-action="hw-done" data-hw-id="${h.id}" style="padding:4px 10px;font-size:11px">✓</button>
    </div>`;
  }).join('');
}
