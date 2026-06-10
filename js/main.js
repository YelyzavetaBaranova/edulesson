import { init, D, getCourseRef } from './store.js';
import { seedAdmin, restoreSession, login, register, logout, currentUser, isAdmin } from './auth.js';
import * as db from './db/index.js';
import {
  toggleSB,
  renderSB,
  showHome,
  toggleFolder,
  showCourseView,
  openLesson,
  setSidePanel,
  setLTab,
  showAdminPanel,
  showHomeworkPanel,
  showVocabPage,
  showStudentsTab,
  showScheduleTab,
  showMaterialsTab,
  showProfile,
} from './navigation.js';
import {
  openCF,
  openCL,
  openCT,
  closeMO,
  closeMOBg,
  createFolder,
  createLesson,
  saveNewTask,
  saveEditTask,
  editTask,
  selTType,
  triggerImgPick,
  onImgPick,
  onHintImgPick,
  removeImg,
  handleModalPaste,
  setPasteZone,
} from './modals.js';
import { moveTaskDown, moveTaskUp } from './tasks/reorder.js';
import { delTask, delLesson, delFolder } from './delete.js';
import { doTranslate, addToVocabFromTr } from './translator.js';
import { addVocabManual, delVocab } from './vocab.js';
import { checkOne, checkAll, showAnswer, resetTask, resetAll } from './tasks/grading.js';
import {
  togglePop,
  pickOpt,
  matchClick,
  toggleHint,
  toggleTaskMenu,
  closeTaskMenus,
  closeChoosePops,
} from './tasks/interactions.js';
import { goSlide } from './tasks/media.js';
import { renderTeacherHomeworkList, renderStudentHomeworkList, markHomeworkDone, addHomeworkTask, returnHomework, createHomework } from './homework.js';

import { updateProgress } from './progress.js';

function showAuthScreen() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sbToggle');
  if (sidebar) sidebar.style.display = 'none';
  if (toggle) toggle.style.display = 'none';
  document.getElementById('mc').innerHTML = `
    <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px">
      <div style="background:var(--surface);border:1px solid var(--border2);border-radius:16px;padding:32px;width:100%;max-width:400px;box-shadow:0 24px 60px rgba(0,0,0,.5)">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:40px;margin-bottom:8px">📚</div>
          <div style="font-size:22px;font-weight:800">EduLesson</div>
          <div style="font-size:12px;color:var(--text3);font-family:var(--mono);margin-top:4px">Вхід до системи</div>
        </div>
        <div id="authForm">
          <div class="fg"><label>Email</label><input type="email" id="authEmail" placeholder="email@example.com"></div>
          <div class="fg"><label>Пароль</label><input type="password" id="authPass" placeholder="••••••••"></div>
          <div id="authError" style="color:var(--red);font-size:12px;font-family:var(--mono);margin-bottom:10px;display:none"></div>
          <div style="display:flex;gap:8px">
            <button class="btn bp" style="flex:1" id="authLoginBtn">Увійти</button>
            <button class="btn bg" style="flex:1" id="authRegisterBtn">Реєстрація</button>
          </div>
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);font-size:11px;color:var(--text3);font-family:var(--mono);text-align:center">
          Admin: admin@edulesson.com / admin123
        </div>
      </div>
    </div>`;
  document.getElementById('tbTitle').textContent = 'Вхід';
  document.getElementById('tbBread').innerHTML = '';
  document.getElementById('tbActions').innerHTML = '';
}

function showApp() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sbToggle');
  if (sidebar) sidebar.style.display = '';
  if (toggle) toggle.style.display = '';
  renderSB();
  showHome();
}

function initAuthHandlers() {
  document.addEventListener('click', async (e) => {
    const loginBtn = e.target.closest('#authLoginBtn');
    if (loginBtn) {
      e.preventDefault();
      const email = document.getElementById('authEmail')?.value.trim();
      const pass = document.getElementById('authPass')?.value;
      const err = document.getElementById('authError');
      if (!email || !pass) {
        if (err) { err.textContent = 'Заповніть всі поля'; err.style.display = 'block'; }
        return;
      }
      try {
        await login(email, pass);
        showApp();
      } catch (ex) {
        if (err) { err.textContent = ex.message; err.style.display = 'block'; }
      }
      return;
    }
    const regBtn = e.target.closest('#authRegisterBtn');
    if (regBtn) {
      e.preventDefault();
      const email = document.getElementById('authEmail')?.value.trim();
      const pass = document.getElementById('authPass')?.value;
      const err = document.getElementById('authError');
      if (!email || !pass) {
        if (err) { err.textContent = 'Заповніть всі поля'; err.style.display = 'block'; }
        return;
      }
      try {
        await register(email, pass, email.split('@')[0]);
        showApp();
      } catch (ex) {
        if (err) { err.textContent = ex.message; err.style.display = 'block'; }
      }
      return;
    }
  });
}

function initStaticControls() {
  document.getElementById('sbToggle').addEventListener('click', toggleSB);
  document.getElementById('MO').addEventListener('click', closeMOBg);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMO();
  });
  document.addEventListener('click', () => {
    closeTaskMenus();
    closeChoosePops();
  });
}

async function handleAction(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;

  const action = el.dataset.action;
  const { fid, lid, tid, type, panel, tab, idx, delta, side, midx, gid } = el.dataset;

  switch (action) {
    case 'toggle-folder':
      e.stopPropagation();
      toggleFolder(fid);
      break;
    case 'open-lesson':
      openLesson(fid, lid);
      break;
    case 'open-cl':
      openCL(fid);
      break;
    case 'del-folder':
      delFolder(fid);
      break;
    case 'del-lesson':
      delLesson(fid, lid);
      break;
    case 'show-folder':
      showCourseView(getCourseRef(fid));
      break;
    case 'set-side-panel':
      setSidePanel(panel);
      break;
    case 'set-ltab':
      setLTab(tab, fid, lid);
      break;
    case 'open-ct':
      openCT(fid, lid);
      break;
    case 'check-one':
      checkOne(tid, type);
      break;
    case 'check-all':
      checkAll(fid, lid);
      break;
    case 'reset-all':
      resetAll(fid, lid);
      break;
    case 'show-answer':
      showAnswer(tid, type);
      break;
    case 'reset-task':
      resetTask(tid, type);
      break;
    case 'toggle-hint':
      toggleHint(tid);
      break;
    case 'toggle-task-menu':
      toggleTaskMenu(tid, e);
      break;
    case 'edit-task':
      closeTaskMenus();
      editTask(fid, lid, tid);
      break;
    case 'del-task':
      closeTaskMenus();
      delTask(fid, lid, tid);
      break;
    case 'toggle-pop':
      togglePop(e, gid);
      break;
    case 'match-click':
      matchClick(tid, side, parseInt(midx, 10));
      break;
    case 'go-slide':
      if (el.dataset.idx !== undefined) goSlide(tid, parseInt(el.dataset.idx, 10));
      else goSlide(tid, parseInt(delta, 10));
      break;
    case 'close-modal':
      closeMO();
      break;
    case 'create-folder':
      createFolder();
      break;
    case 'show-new-course':
      openCF();
      break;
    case 'create-lesson':
      createLesson(fid);
      break;
    case 'save-new-task':
      saveNewTask(fid, lid);
      break;
    case 'save-edit-task':
      saveEditTask(fid, lid, tid);
      break;
    case 'sel-type':
      selTType(el.dataset.type, fid, lid, el.dataset.eid, el);
      break;
    case 'trigger-img':
      triggerImgPick();
      break;
    case 'remove-img':
      removeImg(parseInt(idx, 10));
      break;
    case 'do-translate':
      doTranslate();
      break;
    case 'add-to-vocab-tr':
      addToVocabFromTr();
      break;
    case 'add-vocab-manual':
      addVocabManual();
      break;
    case 'del-vocab':
      delVocab(parseInt(idx, 10));
      break;
    case 'move-task-up':
      closeTaskMenus();
      moveTaskUp(fid, lid, tid);
      break;
    case 'move-task-down':
      closeTaskMenus();
      moveTaskDown(fid, lid, tid);
      break;
    case 'show-home':
      showHome();
      break;
    case 'show-admin':
      showAdminPanel();
      break;
    case 'show-students':
      showStudentsTab();
      break;
    case 'show-schedule':
      showScheduleTab();
      break;
    case 'show-materials':
      showMaterialsTab();
      break;
    case 'show-homework':
      showHomeworkPanel();
      break;
    case 'show-vocab-page':
      showVocabPage();
      break;
    case 'show-profile':
      showProfile(el.dataset.userId);
      break;
    case 'admin-tab':
      if (el.dataset.tab === 'students') showStudentsTab();
      else if (el.dataset.tab === 'schedule') showScheduleTab();
      else if (el.dataset.tab === 'materials') showMaterialsTab();
      break;
    case 'go-to-student-lesson':
      await openLesson(fid || el.dataset.courseId, el.dataset.lessonId);
      break;
    case 'hw-mark-done':
      await markHomeworkDone(parseInt(el.dataset.hwId, 10));
      if (isAdmin()) await renderTeacherHomeworkList();
      else await renderStudentHomeworkList();
      break;
    case 'hw-add-task':
      addTaskToHomework(parseInt(el.dataset.hwId));
      break;
    case 'hw-add-task-typed':
      (async () => {
        const inp = document.querySelector(`.hw-task-input[data-hw-id="${el.dataset.hwId}"]`);
        if (!inp || !inp.value.trim()) return;
        await addHomeworkTask(parseInt(el.dataset.hwId), { title: inp.value.trim(), instruction: inp.value.trim(), type: 'text' });
        inp.value = '';
        await renderTeacherHomeworkList();
      })();
      break;
    case 'hw-return':
      (async () => {
        await returnHomework(parseInt(el.dataset.hwId));
        await renderTeacherHomeworkList();
      })();
      break;
    case 'mark-done':
      await updateProgress(lid, 'done');
      if (currentUser && !isAdmin()) {
        const course = getCourseRef(fid);
        if (course) await createHomework(currentUser.id, parseInt(lid, 10), parseInt(fid, 10));
        window.__enrolledChecked = false;
      }
      showHome();
      break;
    case 'create-hw-from-lesson':
      (async () => {
        const email = prompt('Email учня:');
        if (!email) return;
        const users = await db.getAll('users');
        const student = users.find(u => u.email === email && u.role === 'student');
        if (!student) { alert('Учня з таким email не знайдено'); return; }
        await createHomework(student.id, parseInt(el.dataset.lid, 10), parseInt(el.dataset.fid, 10));
        alert('Домашнє завдання створено');
      })();
      break;
    case 'logout':
      logout();
      showAuthScreen();
      break;
    default:
      break;
  }

  if (action === 'trigger-img' || el.dataset.pasteZone) {
    setPasteZone(el.dataset.pasteZone || 'images');
  }
}

function handleAdmin(e) {
  import('./admin.js').then((m) => m.handleAdminActions(e));
}

function handleChooseOpt(e) {
  const opt = e.target.closest('.cs-opt');
  if (!opt) return;
  const gid = opt.dataset.gid;
  if (gid) {
    e.stopPropagation();
    pickOpt(opt, gid);
  }
}

function handleModalFiles(e) {
  if (e.target.id === 'mImgFile') onImgPick(e);
  if (e.target.id === 'mHintImgFile') onHintImgPick(e);
}

function handleVocabEnter(e) {
  if (e.key !== 'Enter') return;
  if (e.target.id === 'viWord') {
    document.getElementById('viTr')?.focus();
  } else if (e.target.id === 'viTr') {
    addVocabManual();
  } else if (e.target.id === 'trInput') {
    doTranslate();
  } else if (e.target.id === 'mFname' && e.target.closest('#MO')) {
    createFolder();
  } else if (e.target.id === 'mLname' && e.target.closest('#MO')) {
    const btn = document.querySelector('[data-action="create-lesson"]');
    if (btn) createLesson(btn.dataset.fid);
  } else if (e.target.id === 'authPass' && !currentUser) {
    document.getElementById('authLoginBtn')?.click();
  }
}

function addTaskToHomework(hwId) {
  const title = prompt('Назва завдання:');
  if (!title || !title.trim()) return;
  const instruction = prompt('Інструкція (або залиште порожнім):', title);
  addHomeworkTask(hwId, { title: title.trim(), instruction: (instruction || title).trim(), type: 'text' }).then(() => {
    renderTeacherHomeworkList();
  });
}

async function boot() {
  await seedAdmin();
  await init(); // load D from IndexedDB
  initStaticControls();
  initAuthHandlers();

  document.body.addEventListener('click', handleAction);
  document.body.addEventListener('click', handleChooseOpt);
  document.body.addEventListener('click', handleAdmin);
  document.body.addEventListener('change', handleModalFiles);
  document.body.addEventListener('keydown', handleVocabEnter);
  document.addEventListener('paste', handleModalPaste);
  document.body.addEventListener('focusin', (e) => {
    const zone = e.target.closest('[data-paste-zone]');
    if (zone) setPasteZone(zone.dataset.pasteZone);
  }, true);

  const session = restoreSession();
  if (session) {
    await init(); // ensure D is loaded (idempotent)
    showApp();
  } else {
    showAuthScreen();
  }
}

boot();
