import {
  toggleSB,
  renderSB,
  showHome,
  toggleFolder,
  showFolderView,
  openLesson,
  setSidePanel,
  setLTab,
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
import { moveTaskUp, moveTaskDown } from './tasks/reorder.js';
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
import { D } from './store.js';

function initStaticControls() {
  document.getElementById('sbToggle').addEventListener('click', toggleSB);
  document.getElementById('btnNewFolder').addEventListener('click', openCF);
  document.getElementById('btnHome').addEventListener('click', showHome);
  document.getElementById('MO').addEventListener('click', closeMOBg);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMO();
  });
  document.addEventListener('click', () => {
    closeTaskMenus();
    closeChoosePops();
  });
}

function handleAction(e) {
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
      showFolderView(D.folders.find((x) => x.id === fid), D.lessons[fid] || []);
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
    default:
      break;
  }

  if (action === 'trigger-img' || el.dataset.pasteZone) {
    setPasteZone(el.dataset.pasteZone || 'images');
  }
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
  }
}

function init() {
  initStaticControls();
  document.body.addEventListener('click', handleAction);
  document.body.addEventListener('click', handleChooseOpt);
  document.body.addEventListener('change', handleModalFiles);
  document.body.addEventListener('keydown', handleVocabEnter);
  document.addEventListener('paste', handleModalPaste);
  document.body.addEventListener(
    'focusin',
    (e) => {
      const zone = e.target.closest('[data-paste-zone]');
      if (zone) setPasteZone(zone.dataset.pasteZone);
    },
    true
  );
  renderSB();
  showHome();
}

init();
