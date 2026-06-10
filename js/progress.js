import * as db from './db/index.js';
import { currentUser } from './auth.js';

export async function updateProgress(lessonId, status) {
  if (!currentUser) return;
  const existing = await db.getByCompositeIndex('progress', 'user_lesson', [currentUser.id, lessonId]);
  if (existing.length > 0) {
    existing[0].status = status;
    existing[0].updated_at = new Date().toISOString();
    await db.put('progress', existing[0]);
  } else {
    await db.add('progress', {
      user_id: currentUser.id,
      lesson_id: lessonId,
      status,
      updated_at: new Date().toISOString(),
    });
  }
}

export async function getProgress(lessonId) {
  if (!currentUser) return null;
  const existing = await db.getByCompositeIndex('progress', 'user_lesson', [currentUser.id, lessonId]);
  return existing.length > 0 ? existing[0] : null;
}

export async function getUserCourseIds() {
  if (!currentUser) return [];
  if (currentUser.role === 'admin') return [];
  const enrollments = await db.getByIndex('enrollments', 'user_id', currentUser.id);
  return enrollments.map(e => e.course_id).filter(Boolean);
}

/* ─── Activity tracking (time spent on lessons) ─── */

let _activeSessionId = null;

export async function startLessonTimer(lessonId, courseId) {
  if (!currentUser || currentUser.role === 'admin') return;
  if (_activeSessionId) await stopLessonTimer();
  try {
    const result = await db.add('activity', { user_id: currentUser.id, lesson_id: lessonId, course_id: courseId });
    _activeSessionId = result.id;
  } catch { /* ignore */ }
}

export async function stopLessonTimer() {
  if (!_activeSessionId) return;
  try {
    await fetch(`/api/activity/${_activeSessionId}/stop`, { method: 'PUT', headers: { 'Content-Type': 'application/json' } });
  } catch { /* ignore */ }
  _activeSessionId = null;
}

export async function getStudentActivity(userId, courseId) {
  const all = await db.getByIndex('activity', 'user_id', userId);
  return courseId ? all.filter(a => a.course_id === courseId) : all;
}

export async function getTotalTimePerCourse(userId, courseId) {
  const activities = await getStudentActivity(userId, courseId);
  return activities.reduce((sum, a) => sum + (a.duration_seconds || 0), 0);
}
