import * as db from './db/index.js';
import { D, getCourseRef, getLessonRef } from './store.js';
import { currentUser, isAdmin } from './auth.js';
import { esc } from './utils.js';
import { uid } from './utils.js';

/* ───────── Teacher homework panel ───────── */

export function buildTeacherHomeworkPanelHTML() {
  return `<div style="max-width:960px">
    <div style="margin-bottom:16px">
      <div class="sec-title" style="margin-bottom:12px">📝 Домашні завдання — усі учні</div>
      <div id="teacherHomeworkList"></div>
    </div>
  </div>`;
}

export async function renderTeacherHomeworkList() {
  const el = document.getElementById('teacherHomeworkList');
  if (!el) return;

  const homeworks = await db.getAll('homework');
  const users = await db.getAll('users');
  const courses = D.courses;
  const lessons = await db.getAll('lessons');

  const rows = homeworks
    .filter(h => h.status !== 'done')
    .sort((a, b) => b.updated_at?.localeCompare(a.updated_at || '') || 0)
    .map(h => {
      const user = users.find(u => u.id === h.user_id);
      const course = courses.find(c => c.id === h.course_id);
      const lesson = lessons.find(l => l.id === h.lesson_id);
      return buildHomeworkRow(h, user, course, lesson);
    })
    .join('');

  el.innerHTML = rows || '<div style="color:var(--text3);font-size:13px;font-family:var(--mono);padding:12px 0">Немає активних домашніх завдань</div>';
}

function buildHomeworkRow(h, user, course, lesson) {
  const tasks = h.tasks || [];
  const tasksHtml = tasks.map((t, i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:var(--surface);border:1px solid var(--border);border-radius:6px;margin-top:4px">
      <span style="font-size:11px;color:var(--text3);font-family:var(--mono);min-width:16px">${i + 1}.</span>
      <span style="flex:1;font-size:12px">${esc(t.title || t.instruction || '')}</span>
      <span style="font-size:10px;color:var(--text3);font-family:var(--mono)">(${t.type || 'text'})</span>
    </div>`).join('');

  const isReturned = h.status === 'returned';
  return `<div style="margin-bottom:8px;padding:12px 14px;background:var(--surface2);border:1px solid ${isReturned ? 'var(--amber)' : 'var(--border)'};border-radius:10px;border-left:3px solid ${isReturned ? 'var(--amber)' : h.status === 'todo' ? 'var(--accent)' : 'var(--border2)'}">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span style="font-weight:600;font-size:13px">${esc(user?.name || '—')}</span>
      <span style="font-size:11px;color:var(--text3);font-family:var(--mono)">${esc(course?.name || '—')} · <span style="cursor:pointer;color:var(--accent);text-decoration:underline" data-action="open-lesson" data-fid="${h.course_id}" data-lid="${h.lesson_id}">${esc(lesson?.name || '—')}</span></span>
      <span style="font-size:10px;font-family:var(--mono);padding:2px 6px;border-radius:4px;background:${isReturned ? 'var(--amber)' : 'var(--accent2)'};color:#000">${h.status === 'returned' ? '🔙 Повернено' : h.status}</span>
    </div>
    ${tasksHtml}
    <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
      <button class="btn bg bsm" data-action="hw-add-task" data-hw-id="${h.id}" style="font-size:11px;padding:4px 10px">＋ Додати завдання</button>
      <button class="btn bd bsm" data-action="hw-return" data-hw-id="${h.id}" style="font-size:11px;padding:4px 10px" ${h.status === 'returned' ? 'disabled' : ''}>🔙 Повернути</button>
    </div>
    ${h.status === 'returned' ? `<div style="margin-top:6px;display:flex;gap:6px">
      <input class="hw-task-input" data-hw-id="${h.id}" placeholder="Текст завдання..." style="flex:1;padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:6px;background:var(--surface);outline:none">
      <button class="btn bp bsm" data-action="hw-add-task-typed" data-hw-id="${h.id}" style="font-size:11px;padding:4px 10px">Додати</button>
    </div>` : ''}
  </div>`;
}

export function buildStudentHomeworkPanelHTML() {
  return `<div class="vocab-panel" style="max-width:600px">
    <div class="vocab-title">📝 Домашнє завдання</div>
    <div id="homeworkList"></div>
  </div>`;
}

export async function renderStudentHomeworkList() {
  const el = document.getElementById('homeworkList');
  if (!el) return;

  const all = await db.getAll('homework');
  const userHw = all.filter(h => h.user_id === currentUser?.id && h.status !== 'done');
  if (!userHw.length) {
    el.innerHTML = '<div style="color:var(--text3);font-size:12px;font-family:var(--mono);padding:8px 0">Домашнього завдання немає 🎉</div>';
    return;
  }

  const allLessons = await db.getAll('lessons');
  el.innerHTML = userHw.map(h => {
    const lesson = allLessons.find(l => l.id === h.lesson_id);
    const tasks = h.tasks || [];
    return `<div style="margin-bottom:8px;padding:12px 14px;background:var(--surface2);border:1px solid ${h.status === 'returned' ? 'var(--amber)' : 'var(--border)'};border-radius:10px;border-left:3px solid ${h.status === 'returned' ? 'var(--amber)' : 'var(--accent)'}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:${tasks.length ? '8px' : '0'}">
        <span style="font-size:13px;font-weight:600">${esc(lesson?.name || '—')}</span>
        ${h.status === 'returned' ? '<span style="font-size:10px;font-family:var(--mono);padding:2px 6px;border-radius:4px;background:var(--amber);color:#000">🔙 Повернено на доопрацювання</span>' : ''}
      </div>
      ${tasks.length ? `<div style="margin-bottom:8px">${tasks.map((t, i) =>
        `<div style="font-size:12px;padding:4px 0;color:var(--text2)">${i + 1}. ${esc(t.title || t.instruction || '')}</div>`
      ).join('')}</div>` : '<div style="font-size:11px;color:var(--text3);font-family:var(--mono);margin-bottom:6px">Завдань ще немає</div>'}
      <button class="btn bgr bsm" data-action="hw-mark-done" data-hw-id="${h.id}" style="font-size:11px;padding:4px 10px">✓ Позначити виконаним</button>
    </div>`;
  }).join('');
}

/* ───── Actions ───── */

export async function createHomework(userId, lessonId, courseId) {
  const all = await db.getAll('homework');
  const exists = all.find(h => h.user_id === userId && h.lesson_id === lessonId);
  if (exists) return exists.id;
  return await db.add('homework', {
    user_id: userId,
    lesson_id: lessonId,
    course_id: courseId,
    tasks_json: '[]',
    status: 'todo',
    created_at: new Date().toISOString(),
  });
}

export async function addHomeworkTask(hwId, taskData) {
  const hw = await db.get('homework', hwId);
  if (!hw) return;
  const tasks = hw.tasks || [];
  tasks.push({ id: uid(), ...taskData });
  hw.tasks = tasks;
  await db.put('homework', hw);
  return hw;
}

export async function markHomeworkDone(hwId) {
  await db.put('homework', { id: hwId, status: 'done' });
}

export async function returnHomework(hwId) {
  await db.put('homework', { id: hwId, status: 'returned' });
}

/* ─── Homework creation wizard ─── */

export async function showHomeworkWizard(preselectedCourseId, preselectedLessonId) {
  const users = await db.getAll('users');
  const students = users.filter(u => u.role !== 'admin');
  const courses = D.courses;
  let allLessons = await db.getAll('lessons');

  const modal = document.getElementById('MB');
  const mo = document.getElementById('MO');
  if (!modal || !mo) return;

  modal.innerHTML = `
    <div class="mb-scroll" style="padding:24px">
      <div class="m-title" style="font-size:18px;margin-bottom:16px">📝 Створення домашнього завдання</div>

      <div class="fg">
        <label>👤 Учень</label>
        <select id="hwWizStudent" style="width:100%;padding:10px 12px;border-radius:10px;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:14px;font-family:var(--display);outline:none">
          <option value="">— Оберіть учня —</option>
          ${students.map(s => `<option value="${s.id}">${esc(s.name)} (${esc(s.email)})</option>`).join('')}
        </select>
      </div>

      <div class="fg">
        <label>📚 Рівень / Курс</label>
        <select id="hwWizCourse" style="width:100%;padding:10px 12px;border-radius:10px;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:14px;font-family:var(--display);outline:none">
          <option value="">— Оберіть курс —</option>
          ${courses.map(c => `<option value="${c.id}" ${preselectedCourseId == c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
        </select>
      </div>

      <div class="fg">
        <label>📖 Урок</label>
        <select id="hwWizLesson" style="width:100%;padding:10px 12px;border-radius:10px;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:14px;font-family:var(--display);outline:none">
          <option value="">— Оберіть урок —</option>
        </select>
      </div>

      <div class="fg" id="hwWizTasksWrap" style="display:none">
        <label>✅ Завдання з уроку (оберіть ті, що не встигли)</label>
        <div id="hwWizTasks" style="max-height:200px;overflow-y:auto;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:8px"></div>
        <button class="btn bg bsm" id="hwWizAddTask" style="margin-top:8px;width:100%;font-size:13px">＋ Додати нове завдання</button>
      </div>

      <div id="hwWizNewTaskWrap" style="display:none;margin-top:8px">
        <input id="hwWizNewTaskInput" placeholder="Текст нового завдання..." style="width:100%;padding:9px 12px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:13px;font-family:var(--display);outline:none;margin-bottom:6px">
      </div>
    </div>
    <div class="m-footer">
      <button class="btn bg" id="hwWizCancel">Скасувати</button>
      <button class="btn bp" id="hwWizCreate" disabled>Створити ДЗ</button>
    </div>`;

  mo.classList.add('show');

  /* populate lessons when course changes */
  const courseSel = document.getElementById('hwWizCourse');
  const lessonSel = document.getElementById('hwWizLesson');
  const tasksWrap = document.getElementById('hwWizTasksWrap');
  const tasksDiv = document.getElementById('hwWizTasks');
  const createBtn = document.getElementById('hwWizCreate');
  const cancelBtn = document.getElementById('hwWizCancel');
  const addTaskBtn = document.getElementById('hwWizAddTask');
  const newTaskWrap = document.getElementById('hwWizNewTaskWrap');
  const newTaskInput = document.getElementById('hwWizNewTaskInput');

  function updateLessons() {
    const cid = parseInt(courseSel.value, 10);
    lessonSel.innerHTML = '<option value="">— Оберіть урок —</option>';
    tasksWrap.style.display = 'none';
    createBtn.disabled = true;
    if (!cid) return;
    const course = courses.find(c => c.id === cid);
    if (!course) return;
    course.lessons.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.id;
      opt.textContent = l.name;
      if (preselectedLessonId == l.id) opt.selected = true;
      lessonSel.appendChild(opt);
    });
    if (preselectedLessonId) updateTasks();
  }

  function updateTasks() {
    const lid = parseInt(lessonSel.value, 10);
    tasksDiv.innerHTML = '';
    if (!lid) { tasksWrap.style.display = 'none'; createBtn.disabled = true; return; }
    const lesson = getLessonRef(parseInt(courseSel.value, 10), lid);
    if (!lesson) { tasksWrap.style.display = 'none'; createBtn.disabled = true; return; }
    const tasks = lesson.tasks || [];
    tasksWrap.style.display = 'block';
    if (!tasks.length) {
      tasksDiv.innerHTML = '<div style="color:var(--text3);font-size:12px;font-family:var(--mono);padding:8px">Немає завдань в уроці</div>';
      createBtn.disabled = false;
      return;
    }
    tasksDiv.innerHTML = tasks.map((t, i) => `
      <label style="display:flex;align-items:center;gap:8px;padding:6px 4px;cursor:pointer;font-size:13px">
        <input type="checkbox" class="hw-task-cb" data-task-id="${t.id}" checked style="width:16px;height:16px;accent-color:var(--accent)">
        <span>${i + 1}. ${esc(t.instruction || t.type || '')}</span>
      </label>`).join('');
    createBtn.disabled = false;
    updateCreateButton();
  }

  function updateCreateButton() {
    const studentOk = document.getElementById('hwWizStudent')?.value;
    const courseOk = courseSel?.value;
    const lessonOk = lessonSel?.value;
    createBtn.disabled = !(studentOk && courseOk && lessonOk);
  }

  document.getElementById('hwWizStudent').addEventListener('change', updateCreateButton);
  courseSel.addEventListener('change', () => { updateLessons(); updateCreateButton(); });
  lessonSel.addEventListener('change', () => { updateTasks(); updateCreateButton(); });

  addTaskBtn.addEventListener('click', () => {
    newTaskWrap.style.display = newTaskWrap.style.display === 'none' ? 'block' : 'none';
    if (newTaskWrap.style.display === 'block') newTaskInput.focus();
  });

  cancelBtn.addEventListener('click', () => mo.classList.remove('show'));

  createBtn.addEventListener('click', async () => {
    const userId = parseInt(document.getElementById('hwWizStudent').value, 10);
    const courseId = parseInt(courseSel.value, 10);
    const lessonId = parseInt(lessonSel.value, 10);
    if (!userId || !courseId || !lessonId) return;

    const selectedTasks = [...tasksDiv.querySelectorAll('.hw-task-cb:checked')].map(cb => {
      const taskId = cb.dataset.taskId;
      const lesson = getLessonRef(courseId, lessonId);
      const task = lesson?.tasks?.find(t => t.id === taskId);
      return task || null;
    }).filter(Boolean);

    const newTaskText = newTaskInput.value.trim();
    if (newTaskText) {
      selectedTasks.push({ id: uid(), title: newTaskText, instruction: newTaskText, type: 'text' });
    }

    const hwId = await createHomework(userId, lessonId, courseId);
    if (selectedTasks.length) {
      const hw = await db.get('homework', hwId);
      if (hw) {
        hw.tasks = [...(hw.tasks || []), ...selectedTasks];
        await db.put('homework', hw);
      }
    }
    mo.classList.remove('show');
    alert('Домашнє завдання створено');
  });

  if (preselectedCourseId) updateLessons();
}

/* ─── progress helpers ─── */

export async function getLastDoneLesson(userId, courseId) {
  const all = await db.getByIndex('progress', 'user_id', userId);
  const doneLessons = all.filter(p => p.status === 'done').sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
  return doneLessons.length > 0 ? doneLessons[0] : null;
}
