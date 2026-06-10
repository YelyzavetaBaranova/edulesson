import { esc } from './utils.js';
import { addVocabWord } from './vocab.js';

let trWord = null;
let trTr = null;

export function buildTranslatePanelHTML() {
  return `<div class="translator-panel">
    <div class="tr-title">🔤 Перекладач</div>
    <div class="tr-input-row">
      <input class="tr-input" id="trInput" type="text" placeholder="Введи слово або фразу...">
      <button class="tr-btn" data-action="do-translate">→</button>
    </div>
    <div class="tr-result" id="trResult">
      <div style="color:var(--text3);font-size:12px;font-family:var(--mono)">Результат перекладу з'явиться тут</div>
    </div>
    <div id="trAddBtn" style="display:none">
      <div class="tr-add-vocab" data-action="add-to-vocab-tr">＋ Додати до словника</div>
    </div>
  </div>`;
}

export async function doTranslate() {
  const inp = document.getElementById('trInput');
  if (!inp) return;
  const word = inp.value.trim();
  if (!word) return;
  const res = document.getElementById('trResult');
  res.innerHTML = '<div style="color:var(--text3);font-size:12px;font-family:var(--mono)">Перекладаю...</div>';
  const addBtn = document.getElementById('trAddBtn');
  if (addBtn) addBtn.style.display = 'none';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `Translate the following word or phrase to Ukrainian. If it's already Ukrainian, translate to English. Reply with ONLY the translation, nothing else, no explanation.\n\n"${word}"`,
          },
        ],
      }),
    });
    const data = await response.json();
    const translated = (data.content?.[0]?.text || '').trim().replace(/^["']|["']$/g, '');
    if (translated && translated.toLowerCase() !== word.toLowerCase()) {
      res.innerHTML = `<div class="tr-result-word">${esc(translated)}</div><div class="tr-result-sub">${esc(word)}</div>`;
      trWord = word;
      trTr = translated;
      if (addBtn) addBtn.style.display = 'block';
    } else {
      res.innerHTML = '<div style="color:var(--amber);font-size:12px;font-family:var(--mono)">Переклад не знайдено</div>';
    }
  } catch {
    res.innerHTML = '<div style="color:var(--red);font-size:12px;font-family:var(--mono)">Помилка з\'єднання</div>';
  }
}

export function addToVocabFromTr() {
  if (!trWord || !trTr) return;
  addVocabWord(trWord, trTr);
  const btn = document.getElementById('trAddBtn');
  if (btn) btn.style.display = 'none';
  const res = document.getElementById('trResult');
  if (res) {
    res.innerHTML += '<div style="color:var(--green);font-size:11px;font-family:var(--mono);margin-top:6px">✅ Додано до словника</div>';
  }
}
