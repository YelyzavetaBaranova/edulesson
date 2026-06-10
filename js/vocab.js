import { esc } from './utils.js';
import { D, save } from './store.js';
import { getLessonRef, getCourseRef } from './store.js';

function getLessonName(lessonId) {
  if (!lessonId) return 'Загальне';
  for (const c of D.courses) {
    const l = c.lessons.find((l) => l.id === lessonId);
    if (l) return l.name;
  }
  return 'Урок ' + lessonId;
}

function getCourseNameForLesson(lessonId) {
  if (!lessonId) return '';
  for (const c of D.courses) {
    if (c.lessons.some((l) => l.id === lessonId)) return c.name;
  }
  return '';
}

export function renderVocabItems() {
  if (!D.vocab.length) {
    return '<div style="color:var(--text3);font-size:12px;font-family:var(--mono);padding:8px 0">Словник порожній</div>';
  }
  const grouped = {};
  D.vocab.forEach((v, i) => {
    const key = v.lesson_id || 0;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({ ...v, idx: i });
  });
  const keys = Object.keys(grouped).sort((a, b) => {
    const aName = getLessonName(parseInt(a));
    const bName = getLessonName(parseInt(b));
    if (a === '0') return 1;
    if (b === '0') return -1;
    return aName.localeCompare(bName);
  });
  return keys.map((key) => {
    const words = grouped[key];
    const lessonId = parseInt(key);
    const lessonName = getLessonName(lessonId);
    const courseName = getCourseNameForLesson(lessonId);
    return `<div style="margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:6px;font-family:var(--mono)">
        ${esc(lessonName)}${courseName ? `<span style="font-weight:400;color:var(--text3);margin-left:6px;font-size:10px">${esc(courseName)}</span>` : ''}
      </div>
      ${words.map((v) => `
        <div class="vocab-item">
          <div>
            <div class="vi-word">${esc(v.word)}</div>
            <div class="vi-tr">${esc(v.tr)}</div>
          </div>
          <button class="vi-del" data-action="del-vocab" data-idx="${v.idx}">×</button>
        </div>`).join('')}
    </div>`;
  }).join('');
}

export function buildVocabPanelHTML(lessonId) {
  return `<div class="vocab-panel">
    <div class="vocab-title">📖 Словник</div>
    <div class="vocab-add-row">
      <input class="vocab-inp" id="viWord" type="text" placeholder="Слово (EN)">
      <input class="vocab-inp" id="viTr" type="text" placeholder="Переклад" style="max-width:130px">
      <input type="hidden" id="viLessonId" value="${lessonId || ''}">
      <button class="btn bgr bsm" data-action="add-vocab-manual">＋</button>
    </div>
    <div id="vocabList">${renderVocabItems()}</div>
  </div>`;
}

export function buildVocabPageHTML() {
  return `<div class="vocab-page">
    <div class="sec-title" style="margin-bottom:16px">📖 Словник (за уроками)</div>
    <div class="vocab-add-row" style="margin-bottom:16px">
      <input class="vocab-inp" id="viWord" type="text" placeholder="Слово (EN)">
      <input class="vocab-inp" id="viTr" type="text" placeholder="Переклад" style="max-width:130px">
      <button class="btn bgr bsm" data-action="add-vocab-manual">＋</button>
    </div>
    <div id="vocabPageList">${renderVocabItems()}</div>
  </div>`;
}

export async function renderVocabPage() {
  const vl = document.getElementById('vocabPageList');
  if (vl) vl.innerHTML = renderVocabItems();
}

export async function addVocabManual() {
  const wEl = document.getElementById('viWord');
  const tEl = document.getElementById('viTr');
  const lEl = document.getElementById('viLessonId');
  if (!wEl || !tEl) return;
  const word = wEl.value.trim();
  const tr = tEl.value.trim();
  if (!word) return;
  const lessonId = lEl ? parseInt(lEl.value, 10) || null : null;
  await addVocabWord(word, tr, lessonId);
  wEl.value = '';
  tEl.value = '';
}

export async function addVocabWord(word, tr, lessonId) {
  if (D.vocab.find((v) => v.word.toLowerCase() === word.toLowerCase())) return;
  D.vocab.push({ word, tr, lesson_id: lessonId || null });
  await save();
  const vl = document.getElementById('vocabList');
  if (vl) vl.innerHTML = renderVocabItems();
  const vp = document.getElementById('vocabPageList');
  if (vp) vp.innerHTML = renderVocabItems();
}

export async function delVocab(i) {
  D.vocab.splice(i, 1);
  await save();
  const vl = document.getElementById('vocabList');
  if (vl) vl.innerHTML = renderVocabItems();
  const vp = document.getElementById('vocabPageList');
  if (vp) vp.innerHTML = renderVocabItems();
}
