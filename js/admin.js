import * as db from './db/index.js';
import { D, getCourseRef, save } from './store.js';
import { currentUser } from './auth.js';
import { esc } from './utils.js';

export async function renderAdminPanel() {
  const users = await db.getAll('users');
  const enrollments = await db.getAll('enrollments');
  const progress = await db.getAll('progress');
  const courses = await db.getAll('courses');

  const studentList = document.getElementById('adminStudentList');
  const counter = document.getElementById('studentCounter');
  const students = users.filter(u => u.role !== 'admin');
  if (counter) counter.textContent = `Number of students ${students.length}`;
  if (studentList) studentList.innerHTML = buildUserTable(students, enrollments, progress, courses);
}

function buildUserTable(students, enrollments, progress, courses) {
  if (!students.length) return '<div style="color:var(--text3);font-size:13px;font-family:var(--mono);padding:20px 0">Немає користувачів</div>';
  const avatarColors = ['green', 'blue', 'purple', 'orange'];
  const rows = students.map((u, i) => {
    const enrollment = enrollments.find((e) => e.user_id === u.id);
    const courseName = enrollment ? (courses.find((c) => c.id === enrollment.course_id)?.name || '—') : 'Не призначено';
    const userProgress = progress.filter((p) => p.user_id === u.id);
    const done = userProgress.filter((p) => p.status === 'done').length;
    const total = enrollment ? (getCourseRef(enrollment.course_id)?.lessons.length || 0) : 0;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const color = avatarColors[i % avatarColors.length];
    return `<div class="student-card">
      <div class="student-avatar ${color}">${(u.name || '?')[0].toUpperCase()}</div>
      <div class="student-info" data-action="show-profile" data-user-id="${u.id}" style="cursor:pointer">
        <div class="student-name">${esc(u.name)}</div>
        <div class="student-meta">${esc(u.email)} · ${esc(courseName)}</div>
      </div>
      <div style="font-size:13px;font-weight:700;color:${pct === 100 ? 'var(--green)' : 'var(--amber)'};flex-shrink:0">${pct}%</div>
      <div class="student-actions">
        <button class="student-action-btn sa-green" data-action="show-profile" data-user-id="${u.id}">→ До класу</button>
        <button class="student-action-btn sa-ghost" data-action="show-profile" data-user-id="${u.id}">👤</button>
      </div>
    </div>`;
  }).join('');
  return `<div class="student-list">${rows}</div>`;
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
