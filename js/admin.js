import * as db from './db/index.js';
import { D, getCourseRef, save } from './store.js';
import { currentUser } from './auth.js';
import { esc } from './utils.js';

export async function renderAdminPanel() {
  const users = await db.getAll('users');
  const enrollments = await db.getAll('enrollments');
  const progress = await db.getAll('progress');
  const courses = await db.getAll('courses');

  document.getElementById('mc').innerHTML = `
    <div style="padding:22px 26px;max-width:960px;width:100%">
      <div class="sec-title" style="margin-bottom:16px">👥 Учні</div>
      <div id="adminUserList">
        ${buildUserTable(users, enrollments, progress, courses)}
      </div>
      <div class="sec-title" style="margin-top:24px;margin-bottom:16px">📊 Прогрес</div>
      <div id="adminProgressView">
        ${buildProgressView(users, enrollments, progress, courses)}
      </div>
    </div>`;
}

function buildUserTable(users, enrollments, progress, courses) {
  if (!users.length) return '<div style="color:var(--text3);font-size:13px;font-family:var(--mono)">Немає користувачів</div>';
  const rows = users
    .filter((u) => u.role !== 'admin')
    .map((u) => {
      const enrollment = enrollments.find((e) => e.user_id === u.id);
      const courseName = enrollment ? (courses.find((c) => c.id === enrollment.course_id)?.name || '—') : '—';
      const userProgress = progress.filter((p) => p.user_id === u.id);
      const done = userProgress.filter((p) => p.status === 'done').length;
      const total = enrollment ? (getCourseRef(enrollment.course_id)?.lessons.length || 0) : 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return `<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;margin-bottom:6px">
        <div style="flex:2;font-size:13px;font-weight:600;cursor:pointer;color:var(--accent)" data-action="show-profile" data-user-id="${u.id}">${esc(u.name)}</div>
        <div style="flex:1;font-size:11px;color:var(--text3);font-family:var(--mono)">${esc(u.email)}</div>
        <div style="flex:1;font-size:12px;color:var(--accent2);font-family:var(--mono)">${esc(courseName)}</div>
        <div style="flex:0 0 60px;font-size:13px;font-weight:700;color:${pct === 100 ? 'var(--green)' : 'var(--amber)'}">${pct}%</div>
        <select class="admin-course-select" data-user-id="${u.id}">
          <option value="">— Курс —</option>
          ${courses.map((c) => `<option value="${c.id}" ${enrollment?.course_id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
        </select>
        <button class="btn bgr bsm" data-action="admin-save-enroll" data-user-id="${u.id}" style="padding:4px 10px;font-size:11px">💾</button>
        <button class="btn bd bsm" data-action="admin-delete-user" data-user-id="${u.id}" style="padding:4px 8px;font-size:11px">✕</button>
      </div>`;
    })
    .join('');
  return `<div style="display:flex;flex-direction:column;gap:2px">${rows}</div>`;
}

function buildProgressView(users, enrollments, progress, courses) {
  const students = users.filter((u) => u.role !== 'admin');
  if (!students.length) return '<div style="color:var(--text3);font-size:13px;font-family:var(--mono)">Немає даних</div>';

  return students
    .map((u) => {
      const enrollment = enrollments.find((e) => e.user_id === u.id);
      if (!enrollment) return '';
      const courseRef = getCourseRef(enrollment.course_id);
      if (!courseRef) return '';
      const lessons = courseRef.lessons;
      const userProgress = progress.filter((p) => p.user_id === u.id);
      const bars = lessons
        .map((l, i) => {
          const p = userProgress.find((pr) => pr.lesson_id === l.id);
          const status = p?.status || 'not_started';
          const color = status === 'done' ? 'var(--green)' : status === 'in_progress' ? 'var(--amber)' : 'var(--border2)';
          return `<div style="width:20px;height:20px;border-radius:5px;background:${color};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#000;cursor:pointer" title="${esc(l.name)}: ${status}">${i + 1}</div>`;
        })
        .join('');
      return `<div style="margin-bottom:10px;padding:10px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:10px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <span style="font-size:13px;font-weight:600">${esc(u.name)}</span>
          <span style="font-size:11px;color:var(--text3);font-family:var(--mono)">${esc(courseRef.name)}</span>
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">${bars}</div>
      </div>`;
    })
    .join('');
}

export async function handleAdminActions(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  if (action === 'admin-delete-user') {
    if (!confirm('Видалити користувача?')) return;
    await db.del('users', parseInt(el.dataset.userId, 10));
    renderAdminPanel();
    return;
  }

  if (action === 'admin-save-enroll') {
    const userId = parseInt(el.dataset.userId, 10);
    const row = el.closest('div');
    const sel = row?.querySelector('.admin-course-select');
    if (!sel) return;
    const courseId = sel.value;
    if (courseId) {
      const existing = await db.getByCompositeIndex('enrollments', 'user_course', [userId, parseInt(courseId)]);
      if (!existing.length) {
        await db.add('enrollments', { user_id: userId, course_id: parseInt(courseId), created_at: new Date().toISOString() });
      }
    } else {
      const enrollments = await db.getAll('enrollments');
      const existing = enrollments.find((e) => e.user_id === userId);
      if (existing) await db.del('enrollments', existing.id);
    }
    renderAdminPanel();
  }
}
