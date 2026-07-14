import { esc, uid, compressImage } from './utils.js';
import { HINTS } from './constants.js';
import * as state from './state.js';
import { D, save } from './store.js';

export function openMO(html) {
  document.getElementById('MB').innerHTML = html;
  document.getElementById('MO').classList.add('show');
}

export function closeMO() {
  document.getElementById('MO').classList.remove('show');
}

export function closeMOBg(e) {
  if (e.target === document.getElementById('MO')) closeMO();
}

export function openCF() {
  openMO(`<div class="mb-scroll"><div class="m-title">Нова папка</div>
    <div class="m-sub">Наприклад: A1 4-11, B1 Beginner…</div>
    <div class="fg"><label>Назва</label><input type="text" id="mFname" placeholder="A1 4-11"></div></div>
    <div class="m-footer"><button class="btn bg" data-action="close-modal">Скасувати</button><button class="btn bp" data-action="create-folder">Створити</button></div>`);
  setTimeout(() => document.getElementById('mFname')?.focus(), 50);
}

export function openCL(fid) {
  openMO(`<div class="mb-scroll"><div class="m-title">Новий урок</div>
    <div class="fg"><label>Назва</label><input type="text" id="mLname" placeholder="Урок 1 — Кольори, цифри"></div></div>
    <div class="m-footer"><button class="btn bg" data-action="close-modal">Скасувати</button><button class="btn bp" data-action="create-lesson" data-fid="${fid}">Створити</button></div>`);
  setTimeout(() => document.getElementById('mLname')?.focus(), 50);
}

export function openCT(fid, lid) {
  state.setTType('choose');
  state.setPendingImages([]);
  state.setPendingCaptions([]);
  state.setPendingHintImg(null);
  openMO(buildTM(fid, lid, null));
}

export function buildTM(fid, lid, ex) {
  const t = ex || { type: 'choose', input: '', instruction: '', hint: '', hintImg: '', videoUrl: '', images: [], captions: [] };
  state.setTType(t.type);
  state.setPendingImages(t.images ? [...t.images] : []);
  state.setPendingCaptions(t.captions ? [...t.captions] : []);
  state.setPendingHintImg(t.hintImg || null);

  const isInteractive = ['choose', 'fillin', 'fillinbox', 'order', 'match', 'text'].includes(state.tType);
  const isMedia = ['photo', 'gallery'].includes(state.tType);
  const isVideo = state.tType === 'video';
  const isWordwall = state.tType === 'wordwall';
  const isGame = state.tType === 'game';

  return `
    <div class="mb-scroll">
    <div class="m-title">${ex ? 'Редагувати' : 'Нове'} завдання</div>
    <div class="type-grid">
      ${[
        ['choose', '🔤', 'Choose', 'Вибір'],
        ['fillin', '📝', 'Fill in', 'Пропуск'],
        ['fillinbox', '📦', 'From box', 'З поля'],
        ['order', '🔀', 'Word order', 'Порядок'],
        ['match', '🔗', 'Match', "З'єднай"],
        ['text', '📄', 'Text', 'Текст'],
        ['photo', '🖼️', 'Photo', 'Фото'],
        ['gallery', '🎞️', 'Gallery', 'Галерея'],
        ['video', '🎬', 'Video', 'Відео'],
        ['wordwall', '🎮', 'Wordwall', 'Wordwall'],
        ['game', '🕹️', 'Game', 'Baamboozle'],
      ]
        .map(
          ([tp, ico, nm, sb]) => `
        <div class="type-opt ${state.tType === tp ? 'sel' : ''}" data-action="sel-type" data-type="${tp}" data-fid="${fid}" data-lid="${lid}" data-eid="${ex ? ex.id : ''}">
          <div class="to-ico">${ico}</div>
          <div class="to-name">${nm}</div>
          <div class="to-sub">${sb}</div>
        </div>`
        )
        .join('')}
    </div>
    ${isInteractive ? `<div class="hint-box-sm"><div class="hb-title">💡 Формат</div><div class="hb-text" id="mHintFmt">${HINTS[state.tType] || ''}</div></div>` : ''}
    <div class="fg"><label>Інструкція (необов'язково)</label><input type="text" id="mInstr" value="${esc(t.instruction || '')}"></div>
    ${
      isInteractive
        ? `<div class="fg"><label>${state.tType === 'text' ? 'Текст блоку' : state.tType === 'match' ? 'Пари (ліво | право, кожна на новому рядку)' : 'Завдання'}</label><textarea id="mInput" rows="${state.tType === 'text' || state.tType === 'match' ? 5 : 3}" placeholder="${state.tType === 'match' ? "What's your name? | My name is Liza.\nHow old are you? | I am 8." : state.tType === 'text' ? 'Введи текст для учнів...' : ''}">${esc(t.input || '')}</textarea></div>`
        : ''
    }
    ${
      isMedia
        ? `
      <div class="fg">
        <label>${state.tType === 'gallery' ? 'Фото для галереї (можна кілька)' : 'Фото'}</label>
        <div class="img-upload-area" id="mImgPasteZone" data-paste-zone="images" tabindex="0">
          📁 Натисни, перетягни або <b>Ctrl+V</b> (вставити фото)
          <input type="file" id="mImgFile" accept="image/*" ${state.tType === 'gallery' ? 'multiple' : ''}>
        </div>
        <div class="img-preview-list" id="mImgPreviews"></div>
      </div>`
        : ''
    }
    ${
      isVideo
        ? `<div class="fg"><label>Посилання на відео (YouTube / Vimeo)</label><input type="url" id="mVideoUrl" value="${esc(t.videoUrl || '')}" placeholder="https://youtu.be/..."></div>`
        : isWordwall
          ? `<div class="fg"><label>Посилання Wordwall (wordwall.net/resource/...)</label><input type="url" id="mVideoUrl" value="${esc(t.videoUrl || '')}" placeholder="https://wordwall.net/resource/114657840"></div>`
          : isGame
            ? `<div class="fg"><label>Посилання на гру (Baamboozle тощо)</label><input type="url" id="mVideoUrl" value="${esc(t.videoUrl || '')}" placeholder="https://www.baamboozle.com/game/2188662"></div>`
            : ''
    }
    <div class="fg">
      <label>💡 Підказка — текст (необов'язково)</label>
      <input type="text" id="mHint" value="${esc(t.hint || '')}" placeholder="Наприклад: past tense з they → were">
    </div>
    <div class="fg">
      <label>💡 Підказка — фото (необов'язково)</label>
      <div class="img-upload-area" id="mHintPasteZone" data-paste-zone="hint" style="padding:11px" tabindex="0">
        📷 Фото-підказка — або <b>Ctrl+V</b>
        <input type="file" id="mHintImgFile" accept="image/*">
      </div>
      <div id="mHintImgPreview" style="margin-top:8px">${state.pendingHintImg ? `<img src="${state.pendingHintImg}" style="max-width:100%;max-height:120px;border-radius:7px;display:block">` : ''}</div>
    </div>
    </div>
    <div class="m-footer">
      <button class="btn bg" data-action="close-modal">Скасувати</button>
      <button class="btn bp" data-action="${ex ? 'save-edit-task' : 'save-new-task'}" data-fid="${fid}" data-lid="${lid}" data-tid="${ex ? ex.id : ''}">${ex ? 'Зберегти' : 'Додати'}</button>
    </div>`;
}

export function triggerImgPick() {
  document.getElementById('mImgFile')?.click();
}

export function onImgPick(e) {
  const files = [...e.target.files];
  if (!files.length) return;
  const readNext = (i) => {
    if (i >= files.length) {
      renderImgPreviews();
      return;
    }
    const r = new FileReader();
    r.onload = async (ev) => {
      const compressed = await compressImage(ev.target.result);
      state.pendingImages.push(compressed);
      state.pendingCaptions.push('');
      readNext(i + 1);
    };
    r.readAsDataURL(files[i]);
  };
  readNext(0);
}

export function onHintImgPick(e) {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = async (ev) => {
    const compressed = await compressImage(ev.target.result);
    state.setPendingHintImg(compressed);
    document.getElementById('mHintImgPreview').innerHTML = `<img src="${state.pendingHintImg}" style="max-width:100%;max-height:120px;border-radius:7px;display:block">`;
  };
  r.readAsDataURL(file);
}

export function renderImgPreviews() {
  const el = document.getElementById('mImgPreviews');
  if (!el) return;
  el.innerHTML = state.pendingImages
    .map(
      (src, i) => `
    <div class="img-prev-item">
      <img src="${src}">
      <input class="img-caption" data-idx="${i}" value="${esc(state.pendingCaptions[i] || '')}" placeholder="Підпис до фото..." spellcheck="false">
      <button class="img-prev-del" data-action="remove-img" data-idx="${i}">×</button>
    </div>`
    )
    .join('');
}

function syncCaptions() {
  const els = document.querySelectorAll('#mImgPreviews .img-caption');
  els.forEach((el, idx) => {
    if (state.pendingCaptions[idx] !== undefined) {
      state.pendingCaptions[idx] = el.value;
    }
  });
}

export function removeImg(i) {
  syncCaptions();
  state.pendingImages.splice(i, 1);
  state.pendingCaptions.splice(i, 1);
  renderImgPreviews();
}

let pasteZone = 'images';

export function setPasteZone(zone) {
  pasteZone = zone;
}

export function addImageFromFile(file, zone) {
  if (!file || !file.type.startsWith('image/')) return;
  const r = new FileReader();
  r.onload = async (ev) => {
    const compressed = await compressImage(ev.target.result);
    if (zone === 'hint') {
      state.setPendingHintImg(compressed);
      const el = document.getElementById('mHintImgPreview');
      if (el) {
        el.innerHTML = `<img src="${state.pendingHintImg}" style="max-width:100%;max-height:120px;border-radius:7px;display:block">`;
      }
    } else {
      if (state.tType === 'photo' && state.pendingImages.length >= 1) {
        state.setPendingImages([compressed]);
        state.setPendingCaptions(['']);
      } else {
        state.pendingImages.push(compressed);
        state.pendingCaptions.push('');
      }
      renderImgPreviews();
    }
  };
  r.readAsDataURL(file);
}

export function handleModalPaste(e) {
  if (!document.getElementById('MO')?.classList.contains('show')) return;
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const zone = document.getElementById('mImgPasteZone') ? pasteZone : 'hint';
      addImageFromFile(item.getAsFile(), zone);
      break;
    }
  }
}

export function selTType(tp, fid, lid, eid, el) {
  state.setTType(tp);
  document.querySelectorAll('.type-opt').forEach((opt) => opt.classList.remove('sel'));
  el.classList.add('sel');
  const hf = document.getElementById('mHintFmt');
  if (hf && HINTS[tp]) hf.innerHTML = HINTS[tp];

  const inp = document.getElementById('mInput')?.value || '';
  const isI = ['choose', 'fillin', 'fillinbox', 'order', 'match', 'text'].includes(tp);
  const isM = ['photo', 'gallery'].includes(tp);
  const isV = tp === 'video';
  const isW = tp === 'wordwall';
  const isG = tp === 'game';
  const hfmt = document.querySelector('.hint-box-sm');

  if (isI && !hfmt) {
    document
      .querySelector('.type-grid')
      .insertAdjacentHTML(
        'afterend',
        `<div class="hint-box-sm"><div class="hb-title">💡 Формат</div><div class="hb-text" id="mHintFmt">${HINTS[tp] || ''}</div></div>`
      );
  } else if (!isI && hfmt) {
    hfmt.remove();
  } else if (isI && hfmt) {
    const hfEl = document.getElementById('mHintFmt');
    if (hfEl) hfEl.innerHTML = HINTS[tp] || '';
  }

  const fi = document.getElementById('mInput');
  const fiParent = fi?.closest('.fg');
  if (isI && !fi) {
    document
      .getElementById('mInstr')
      .closest('.fg')
      .insertAdjacentHTML(
        'afterend',
        '<div class="fg"><label>Завдання</label><textarea id="mInput" rows="3"></textarea></div>'
      );
    document.getElementById('mInput').value = inp;
  } else if (!isI && fiParent) {
    fiParent.remove();
  }

  const mfArea = document.getElementById('mImgFile');
  const mfParent = mfArea?.closest('.fg');
  if (isM && !mfArea) {
    const refEl = document.getElementById('mInput')?.closest('.fg') || document.getElementById('mInstr').closest('.fg');
    refEl.insertAdjacentHTML(
      'afterend',
      `<div class="fg"><label>${tp === 'gallery' ? 'Фото для галереї' : 'Фото'}</label><div class="img-upload-area" id="mImgPasteZone" data-paste-zone="images" tabindex="0">📁 Натисни, перетягни або <b>Ctrl+V</b><input type="file" id="mImgFile" accept="image/*" ${tp === 'gallery' ? 'multiple' : ''}></div><div class="img-preview-list" id="mImgPreviews"></div></div>`
    );
    renderImgPreviews();
  } else if (!isM && mfParent) {
    mfParent.remove();
  }

  const vf = document.getElementById('mVideoUrl');
  const vfParent = vf?.closest('.fg');
  if ((isV || isW || isG) && !vf) {
    const refEl = document.getElementById('mInstr').closest('.fg');
    const label = isG
      ? 'Посилання на гру (Baamboozle тощо)'
      : isW
        ? 'Посилання Wordwall (wordwall.net/resource/...)'
        : 'Посилання на відео (YouTube / Vimeo)';
    const ph = isG
      ? 'https://www.baamboozle.com/game/2188662'
      : isW
        ? 'https://wordwall.net/resource/114657840'
        : 'https://youtu.be/...';
    refEl.insertAdjacentHTML(
      'afterend',
      `<div class="fg"><label>${label}</label><input type="url" id="mVideoUrl" value="" placeholder="${ph}"></div>`
    );
  } else if (!isV && !isW && !isG && vfParent) {
    vfParent.remove();
  }
}

export function gatherTask() {
  const captionEls = document.querySelectorAll('#mImgPreviews .img-caption');
  const captions = [...captionEls].map((el) => el.value.trim());
  return {
    type: state.tType,
    input: (document.getElementById('mInput')?.value || '').trim(),
    instruction: (document.getElementById('mInstr')?.value || '').trim(),
    hint: (document.getElementById('mHint')?.value || '').trim(),
    hintImg: state.pendingHintImg || '',
    videoUrl: (document.getElementById('mVideoUrl')?.value || '').trim(),
    images: [...state.pendingImages],
    captions,
  };
}

export function editTask(fid, lid, tid) {
  const lesson = (D.lessons[fid] || []).find((x) => x.id === lid);
  const task = (lesson?.tasks || []).find((x) => x.id === tid);
  if (!task) return;
  state.setPendingImages(task.images ? [...task.images] : []);
  state.setPendingCaptions(task.captions ? [...task.captions] : []);
  state.setPendingHintImg(task.hintImg || null);
  openMO(buildTM(fid, lid, task));
  setTimeout(renderImgPreviews, 50);
}

async function nav() {
  return import('./navigation.js');
}

export async function createFolder() {
  const name = document.getElementById('mFname').value.trim();
  if (!name) return;
  const id = uid();
  D.folders.push({ id, name });
  if (!D.lessons[id]) D.lessons[id] = [];
  save();
  closeMO();
  const n = await nav();
  n.renderSB();
  n.showHome();
}

export async function createLesson(fid) {
  const name = document.getElementById('mLname').value.trim();
  if (!name) return;
  const id = uid();
  if (!D.lessons[fid]) D.lessons[fid] = [];
  D.lessons[fid].push({ id, name, tasks: [] });
  save();
  closeMO();
  const n = await nav();
  state.setCFid(fid);
  n.renderSB();
  n.openLesson(fid, id);
}

function flashEl(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.transition = 'border-color .1s';
  el.style.borderColor = 'var(--red)';
  setTimeout(() => { el.style.borderColor = ''; }, 600);
}

export async function saveNewTask(fid, lid) {
  const g = gatherTask();
  if (['choose', 'fillin', 'fillinbox', 'order', 'match'].includes(g.type) && !g.input) { flashEl('mInput'); return; }
  if (g.type === 'text' && !g.input) { flashEl('mInput'); return; }
  if (['photo', 'gallery'].includes(g.type) && !g.images.length) { flashEl('mImgFile'); return; }
  if (g.type === 'video' && !g.videoUrl) { flashEl('mVideoUrl'); return; }
  if (g.type === 'wordwall' && !g.videoUrl) { flashEl('mVideoUrl'); return; }
  if (g.type === 'game' && !g.videoUrl) { flashEl('mVideoUrl'); return; }
  const lesson = (D.lessons[fid] || []).find((x) => x.id === lid);
  if (!lesson) return;
  if (!lesson.tasks) lesson.tasks = [];
  lesson.tasks.push({ id: uid(), ...g });
  save();
  closeMO();
  const n = await nav();
  n.openLesson(fid, lid);
}

export async function saveEditTask(fid, lid, tid) {
  const g = gatherTask();
  const lesson = (D.lessons[fid] || []).find((x) => x.id === lid);
  const task = (lesson?.tasks || []).find((x) => x.id === tid);
  if (!task) return;
  Object.assign(task, g);
  save();
  closeMO();
  const n = await nav();
  n.openLesson(fid, lid);
}
