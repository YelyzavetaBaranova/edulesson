import * as db from './db/index.js';
import { esc } from './utils.js';

export function buildScheduleHTML() {
  return `<div style="max-width:960px;width:100%">
    <div class="sec-title" style="margin-bottom:16px">📅 Розклад занять</div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <div class="fg" style="flex:1;min-width:180px">
          <label style="font-size:11px;color:var(--text3);font-family:var(--mono);margin-bottom:4px;display:block">Курс</label>
          <select id="schCourse" style="width:100%;padding:9px 12px;border-radius:10px;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:13px;font-family:var(--display);outline:none">
            <option value="">— Оберіть курс —</option>
          </select>
        </div>
        <div class="fg" style="flex:1;min-width:180px">
          <label style="font-size:11px;color:var(--text3);font-family:var(--mono);margin-bottom:4px;display:block">Учень</label>
          <select id="schStudent" style="width:100%;padding:9px 12px;border-radius:10px;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:13px;font-family:var(--display);outline:none">
            <option value="">— Оберіть учня —</option>
          </select>
        </div>
        <div class="fg" style="min-width:160px">
          <label style="font-size:11px;color:var(--text3);font-family:var(--mono);margin-bottom:4px;display:block">Дата</label>
          <input type="date" id="schDate" style="width:100%;padding:9px 12px;border-radius:10px;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-size:13px;font-family:var(--display);outline:none">
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn bp" id="schSave" disabled style="font-size:13px">💾 Зберегти розклад</button>
        <button class="btn bd" id="schClear" style="font-size:13px">✕ Очистити</button>
      </div>
      <div id="schLessons" style="display:none">
        <div class="sec-title" style="font-size:13px;margin-bottom:8px">📖 Уроки на цю дату</div>
        <div id="schLessonList" style="display:flex;flex-direction:column;gap:4px"></div>
      </div>
      <div id="schExisting" style="display:none">
        <div class="sec-title" style="font-size:13px;margin-bottom:8px">📋 Існуючі розклади</div>
        <div id="schExistingList" style="display:flex;flex-direction:column;gap:6px"></div>
      </div>
    </div>
  </div>`;
}

export async function initScheduleEditor() {
  const courseSel = document.getElementById('schCourse');
  const studentSel = document.getElementById('schStudent');
  const dateInput = document.getElementById('schDate');
  const lessonsDiv = document.getElementById('schLessons');
  const lessonList = document.getElementById('schLessonList');
  const existingDiv = document.getElementById('schExisting');
  const existingList = document.getElementById('schExistingList');
  const saveBtn = document.getElementById('schSave');
  const clearBtn = document.getElementById('schClear');

  const allCourses = await db.getAll('courses');
  const allUsers = await db.getAll('users');

  allCourses.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    courseSel.appendChild(opt);
  });

  dateInput.valueAsDate = new Date();

  async function updateStudents() {
    const cid = Number(courseSel.value);
    studentSel.innerHTML = '<option value="">— Оберіть учня —</option>';
    if (!cid) return;
    const enrolls = await db.getByIndex('enrollments', 'course_id', cid);
    const studentIds = enrolls.map(e => e.user_id);
    const students = allUsers.filter(u => u.role !== 'admin' && studentIds.includes(u.id));
    students.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.email})`;
      studentSel.appendChild(opt);
    });
  }

  async function updateLessons() {
    const cid = Number(courseSel.value);
    const date = dateInput.value;
    lessonsDiv.style.display = 'none';
    existingDiv.style.display = 'none';
    saveBtn.disabled = true;
    if (!cid || !date) return;
    const allLessons = await db.getByIndex('lessons', 'course_id', cid);
    allLessons.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    if (!allLessons.length) return;

    const uid = Number(studentSel.value);
    let checkedIds = [];
    if (uid) {
      const schedules = await db.getByIndex('schedule', 'user_id', uid);
      const daySched = schedules.find(s => s.course_id === cid && s.date === date);
      if (daySched) {
        try { checkedIds = JSON.parse(daySched.lesson_ids_json || '[]').map(Number); } catch { checkedIds = []; }
      }
    }

    lessonsDiv.style.display = 'block';
    lessonList.innerHTML = allLessons.map((l, i) => `
      <label style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);cursor:pointer;font-size:13px">
        <input type="checkbox" class="sch-lesson-cb" value="${l.id}" ${checkedIds.includes(l.id) ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--accent)">
        <span>${i + 1}. ${esc(l.name)}</span>
      </label>`).join('');
    saveBtn.disabled = false;
  }

  async function updateExisting() {
    const cid = Number(courseSel.value);
    const uid = Number(studentSel.value);
    const date = dateInput.value;
    existingDiv.style.display = 'none';
    if (!cid || !uid || !date) return;
    const schedules = await db.getByIndex('schedule', 'user_id', uid);
    const daySched = schedules.find(s => s.course_id === cid && s.date === date);
    if (!daySched) return;
    existingDiv.style.display = 'block';
    const allLessons = await db.getByIndex('lessons', 'course_id', cid);
    let dayLessonIds = [];
    try { dayLessonIds = JSON.parse(daySched.lesson_ids_json || '[]').map(Number); } catch { dayLessonIds = []; }
    const lessonNames = dayLessonIds.map(id => {
      const l = allLessons.find(x => x.id === id);
      return l ? l.name : `Lesson #${id}`;
    });
    existingList.innerHTML = `
      <div style="padding:10px 14px;background:var(--surface2);border:1px solid var(--border2);border-radius:10px;display:flex;align-items:center;justify-content:space-between;gap:10px">
        <div>
          <div style="font-size:13px;font-weight:600">${esc(lessonNames.join(', '))}</div>
          <div style="font-size:11px;color:var(--text3);font-family:var(--mono)">${date} · ${lessonNames.length} уроків</div>
        </div>
        <button class="btn bd bsm" data-action="sch-delete" data-sch-id="${daySched.id}" style="font-size:11px;padding:4px 10px">✕</button>
      </div>`;
  }

  courseSel.addEventListener('change', () => { updateStudents(); updateLessons(); updateExisting(); });
  studentSel.addEventListener('change', () => { updateLessons(); updateExisting(); });
  dateInput.addEventListener('change', () => { updateLessons(); updateExisting(); });

  saveBtn.addEventListener('click', async () => {
    const cid = Number(courseSel.value);
    const uid = Number(studentSel.value);
    const date = dateInput.value;
    if (!cid || !uid || !date) return;
    const checked = [...document.querySelectorAll('.sch-lesson-cb:checked')].map(cb => Number(cb.value));
    const lessonIdsJson = JSON.stringify(checked);
    const schedules = await db.getByIndex('schedule', 'user_id', uid);
    const existing = schedules.find(s => s.course_id === cid && s.date === date);
    if (existing) {
      await db.put('schedule', { id: existing.id, user_id: uid, course_id: cid, date, lesson_ids_json: lessonIdsJson, notes: existing.notes || '' });
    } else {
      await db.add('schedule', { user_id: uid, course_id: cid, date, lesson_ids_json: lessonIdsJson, notes: '' });
    }
    updateExisting();
    alert('Розклад збережено');
  });

  clearBtn.addEventListener('click', () => {
    courseSel.value = '';
    studentSel.innerHTML = '<option value="">— Оберіть учня —</option>';
    lessonsDiv.style.display = 'none';
    existingDiv.style.display = 'none';
    saveBtn.disabled = true;
  });
}
