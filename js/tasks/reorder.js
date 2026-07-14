import { D, save } from '../store.js';

let dragTid = null;

export function initTaskReorder(fid, lid) {
  const list = document.getElementById('tasksList');
  if (!list) return;

  list.querySelectorAll('.task-drag-handle').forEach((handle) => {
    handle.addEventListener('dragstart', (e) => {
      dragTid = handle.dataset.tid;
      e.dataTransfer.effectAllowed = 'move';
      const card = document.getElementById(`tc-${dragTid}`);
      if (card) card.classList.add('task-dragging');
    });
    handle.addEventListener('dragend', () => {
      dragTid = null;
      list.querySelectorAll('.task-card').forEach((c) => c.classList.remove('task-dragging', 'task-drag-over'));
    });
  });

  list.querySelectorAll('.task-card').forEach((card) => {
    card.addEventListener('dragover', (e) => {
      if (!dragTid || card.id === `tc-${dragTid}`) return;
      e.preventDefault();
      card.classList.add('task-drag-over');
    });
    card.addEventListener('dragleave', () => card.classList.remove('task-drag-over'));
    card.addEventListener('drop', async (e) => {
      e.preventDefault();
      card.classList.remove('task-drag-over');
      const targetTid = card.id.replace('tc-', '');
      if (!dragTid || dragTid === targetTid) return;
      moveTask(fid, lid, dragTid, targetTid);
      dragTid = null;
      const nav = await import('../navigation.js');
      nav.openLesson(fid, lid);
    });
  });
}

function moveTask(fid, lid, fromTid, toTid) {
  const lesson = (D.lessons[fid] || []).find((x) => x.id === lid);
  if (!lesson?.tasks) return;
  const fromIdx = lesson.tasks.findIndex((t) => t.id === fromTid);
  const toIdx = lesson.tasks.findIndex((t) => t.id === toTid);
  if (fromIdx < 0 || toIdx < 0) return;
  const [item] = lesson.tasks.splice(fromIdx, 1);
  lesson.tasks.splice(toIdx, 0, item);
  save();
}

export async function moveTaskUp(fid, lid, tid) {
  const lesson = (D.lessons[fid] || []).find((x) => x.id === lid);
  if (!lesson?.tasks) return;
  const idx = lesson.tasks.findIndex((t) => t.id === tid);
  if (idx <= 0) return;
  [lesson.tasks[idx - 1], lesson.tasks[idx]] = [lesson.tasks[idx], lesson.tasks[idx - 1]];
  save();
  const nav = await import('../navigation.js');
  nav.openLesson(fid, lid);
}

export async function moveTaskDown(fid, lid, tid) {
  const lesson = (D.lessons[fid] || []).find((x) => x.id === lid);
  if (!lesson?.tasks) return;
  const idx = lesson.tasks.findIndex((t) => t.id === tid);
  if (idx < 0 || idx >= lesson.tasks.length - 1) return;
  [lesson.tasks[idx + 1], lesson.tasks[idx]] = [lesson.tasks[idx], lesson.tasks[idx + 1]];
  save();
  const nav = await import('../navigation.js');
  nav.openLesson(fid, lid);
}
