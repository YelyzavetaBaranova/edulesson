import * as db from './db/index.js';
import { getCourseRef } from './store.js';
import { currentUser, isAdmin } from './auth.js';
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
    const userEnrollments = enrollments.filter((e) => e.user_id === u.id);
    const userProgress = progress.filter((p) => p.user_id === u.id);
    const color = avatarColors[i % avatarColors.length];

    const enrolledPills = userEnrollments.map(e => {
      const c = courses.find(c => c.id === e.course_id);
      return c ? `<span style="display:inline-block;padding:1px 8px;border-radius:10px;background:var(--accent2);color:#000;font-size:10px;font-weight:600;margin:1px 2px">${esc(c.name)}</span>` : '';
    }).join('');

    return `<div class="student-card">
      <div class="student-avatar ${color}">${(u.name || '?')[0].toUpperCase()}</div>
      <div class="student-info" data-action="show-profile" data-user-id="${u.id}" style="cursor:pointer">
        <div class="student-name">${esc(u.name)}</div>
        <div class="student-meta">${esc(u.email)}</div>
        <div style="margin-top:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-size:10px;color:var(--text3);font-family:var(--mono)">Курси:</span>
          ${enrolledPills || '<span style="font-size:10px;color:var(--text3);font-family:var(--mono)">Не призначено</span>'}
          <button class="btn bd bsm" style="font-size:10px;padding:1px 8px" data-action="admin-edit-enroll" data-user-id="${u.id}">✏️</button>
        </div>
      </div>
      <div style="font-size:13px;font-weight:700;color:${userEnrollments.length && userProgress.length ? 'var(--amber)' : 'var(--text3)'};flex-shrink:0">${userEnrollments.length ? `${userProgress.filter(p => p.status === 'done').length}✓` : '—'}</div>
      <div class="student-actions">
        <button class="student-action-btn sa-green" data-action="admin-edit-enroll" data-user-id="${u.id}">➕ Зарахувати</button>
        <button class="student-action-btn sa-ghost" data-action="show-profile" data-user-id="${u.id}">👤</button>
        <button class="student-action-btn sa-ghost" data-action="toggle-assign-lesson" data-user-id="${u.id}" style="font-size:11px">📋 Урок</button>
      </div>
      <div class="assign-lesson-row" id="assignLesson_${u.id}" style="display:none;padding:8px 12px;border-top:1px solid var(--border);background:var(--surface);gap:6px;flex-wrap:wrap;align-items:end">
        <select class="assign-courses" data-uid="${u.id}" style="flex:1;min-width:120px;padding:5px 8px;border-radius:6px;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:11px;font-family:var(--display);outline:none">
          <option value="">— Курс —</option>
        </select>
        <select class="assign-lessons" data-uid="${u.id}" style="flex:1;min-width:140px;padding:5px 8px;border-radius:6px;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:11px;font-family:var(--display);outline:none">
          <option value="">— Урок —</option>
        </select>
        <button class="btn bp bsm" data-action="assign-lesson" data-user-id="${u.id}" style="font-size:10px;padding:4px 10px">➕</button>
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
  if (!isAdmin()) return;
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  if (action === 'admin-delete-user') {
    if (!confirm('Видалити користувача?')) return;
    await db.del('users', parseInt(el.dataset.userId, 10));
    renderAdminPanel();
    return;
  }

  if (action === 'admin-edit-enroll') {
    const userId = parseInt(el.dataset.userId, 10);
    const users = await db.getAll('users');
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const enrollments = await db.getAll('enrollments');
    const userEnrollments = enrollments.filter(e => e.user_id === userId);
    const enrolledIds = userEnrollments.map(e => e.course_id);
    const courses = await db.getAll('courses');

    const mo = document.getElementById('MO');
    const modal = document.getElementById('MB');
    if (!mo || !modal) return;

    modal.innerHTML = `
      <div class="mb-scroll" style="padding:24px">
        <div class="m-title" style="font-size:18px;margin-bottom:4px">✏️ Курси учня</div>
        <div style="font-size:13px;color:var(--text3);font-family:var(--mono);margin-bottom:16px">${esc(user.name)} (${esc(user.email)})</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);cursor:pointer;font-size:14px">
            <input type="checkbox" class="enroll-cb" value="" ${enrolledIds.length === 0 ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--accent)">
            <span style="color:var(--text3)">— Не призначено —</span>
          </label>
          ${courses.map(c => `
          <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);cursor:pointer;font-size:14px">
            <input type="checkbox" class="enroll-cb" value="${c.id}" ${enrolledIds.includes(c.id) ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--accent)">
            <span>${esc(c.name)}</span>
          </label>`).join('')}
        </div>
      </div>
      <div class="m-footer">
        <button class="btn bg" id="enrollCancel">Скасувати</button>
        <button class="btn bp" id="enrollSave" data-user-id="${userId}">💾 Зберегти</button>
      </div>`;

    mo.classList.add('show');

    document.getElementById('enrollCancel').addEventListener('click', () => mo.classList.remove('show'));
    document.getElementById('enrollSave').addEventListener('click', async () => {
      const checked = [...modal.querySelectorAll('.enroll-cb:checked')].map(cb => cb.value).filter(Boolean);
      const allEnrollments = await db.getAll('enrollments');
      const existing = allEnrollments.filter(e => e.user_id === userId);

      for (const e of existing) {
        if (!checked.includes(String(e.course_id))) {
          await db.del('enrollments', e.id);
        }
      }
      for (const cid of checked) {
        const exists = existing.find(e => e.course_id === Number(cid));
        if (!exists) {
          await db.add('enrollments', { user_id: userId, course_id: Number(cid), created_at: new Date().toISOString() });
        }
      }
      mo.classList.remove('show');
      renderAdminPanel();
      if (document.querySelector('.profile-page')) {
        const { showProfile } = await import('./navigation.js');
        showProfile(userId);
      }
    });
    return;
  }

  if (action === 'toggle-assign-lesson') {
    const userId = parseInt(el.dataset.userId, 10);
    const row = document.getElementById('assignLesson_' + userId);
    if (!row) return;
    const visible = row.style.display !== 'none';
    row.style.display = visible ? 'none' : 'flex';
    if (!visible) {
      const coursesSel = row.querySelector('.assign-courses');
      const lessonsSel = row.querySelector('.assign-lessons');
      const allCourses = await db.getAll('courses');
      const enrollments = await db.getAll('enrollments');
      const userEnrolls = enrollments.filter(e => e.user_id === userId);
      const enrolledCourseIds = userEnrolls.map(e => e.course_id);
      coursesSel.innerHTML = '<option value="">— Курс —</option>';
      allCourses.filter(c => enrolledCourseIds.includes(c.id)).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        coursesSel.appendChild(opt);
      });
      coursesSel.onchange = async () => {
        const cid = Number(coursesSel.value);
        lessonsSel.innerHTML = '<option value="">— Урок —</option>';
        if (!cid) return;
        const lsn = await db.getByIndex('lessons', 'course_id', cid);
        lsn.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        lsn.forEach(l => {
          const opt = document.createElement('option');
          opt.value = l.id;
          opt.textContent = l.name;
          lessonsSel.appendChild(opt);
        });
      };
    }
    return;
  }

  if (action === 'assign-lesson') {
    const userId = parseInt(el.dataset.userId, 10);
    const row = document.getElementById('assignLesson_' + userId);
    if (!row) return;
    const coursesSel = row.querySelector('.assign-courses');
    const lessonsSel = row.querySelector('.assign-lessons');
    const courseId = Number(coursesSel?.value);
    const lessonId = Number(lessonsSel?.value);
    if (!courseId || !lessonId) { alert('Оберіть курс та урок'); return; }
    const { createHomework } = await import('./homework.js');
    await createHomework(userId, lessonId, courseId);
    alert('Урок призначено');
    row.style.display = 'none';
    return;
  }
}
