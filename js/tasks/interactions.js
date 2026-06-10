let fbDragWord = null;
let fbDragSource = null;

let matchSelSide = null;
let matchSelIdx = null;
let matchSelTid = null;

export function togglePop(e, gid) {
  e.stopPropagation();
  const pop = document.getElementById(`pop-${gid}`);
  document.querySelectorAll('.cs-popup').forEach((p) => {
    if (p.id !== `pop-${gid}`) p.style.display = 'none';
  });
  pop.style.display = pop.style.display === 'none' || !pop.style.display ? 'block' : 'none';
}

export function pickOpt(el, gid) {
  const btn = document.getElementById(gid);
  btn.dataset.chosen = el.dataset.val;
  btn.dataset.correct = el.dataset.correct;
  btn.textContent = el.dataset.val;
  el.parentElement.querySelectorAll('.cs-opt').forEach((o) => o.classList.remove('chosen'));
  el.classList.add('chosen');
  document.getElementById(`pop-${gid}`).style.display = 'none';
  btn.classList.remove('ok', 'bad');
}

export function initDrag() {
  let dragEl = null;
  document.querySelectorAll('.wchip').forEach((ch) => {
    ch.addEventListener('dragstart', (e) => {
      dragEl = ch;
      ch.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    ch.addEventListener('dragend', () => {
      dragEl = null;
      ch.classList.remove('dragging');
    });
  });
  document.querySelectorAll('.word-zone,.word-bank').forEach((zone) => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (dragEl) zone.appendChild(dragEl);
      if (dragEl) dragEl.classList.toggle('in-zone', zone.classList.contains('word-zone'));
    });
  });
}

export function initFillInBoxDrag() {
  document.querySelectorAll('.wb-chip').forEach((chip) => {
    chip.setAttribute('draggable', 'true');
    chip.addEventListener('dragstart', (e) => {
      if (chip.classList.contains('used')) {
        e.preventDefault();
        return;
      }
      fbDragWord = chip.dataset.word;
      fbDragSource = 'bank';
      chip.style.opacity = '0.4';
      e.dataTransfer.effectAllowed = 'move';
    });
    chip.addEventListener('dragend', () => {
      chip.style.opacity = '';
    });
  });

  document.addEventListener('dragstart', (e) => {
    const el = e.target;
    if (el.classList.contains('fb-drop') && el.dataset.word) {
      fbDragWord = el.dataset.word;
      fbDragSource = el.id;
      el.style.opacity = '0.4';
      e.dataTransfer.effectAllowed = 'move';
    }
  });
  document.addEventListener('dragend', (e) => {
    const el = e.target;
    if (el.classList.contains('fb-drop')) el.style.opacity = '';
  });

  document.addEventListener('dragover', (e) => {
    if (e.target.classList.contains('fb-drop')) {
      e.preventDefault();
      e.target.style.outline = '2px solid var(--accent)';
    }
  });
  document.addEventListener('dragleave', (e) => {
    if (e.target.classList.contains('fb-drop')) e.target.style.outline = '';
  });
  document.addEventListener('drop', (e) => {
    const target = e.target;
    if (!target.classList.contains('fb-drop')) return;
    e.preventDefault();
    target.style.outline = '';
    if (!fbDragWord) return;

    const container = target.closest('.fillinbox-container');
    const wbox = container?.querySelector('[id^="wbox-"]');
    if (!wbox) return;
    const tid = wbox.id.replace('wbox-', '');

    if (target.dataset.word) {
      const oldWord = target.dataset.word;
      const box = document.getElementById(`wbox-${tid}`);
      if (box) {
        const oldChip = box.querySelector(`[data-word="${CSS.escape(oldWord)}"]`);
        if (oldChip) oldChip.classList.remove('used');
      }
    }

    if (fbDragSource && fbDragSource !== 'bank') {
      const srcEl = document.getElementById(fbDragSource);
      if (srcEl && srcEl !== target) {
        srcEl.textContent = '___';
        srcEl.dataset.word = '';
        srcEl.classList.remove('filled', 'ok', 'bad');
      }
    }

    target.textContent = fbDragWord;
    target.dataset.word = fbDragWord;
    target.classList.add('filled');
    target.classList.remove('ok', 'bad');

    if (fbDragSource === 'bank') {
      const box = document.getElementById(`wbox-${tid}`);
      if (box) {
        const chip = box.querySelector(`[data-word="${CSS.escape(fbDragWord)}"]`);
        if (chip) chip.classList.add('used');
      }
    }

    fbDragWord = null;
    fbDragSource = null;
  });

  document.querySelectorAll('[id^="wbox-"]').forEach((wbox) => {
    wbox.addEventListener('dragover', (e) => {
      e.preventDefault();
      wbox.style.borderColor = 'var(--accent)';
    });
    wbox.addEventListener('dragleave', () => {
      wbox.style.borderColor = '';
    });
    wbox.addEventListener('drop', (e) => {
      e.preventDefault();
      wbox.style.borderColor = '';
      if (!fbDragWord || fbDragSource === 'bank') {
        fbDragWord = null;
        fbDragSource = null;
        return;
      }
      if (fbDragSource && fbDragSource !== 'bank') {
        const srcEl = document.getElementById(fbDragSource);
        if (srcEl) {
          srcEl.textContent = '___';
          srcEl.dataset.word = '';
          srcEl.classList.remove('filled', 'ok', 'bad');
        }
      }
      const chip = wbox.querySelector(`[data-word="${CSS.escape(fbDragWord)}"]`);
      if (chip) chip.classList.remove('used');
      fbDragWord = null;
      fbDragSource = null;
    });
  });
}

export function matchClick(tid, side, idx) {
  const el = document.getElementById(`${side === 'left' ? 'ml' : 'mr'}-${tid}-${idx}`);
  if (!el || el.dataset.matched === 'true') return;

  if (matchSelTid && matchSelTid !== tid) matchClearSel();

  if (matchSelSide === null) {
    matchSelSide = side;
    matchSelIdx = idx;
    matchSelTid = tid;
    el.classList.add('selected');
  } else if (matchSelSide === side) {
    const old = document.getElementById(`${side === 'left' ? 'ml' : 'mr'}-${tid}-${matchSelIdx}`);
    if (old) old.classList.remove('selected');
    matchSelSide = side;
    matchSelIdx = idx;
    matchSelTid = tid;
    el.classList.add('selected');
  } else {
    const leftEl =
      side === 'left'
        ? document.getElementById(`ml-${tid}-${idx}`)
        : document.getElementById(`ml-${tid}-${matchSelIdx}`);
    const rEl =
      side === 'right'
        ? el
        : document.getElementById(`mr-${tid}-${matchSelIdx}`);
    const rOrigIdx = parseInt(rEl.dataset.orig);
    const lIdx = parseInt(leftEl.dataset.idx);
    if (rOrigIdx === lIdx) {
      leftEl.classList.remove('selected');
      rEl.classList.remove('selected');
      leftEl.classList.add('matched');
      rEl.classList.add('matched');
      leftEl.dataset.matched = 'true';
      rEl.dataset.matched = 'true';
    } else {
      leftEl.classList.add('match-wrong');
      rEl.classList.add('match-wrong');
      setTimeout(() => {
        leftEl.classList.remove('match-wrong', 'selected');
        rEl.classList.remove('match-wrong', 'selected');
      }, 600);
    }
    matchClearSel();
  }
}

export function matchClearSel() {
  if (matchSelTid && matchSelSide && matchSelIdx !== null) {
    const el = document.getElementById(`${matchSelSide === 'left' ? 'ml' : 'mr'}-${matchSelTid}-${matchSelIdx}`);
    if (el) el.classList.remove('selected');
  }
  matchSelSide = null;
  matchSelIdx = null;
  matchSelTid = null;
}

export function toggleHint(tid) {
  document.getElementById(`ht-${tid}`).classList.toggle('open');
  document.getElementById(`hb-${tid}`).classList.toggle('open');
}

export function toggleTaskMenu(tid, e) {
  e.stopPropagation();
  const pop = document.getElementById(`tmenu-${tid}`);
  const isShown = pop.classList.contains('show');
  closeTaskMenus();
  if (!isShown) pop.classList.add('show');
}

export function closeTaskMenus() {
  document.querySelectorAll('.task-menu-pop').forEach((p) => p.classList.remove('show'));
}

export function closeChoosePops() {
  document.querySelectorAll('.cs-popup').forEach((p) => {
    p.style.display = 'none';
  });
}
