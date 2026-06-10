import { D, getCourseRef, getLessonRef, delCourse, delLesson as delLessonDB, save } from './store.js';
import * as state from './state.js';

export async function delTask(courseId, lessonId, taskId) {
  if (!confirm('Видалити завдання?')) return;
  const lesson = getLessonRef(courseId, lessonId);
  if (!lesson) return;
  lesson.tasks = (lesson.tasks || []).filter((x) => x.id !== taskId);
  await save();
  const nav = await import('./navigation.js');
  nav.openLesson(courseId, lessonId);
}

export async function delLesson(courseId, lessonId) {
  if (!confirm('Видалити урок?')) return;
  await delLessonDB(courseId, lessonId);
  state.setCLid(null);
  const nav = await import('./navigation.js');
  const course = getCourseRef(courseId);
  if (course) nav.showCourseView(course);
  nav.renderSB();
}

export async function delFolder(courseId) {
  if (!confirm('Видалити курс і всі уроки?')) return;
  await delCourse(courseId);
  state.setCFid(null);
  state.setCLid(null);
  const nav = await import('./navigation.js');
  nav.renderSB();
  nav.showHome();
}
