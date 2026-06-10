import * as db from './db/index.js';
import { D, getCourseRef, getLessonRef } from './store.js';
import { esc } from './utils.js';

export async function buildProfileHTML(userId) {
  const uid = Number(userId);
  const users = await db.getAll('users');
  const user = users.find(u => u.id === uid);
  if (!user) return '<div style="padding:24px;color:var(--text3);font-family:var(--mono)">Користувача не знайдено</div>';

  const enrollments = await db.getAll('enrollments');
  const enrollment = enrollments.find(e => e.user_id === uid);
  const course = enrollment ? getCourseRef(enrollment.course_id) : null;

  const allProgress = await db.getAll('progress');
  const userProgress = allProgress.filter(p => p.user_id === uid);

  const lastDone = userProgress.filter(p => p.status === 'done').sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
  const lastLesson = lastDone.length > 0 ? lastDone[0] : null;
  const lastLessonName = lastLesson && course ? (course.lessons.find(l => l.id === lastLesson.lesson_id)?.name || '—') : '—';

  const allHomework = await db.getAll('homework');
  const userHomework = allHomework.filter(h => h.user_id === uid);
  const allLessons = await db.getAll('lessons');

  const totalLessons = course ? course.lessons.length : 0;
  const doneLessons = userProgress.filter(p => p.status === 'done').length;
  const pct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

  return `
    <div class="profile-page">
      <div class="profile-header-card">
        <div class="profile-avatar">${esc(user.name[0] || '?').toUpperCase()}</div>
        <div class="profile-info">
          <div class="profile-name">${esc(user.name)}</div>
          <div class="profile-email">${esc(user.email)}</div>
          <div class="profile-role">Student · ${course ? esc(course.name) : 'Course not assigned'}</div>
        </div>
        <div class="profile-progress">
          <div class="profile-pct">${pct}%</div>
          <div class="profile-pct-label">прогрес</div>
        </div>
      </div>

      <div class="stat-cards">
        <div class="stat-card-item">
          <div class="stat-card-num">${doneLessons}</div>
          <div class="stat-card-label">пройдено уроків</div>
        </div>
        <div class="stat-card-item">
          <div class="stat-card-num">${totalLessons - doneLessons}</div>
          <div class="stat-card-label">залишилось</div>
        </div>
        <div class="stat-card-item">
          <div class="stat-card-num">${userHomework.filter(h => h.status === 'done').length}</div>
          <div class="stat-card-label">домашніх завдань</div>
        </div>
      </div>

      <div class="sec-title-sm" style="margin-bottom:10px">⏺ Останній пройдений урок</div>
      <div class="last-lesson-card">
        <span class="last-lesson-name">${lastLesson ? esc(lastLessonName) : '—'}</span>
        ${lastLesson && enrollment ? `<button class="last-lesson-btn" data-action="go-to-student-lesson" data-lesson-id="${lastLesson.lesson_id}" data-course-id="${enrollment.course_id}">→ До класу</button>` : ''}
      </div>

      <div class="homework-section">
        <div class="sec-title-sm" style="margin-bottom:8px">📝 Домашні завдання</div>
        ${buildHomeworkTable(userHomework, allLessons)}
      </div>
    </div>`;
}

function buildHomeworkTable(homework, allLessons) {
  if (!homework.length) return '<div class="homework-empty">Немає виконаних завдань</div>';
  return `<div style="display:flex;flex-direction:column;gap:4px">
    ${homework.map(h => {
      const lesson = allLessons.find(l => l.id === h.lesson_id);
      const tasks = h.tasks || [];
      const statusColor = h.status === 'done' ? 'var(--green)' : h.status === 'returned' ? 'var(--amber)' : 'var(--text3)';
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px 13px;background:var(--surface2);border:1px solid var(--border);border-radius:10px">
        <span style="font-size:11px;color:${statusColor}">${h.status === 'done' ? '✓' : h.status === 'returned' ? '↺' : '◷'}</span>
        <span style="font-size:12px;flex:1">${esc(lesson?.name || '—')}</span>
        <span style="font-size:10px;color:var(--text3);font-family:var(--mono)">${tasks.length} завдань</span>
        <span style="font-size:10px;color:var(--text3);font-family:var(--mono)">${h.status}</span>
      </div>`;
    }).join('')}
  </div>`;
}

export async function renderProfile(userId) {
}
