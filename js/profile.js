import * as db from './db/index.js';
import { D, getCourseRef, getLessonRef } from './store.js';
import { esc } from './utils.js';

export async function buildProfileHTML(userId) {
  const uid = Number(userId);
  const users = await db.getAll('users');
  const user = users.find(u => u.id === uid);
  if (!user) return '<div>Користувача не знайдено</div>';

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
    <div style="max-width:700px">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;padding:20px;background:var(--surface2);border:1px solid var(--border);border-radius:14px">
        <div style="width:52px;height:52px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#000;flex-shrink:0">${esc(user.name[0] || '?').toUpperCase()}</div>
        <div style="flex:1">
          <div style="font-size:18px;font-weight:800;margin-bottom:2px">${esc(user.name)}</div>
          <div style="font-size:12px;color:var(--text3);font-family:var(--mono)">${esc(user.email)}</div>
          <div style="font-size:11px;color:var(--text3);font-family:var(--mono);margin-top:2px">Студент · ${course ? esc(course.name) : 'Курс не призначено'}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:26px;font-weight:800;color:${pct === 100 ? 'var(--green)' : 'var(--amber)'}">${pct}%</div>
          <div style="font-size:10px;color:var(--text3);font-family:var(--mono)">прогрес</div>
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:20px">
        <div style="flex:1;padding:14px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;text-align:center">
          <div style="font-size:20px;font-weight:800">${doneLessons}</div>
          <div style="font-size:11px;color:var(--text3);font-family:var(--mono)">пройдено уроків</div>
        </div>
        <div style="flex:1;padding:14px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;text-align:center">
          <div style="font-size:20px;font-weight:800">${totalLessons - doneLessons}</div>
          <div style="font-size:11px;color:var(--text3);font-family:var(--mono)">залишилось</div>
        </div>
        <div style="flex:1;padding:14px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;text-align:center">
          <div style="font-size:20px;font-weight:800">${userHomework.filter(h => h.status === 'done').length}</div>
          <div style="font-size:11px;color:var(--text3);font-family:var(--mono)">домашніх завдань</div>
        </div>
      </div>

      ${lastLesson ? `
      <div style="margin-bottom:20px">
        <div class="sec-title" style="margin-bottom:10px">⏺ Останній пройдений урок</div>
        <div style="display:flex;align-items:center;gap:12px;padding:14px;background:var(--surface2);border:1px solid var(--border);border-radius:10px">
          <span style="font-size:13px;flex:1">${esc(lastLessonName)}</span>
          <button class="btn bgr bsm" data-action="go-to-student-lesson" data-lesson-id="${lastLesson.lesson_id}" data-fid="${enrollment?.course_id || ''}" style="padding:6px 14px">➡ До класу</button>
        </div>
      </div>` : ''}

      <div class="sec-title" style="margin-bottom:10px">📝 Домашні завдання</div>
      ${buildHomeworkTable(userHomework, allLessons)}
    </div>`;
}

function buildHomeworkTable(homework, allLessons) {
  if (!homework.length) return '<div style="color:var(--text3);font-size:12px;font-family:var(--mono);padding:8px 0">Немає домашніх завдань</div>';
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
