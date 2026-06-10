import { esc } from '../utils.js';
import { toEmbedUrl } from './media.js';

export function buildChoose(t) {
  let gi = 0;
  function renderChooseLine(line) {
    const parts = line.split(/(\[[^\]]+\])/g);
    return parts
      .map((p) => {
        if (p.startsWith('[') && p.endsWith(']')) {
          const opts = p.slice(1, -1).split('\\').map((o) => o.trim());
          const gid = `cg-${t.id}-${gi++}`;
          const items = opts
            .map((o) => {
              const isC = o.endsWith('*');
              const txt = o.replace(/\*$/, '');
              return `<div class="cs-opt" data-val="${esc(txt)}" data-correct="${isC}" data-gid="${gid}">${esc(txt)}</div>`;
            })
            .join('');
          return `<span class="cs-wrap"><span class="cs-btn" id="${gid}" data-chosen="" data-correct="" data-action="toggle-pop" data-gid="${gid}">— вибери —</span><div class="cs-popup" id="pop-${gid}">${items}</div></span>`;
        }
        return esc(p);
      })
      .join('');
  }
  const lines = t.input.split('\n').filter((l) => l.trim());
  if (lines.length <= 1) return `<div class="choose-sent">${renderChooseLine(t.input)}</div>`;
  return lines
    .map(
      (line, li) =>
        `<div class="choose-sent" style="margin-bottom:6px"><span style="color:var(--text3);font-family:var(--mono);font-size:11px;margin-right:6px">${li + 1}.</span>${renderChooseLine(line)}</div>`
    )
    .join('');
}

export function buildFillIn(t) {
  let bi = 0;
  function renderFillLine(line) {
    const parts = line.split(/(\[[^\]]+\])/g);
    return parts
      .map((p) => {
        if (p.startsWith('[') && p.endsWith(']')) {
          const ans = p.slice(1, -1).trim();
          const w = Math.max(80, ans.length * 10 + 20);
          return `<input class="fi-inp" id="fi-${t.id}-${bi++}" data-answer="${esc(ans)}" type="text" placeholder="..." style="width:${w}px" spellcheck="false">`;
        }
        return esc(p);
      })
      .join('');
  }
  const lines = t.input.split('\n').filter((l) => l.trim());
  if (lines.length <= 1) return `<div class="fi-sent">${renderFillLine(t.input)}</div>`;
  return lines
    .map(
      (line, li) =>
        `<div class="fi-sent" style="margin-bottom:6px"><span style="color:var(--text3);font-family:var(--mono);font-size:11px;margin-right:6px">${li + 1}.</span>${renderFillLine(line)}</div>`
    )
    .join('');
}

export function buildFillInBox(t) {
  const lines = t.input.split('\n').filter((l) => l.trim());
  let bi = 0;
  const allAnswers = [];
  lines.forEach((line) => {
    (line.match(/\[[^\]]+\]/g) || []).forEach((m) => allAnswers.push(m.slice(1, -1).trim()));
  });
  const shuffled = [...allAnswers].sort(() => Math.random() - 0.5);
  const boxHTML =
    `<div class="word-box-label">Слова:</div><div class="word-box" id="wbox-${t.id}">` +
    shuffled
      .map(
        (w) =>
          `<span class="wb-chip" draggable="true" data-word="${esc(w)}" id="wchip-${t.id}-${esc(w).replace(/\s/g, '_')}">${esc(w)}</span>`
      )
      .join('') +
    '</div>';

  const sentHTML = lines
    .map((line, li) => {
      const parts = line.split(/(\[[^\]]+\])/g);
      const lineHTML = parts
        .map((p) => {
          if (p.startsWith('[') && p.endsWith(']')) {
            const ans = p.slice(1, -1).trim();
            const id = `fbi-${t.id}-${bi++}`;
            return `<span class="fb-inp fb-drop" id="${id}" data-answer="${esc(ans)}" data-word="">___</span>`;
          }
          return esc(p);
        })
        .join('');
      const prefix =
        lines.length > 1
          ? `<span style="color:var(--text3);font-family:var(--mono);font-size:11px;margin-right:6px">${li + 1}.</span>`
          : '';
      return `<div class="fb-sent" style="margin-bottom:6px">${prefix}${lineHTML}</div>`;
    })
    .join('');

  return `<div class="fillinbox-container">${boxHTML}${sentHTML}</div>`;
}

export function buildOrder(t) {
  const lines = t.input.split('\n').filter((l) => l.trim());
  if (lines.length <= 1) {
    const words = t.input.split('\\').map((w) => w.trim()).filter(Boolean);
    const correct = words.join(' ');
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    return (
      '<div class="word-bank-label">Слова:</div>' +
      `<div class="word-bank" id="bank-${t.id}">` +
      shuffled.map((w) => `<div class="wchip" draggable="true" data-word="${esc(w)}">${esc(w)}</div>`).join('') +
      '</div>' +
      '<div class="word-zone-label">Склади речення:</div>' +
      `<div class="word-zone" id="zone-${t.id}" data-answer="${esc(correct)}"></div>`
    );
  }
  return lines
    .map((line, li) => {
      const words = line.split('\\').map((w) => w.trim()).filter(Boolean);
      const correct = words.join(' ');
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      const sid = `${t.id}-s${li}`;
      return (
        `<div style="margin-bottom:12px">` +
        `<div class="word-bank-label">Речення ${li + 1}:</div>` +
        `<div class="word-bank" id="bank-${sid}">` +
        shuffled.map((w) => `<div class="wchip" draggable="true" data-word="${esc(w)}">${esc(w)}</div>`).join('') +
        '</div>' +
        `<div class="word-zone" id="zone-${sid}" data-answer="${esc(correct)}"></div>` +
        '</div>'
      );
    })
    .join('');
}

export function buildPhoto(t) {
  if (!t.images || !t.images.length) return '<div style="color:var(--text3);font-size:13px">— немає фото —</div>';
  return `<img class="photo-display" src="${t.images[0]}" alt="photo">`;
}

export function buildGallery(t) {
  if (!t.images || !t.images.length) return '<div style="color:var(--text3);font-size:13px">— немає фото —</div>';
  const captions = t.captions || [];
  const slides = t.images
    .map(
      (src, i) =>
        `<div class="gallery-slide">
          <img src="${src}" alt="">
          ${captions[i] ? `<div class="gallery-caption">${esc(captions[i])}</div>` : ''}
        </div>`
    )
    .join('');
  const dots = t.images
    .map((_, i) => `<span class="g-dot ${i === 0 ? 'active' : ''}" data-action="go-slide" data-tid="${t.id}" data-idx="${i}"></span>`)
    .join('');
  return `
    <div class="gallery-wrap">
      <div class="gallery-track" id="gt-${t.id}" data-idx="0">${slides}</div>
    </div>
    <div class="gallery-nav">
      <button class="g-btn" data-action="go-slide" data-tid="${t.id}" data-delta="-1">‹</button>
      <div class="g-dots" id="gd-${t.id}">${dots}</div>
      <button class="g-btn" data-action="go-slide" data-tid="${t.id}" data-delta="1">›</button>
    </div>`;
}

export function buildVideo(t) {
  if (!t.videoUrl) return '<div style="color:var(--text3);font-size:13px">— немає відео —</div>';
  const embed = toEmbedUrl(t.videoUrl);
  if (!embed) {
    return `<div style="color:var(--text3);font-size:13px">Не вдалося визначити відео.<br><a href="${esc(t.videoUrl)}" target="_blank" style="color:var(--accent)">${esc(t.videoUrl)}</a></div>`;
  }
  return `<div class="video-wrap"><iframe src="${embed}" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"></iframe></div>`;
}

export function buildWordwall(t) {
  if (!t.videoUrl) return '<div style="color:var(--text3);font-size:13px">— вставте посилання Wordwall —</div>';
  let url = t.videoUrl.trim();
  if (url.includes('wordwall.net/resource')) {
    url = url.replace('wordwall.net/resource', 'wordwall.net/embed/').replace(/\/+$/, '');
    if (!url.includes('/embed/')) url = url.replace('wordwall.net/', 'wordwall.net/embed/');
  }
  return `<div class="wordwall-wrap"><iframe src="${esc(url)}" allowfullscreen frameborder="0" allow="autoplay; fullscreen"></iframe></div>`;
}

export function buildGame(t) {
  if (!t.videoUrl) return '<div style="color:var(--text3);font-size:13px">— вставте посилання на гру —</div>';
  let url = t.videoUrl.trim();
  const bbMatch = url.match(/baamboozle\.com\/game\/(\d+)/);
  if (bbMatch) url = `https://www.baamboozle.com/embed/game/${bbMatch[1]}`;
  return `<div class="wordwall-wrap"><iframe src="${esc(url)}" allowfullscreen frameborder="0" allow="autoplay; fullscreen"></iframe><div style="margin-top:8px;font-size:12px;font-family:var(--mono)"><a href="${esc(t.videoUrl)}" target="_blank" style="color:var(--accent)">Відкрити гру в новій вкладці ↗</a></div></div>`;
}

export function buildTextBlock(t) {
  if (!t.input) return '<div style="color:var(--text3);font-size:13px">— текст відсутній —</div>';
  return `<div class="text-block">${esc(t.input)}</div>`;
}

export function buildMatch(t) {
  if (!t.input) return '<div style="color:var(--text3);font-size:13px">— немає пар —</div>';
  const pairs = t.input
    .split('\n')
    .map((l) => l.split('|'))
    .filter((p) => p.length === 2)
    .map((p) => ({ l: p[0].trim(), r: p[1].trim() }));
  if (!pairs.length) {
    return '<div style="color:var(--text3);font-size:13px">— формат: ліво | право (кожна пара на новому рядку) —</div>';
  }
  const shuffledR = [...pairs.map((p) => p.r)].sort(() => Math.random() - 0.5);
  const leftHTML = pairs
    .map(
      (p, i) =>
        `<div class="match-item" id="ml-${t.id}-${i}" data-idx="${i}" data-matched="" data-action="match-click" data-tid="${t.id}" data-side="left" data-midx="${i}">${esc(p.l)}</div>`
    )
    .join('');
  const rightHTML = shuffledR
    .map((r, i) => {
      const origIdx = pairs.findIndex((p) => p.r === r);
      return `<div class="match-item" id="mr-${t.id}-${i}" data-idx="${i}" data-orig="${origIdx}" data-matched="" data-action="match-click" data-tid="${t.id}" data-side="right" data-midx="${i}">${esc(r)}</div>`;
    })
    .join('');
  return `<div class="match-container" id="match-${t.id}" data-pairs="${esc(JSON.stringify(pairs))}">
    <div class="match-col"><div class="match-col-label">❓ Питання</div>${leftHTML}</div>
    <div class="match-col"><div class="match-col-label">💬 Відповіді</div>${rightHTML}</div>
  </div>`;
}
