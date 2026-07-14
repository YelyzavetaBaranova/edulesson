import { esc } from './utils.js';
import { D, save } from './store.js';

export function buildVocabPanelHTML() {
  return `<div class="vocab-panel">
    <div class="vocab-title">📖 Словник</div>
    <div class="vocab-add-row">
      <input class="vocab-inp" id="viWord" type="text" placeholder="Слово (EN)">
      <input class="vocab-inp" id="viTr" type="text" placeholder="Переклад" style="max-width:130px">
      <button class="btn bgr bsm" data-action="add-vocab-manual">＋</button>
    </div>
    <div id="vocabList">${renderVocabItems()}</div>
  </div>`;
}

export function renderVocabItems() {
  if (!D.vocab.length) {
    return '<div style="color:var(--text3);font-size:12px;font-family:var(--mono);padding:8px 0">Словник порожній</div>';
  }
  return D.vocab
    .map(
      (v, i) => `
    <div class="vocab-item">
      <div>
        <div class="vi-word">${esc(v.word)}</div>
        <div class="vi-tr">${esc(v.tr)}</div>
      </div>
      <button class="vi-del" data-action="del-vocab" data-idx="${i}">×</button>
    </div>`
    )
    .join('');
}

export function addVocabManual() {
  const wEl = document.getElementById('viWord');
  const tEl = document.getElementById('viTr');
  if (!wEl || !tEl) return;
  const word = wEl.value.trim();
  const tr = tEl.value.trim();
  if (!word) return;
  addVocabWord(word, tr);
  wEl.value = '';
  tEl.value = '';
}

export function addVocabWord(word, tr) {
  if (D.vocab.find((v) => v.word.toLowerCase() === word.toLowerCase())) return;
  D.vocab.push({ word, tr });
  save();
  const vl = document.getElementById('vocabList');
  if (vl) vl.innerHTML = renderVocabItems();
}

export function delVocab(i) {
  D.vocab.splice(i, 1);
  save();
  const vl = document.getElementById('vocabList');
  if (vl) vl.innerHTML = renderVocabItems();
}
