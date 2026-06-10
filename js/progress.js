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

export async function getUserCourseId() {
  if (!currentUser) return null;
  if (currentUser.role === 'admin') return null;
  const enrollments = await db.getByIndex('enrollments', 'user_id', currentUser.id);
  return enrollments.length > 0 ? enrollments[0].course_id : null;
}
