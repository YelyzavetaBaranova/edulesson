import { D, getLessonRef, save } from '../store.js';

let dragTid = null;

export function initTaskReorder(courseId, lessonId) {
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
      await moveTask(courseId, lessonId, dragTid, targetTid);
      dragTid = null;
      const nav = await import('../navigation.js');
      nav.openLesson(courseId, lessonId);
    });
  });
}

async function moveTask(courseId, lessonId, fromTid, toTid) {
  const lesson = getLessonRef(courseId, lessonId);
  if (!lesson?.tasks) return;
  const fromIdx = lesson.tasks.findIndex((t) => t.id === fromTid);
  const toIdx = lesson.tasks.findIndex((t) => t.id === toTid);
  if (fromIdx < 0 || toIdx < 0) return;
  const [item] = lesson.tasks.splice(fromIdx, 1);
  lesson.tasks.splice(toIdx, 0, item);
  await save();
}

export async function moveTaskUp(courseId, lessonId, taskId) {
  const lesson = getLessonRef(courseId, lessonId);
  if (!lesson?.tasks) return;
  const idx = lesson.tasks.findIndex((t) => t.id === taskId);
  if (idx <= 0) return;
  [lesson.tasks[idx - 1], lesson.tasks[idx]] = [lesson.tasks[idx], lesson.tasks[idx - 1]];
  await save();
  const nav = await import('../navigation.js');
  nav.openLesson(courseId, lessonId);
}

export async function moveTaskDown(courseId, lessonId, taskId) {
  const lesson = getLessonRef(courseId, lessonId);
  if (!lesson?.tasks) return;
  const idx = lesson.tasks.findIndex((t) => t.id === taskId);
  if (idx < 0 || idx >= lesson.tasks.length - 1) return;
  [lesson.tasks[idx + 1], lesson.tasks[idx]] = [lesson.tasks[idx], lesson.tasks[idx + 1]];
  await save();
  const nav = await import('../navigation.js');
  nav.openLesson(courseId, lessonId);
}
