import * as db from './db/index.js';
import { getCourseRef } from './store.js';
import { esc } from './utils.js';

function fmtTime(seconds) {
  if (!seconds) return '0 хв';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h ? `${h}год ${m}хв` : `${m} хв`;
}

export async function buildProfileHTML(userId, selectedCourseId) {
  const uid = Number(userId);
  const users = await db.getAll('users');
  const user = users.find(u => u.id === uid);
  if (!user) return '<div style="padding:24px;color:var(--text3);font-family:var(--mono)">Користувача не знайдено</div>';

  const enrollments = await db.getAll('enrollments');
  const userEnrollments = enrollments.filter(e => e.user_id === uid);
  const enrollment = selectedCourseId ? userEnrollments.find(e => e.course_id === Number(selectedCourseId)) : userEnrollments[0];
  const activeCourseId = enrollment ? enrollment.course_id : null;
  const course = activeCourseId ? getCourseRef(activeCourseId) : null;

  const allProgress = await db.getAll('progress');
  const userProgress = allProgress.filter(p => p.user_id === uid);

  const courseProgress = activeCourseId ? userProgress.filter(p => {
    const l = course ? course.lessons.find(ls => ls.id === p.lesson_id) : null;
    return !!l;
  }) : [];

  const lastDone = courseProgress.filter(p => p.status === 'done').sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
  const lastLesson = lastDone.length > 0 ? lastDone[0] : null;
  const lastLessonName = lastLesson && course ? (course.lessons.find(l => l.id === lastLesson.lesson_id)?.name || '—') : '—';

  const allCourses = await db.getAll('courses');

  const allHomework = await db.getAll('homework');
  const userHomework = activeCourseId ? allHomework.filter(h => h.user_id === uid && h.course_id === activeCourseId) : [];
  const allLessons = await db.getAll('lessons');

  const totalLessons = course ? course.lessons.length : 0;
  const doneLessons = courseProgress.filter(p => p.status === 'done').length;
  const pct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

  /* ─── Activity tracking (time spent) ─── */
  const allActivity = await db.getByIndex('activity', 'user_id', uid);
  const courseActivity = activeCourseId ? allActivity.filter(a => a.course_id === activeCourseId) : [];
  const totalSeconds = courseActivity.reduce((s, a) => s + (a.duration_seconds || 0), 0);

  /* ─── Archived courses ─── */
  const archivedCourses = [];
  for (const enrolled of userEnrollments) {
    const c = getCourseRef(enrolled.course_id);
    if (!c || !c.lessons.length) continue;
    const courseLessonsDone = c.lessons.every(l => userProgress.some(p => p.lesson_id === l.id && p.status === 'done'));
    if (courseLessonsDone) archivedCourses.push(c);
  }
  const archivedHtml = archivedCourses.length ? `
    <div class="sec-title-sm" style="margin-bottom:8px;margin-top:16px">📦 Архів курсів</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${archivedCourses.map(c => `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background:var(--green);color:#000;font-size:12px;font-weight:600">${esc(c.name)} ✓</span>`).join('')}
    </div>` : '';

  /* ─── Student schedule ─── */
  const allSchedules = await db.getByIndex('schedule', 'user_id', uid);
  const upcomingSchedules = allSchedules.filter(s => s.date >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const scheduleHtml = upcomingSchedules.length ? `
    <div class="sec-title-sm" style="margin-bottom:8px;margin-top:16px">📅 Найближчі заняття</div>
    <div style="display:flex;flex-direction:column;gap:4px">
      ${upcomingSchedules.map(s => {
        let lessonNames = [];
        try { lessonNames = JSON.parse(s.lesson_ids_json || '[]').map(id => { const l = allLessons.find(x => x.id === id); return l ? l.name : ''; }).filter(Boolean); } catch {}
        return `<div style="padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;font-size:12px">
          <span style="font-weight:600">${s.date}</span> · ${lessonNames.join(', ') || '—'}
        </div>`;
      }).join('')}
    </div>` : '';

  return `
    <div class="profile-page">
      <div class="profile-header-card">
        <div class="profile-avatar">${esc(user.name[0] || '?').toUpperCase()}</div>
        <div class="profile-info">
          <div class="profile-name">${esc(user.name)}</div>
          <div class="profile-email">${esc(user.email)}</div>
          <div class="profile-role" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:11px;color:var(--text3);font-family:var(--mono)">Курс:</span>
            <select class="profile-course-select" style="padding:5px 10px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:13px;font-family:var(--display);outline:none;cursor:pointer">
              <option value="">— Не призначено —</option>
              ${allCourses.map(c => `<option value="${c.id}" ${c.id === activeCourseId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
            </select>
            <button class="btn bp bsm" data-action="profile-save-course" data-user-id="${uid}" style="font-size:11px;padding:4px 12px">💾</button>
          </div>
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
        <div class="stat-card-item">
          <div class="stat-card-num">${fmtTime(totalSeconds)}</div>
          <div class="stat-card-label">витрачено часу</div>
        </div>
      </div>

      <div class="sec-title-sm" style="margin-bottom:10px">⏺ Останній пройдений урок</div>
      <div class="last-lesson-card">
        <span class="last-lesson-name">${lastLesson ? esc(lastLessonName) : '—'}</span>
        ${lastLesson && enrollment ? `<button class="last-lesson-btn" data-action="go-to-student-lesson" data-lesson-id="${lastLesson.lesson_id}" data-course-id="${enrollment.course_id}">→ До класу</button>` : ''}
      </div>

      ${scheduleHtml}
      ${archivedHtml}

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
