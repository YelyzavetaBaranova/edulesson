import { D } from '../store.js';
import { INTERACTIVE_TYPES } from '../constants.js';
import { matchClearSel } from './interactions.js';

export function checkOne(tid, type) {
  const card = document.getElementById(`tc-${tid}`);
  const fb = document.getElementById(`fb-${tid}`);
  const input = card.dataset.taskInput || '';
  let correct = false;

  if (type === 'choose') {
    const groups = card.querySelectorAll('.cs-btn[data-chosen]');
    let all = true;
    groups.forEach((g) => {
      if (!g.dataset.chosen) {
        all = false;
        return;
      }
      const isC = g.dataset.correct === 'true';
      g.classList.remove('ok', 'bad');
      g.classList.add(isC ? 'ok' : 'bad');
      if (!isC) all = false;
    });
    correct = all && groups.length > 0;
  } else if (type === 'fillin') {
    const inputs = card.querySelectorAll('.fi-inp');
    let all = true;
    inputs.forEach((inp) => {
      const ans = inp.dataset.answer.trim().toLowerCase();
      const val = inp.value.trim().toLowerCase();
      inp.classList.remove('ok', 'bad');
      if (val === ans) inp.classList.add('ok');
      else {
        inp.classList.add('bad');
        all = false;
      }
    });
    correct = all && inputs.length > 0;
  } else if (type === 'fillinbox') {
    const inputs = card.querySelectorAll(`[id^="fbi-${tid}-"]`);
    let all = true;
    inputs.forEach((inp) => {
      const ans = inp.dataset.answer.trim().toLowerCase();
      const val = (inp.dataset.word || '').trim().toLowerCase();
      inp.classList.remove('ok', 'bad');
      if (val === ans) inp.classList.add('ok');
      else {
        inp.classList.add('bad');
        all = false;
      }
    });
    correct = all && inputs.length > 0;
  } else if (type === 'order') {
    const zones = card.querySelectorAll('.word-zone');
    let allCorrect = true;
    zones.forEach((zone) => {
      const chips = [...zone.querySelectorAll('.wchip')];
      const ansWords = zone.dataset.answer.split(' ');
      const zoneOk = chips.map((c) => c.dataset.word).join(' ') === zone.dataset.answer && chips.length > 0;
      if (!zoneOk) allCorrect = false;
      chips.forEach((ch, ci) => {
        ch.classList.remove('w-ok', 'w-bad');
        if (ci < ansWords.length && ch.dataset.word === ansWords[ci]) ch.classList.add('w-ok');
        else ch.classList.add('w-bad');
      });
      zone.classList.remove('ok', 'bad');
      zone.classList.add(zoneOk ? 'ok' : 'bad');
    });
    correct = allCorrect && zones.length > 0;
  } else if (type === 'match') {
    const container = card.querySelector('[id^="match-"]');
    if (container) {
      const pairs = JSON.parse(container.dataset.pairs || '[]');
      const total = pairs.length;
      const matched = card.querySelectorAll('.match-item.matched').length / 2;
      correct = matched === total && total > 0;
    }
  }

  card.classList.remove('c-ok', 'c-bad');
  card.classList.add(correct ? 'c-ok' : 'c-bad');
  if (fb) {
    fb.className = `task-fb show ${correct ? 'fb-ok' : 'fb-bad'}`;
    fb.innerHTML = correct ? '✅ Правильно!' : '❌ Неправильно';
  }
  const saBtn = document.getElementById(`sa-${tid}`);
  if (saBtn) saBtn.style.display = correct ? 'none' : 'inline-flex';
  return correct;
}

export function showAnswer(tid, type) {
  const card = document.getElementById(`tc-${tid}`);
  if (type === 'choose') {
    card.querySelectorAll('.cs-btn[data-chosen]').forEach((btn) => {
      const pop = document.getElementById(`pop-${btn.id}`);
      if (pop) {
        const correctOpt = pop.querySelector('[data-correct="true"]');
        if (correctOpt) {
          btn.textContent = correctOpt.dataset.val;
          btn.dataset.chosen = correctOpt.dataset.val;
          btn.dataset.correct = 'true';
          btn.classList.remove('bad');
          btn.classList.add('ok');
        }
      }
    });
  } else if (type === 'fillin') {
    card.querySelectorAll('.fi-inp').forEach((inp) => {
      inp.value = inp.dataset.answer;
      inp.classList.remove('bad');
      inp.classList.add('ok');
    });
  } else if (type === 'fillinbox') {
    card.querySelectorAll('.fb-drop').forEach((span) => {
      const ans = span.dataset.answer;
      if (span.dataset.word) {
        const container = span.closest('.fillinbox-container');
        const wbox = container?.querySelector('[id^="wbox-"]');
        if (wbox) {
          const oldChip = wbox.querySelector(`[data-word="${CSS.escape(span.dataset.word)}"]`);
          if (oldChip) oldChip.classList.remove('used');
        }
      }
      span.textContent = ans;
      span.dataset.word = ans;
      span.classList.add('filled');
      span.classList.remove('bad');
      span.classList.add('ok');
      const container = span.closest('.fillinbox-container');
      const wbox = container?.querySelector('[id^="wbox-"]');
      if (wbox) {
        const chip = wbox.querySelector(`[data-word="${CSS.escape(ans)}"]`);
        if (chip) chip.classList.add('used');
      }
    });
  } else if (type === 'order') {
    card.querySelectorAll('.word-zone').forEach((zone) => {
      const ans = zone.dataset.answer;
      const words = ans.split(' ');
      const container = zone.parentElement;
      const bank = container.querySelector('.word-bank') || card.querySelector('.word-bank');
      zone.innerHTML = '';
      words.forEach((w) => {
        const chip = document.createElement('div');
        chip.className = 'wchip w-ok';
        chip.dataset.word = w;
        chip.draggable = true;
        chip.textContent = w;
        zone.appendChild(chip);
      });
      if (bank) {
        bank.querySelectorAll('.wchip').forEach((c) => {
          if (words.includes(c.dataset.word)) c.style.display = 'none';
        });
      }
      zone.classList.remove('bad');
      zone.classList.add('ok');
    });
  }
  const fb = document.getElementById(`fb-${tid}`);
  if (fb) {
    fb.className = 'task-fb show fb-ok';
    fb.innerHTML = '✅ Правильна відповідь показана';
  }
  const saBtn = document.getElementById(`sa-${tid}`);
  if (saBtn) saBtn.style.display = 'none';
  card.classList.remove('c-bad');
  card.classList.add('c-ok');
}

export function resetTask(tid, type) {
  const card = document.getElementById(`tc-${tid}`);
  card.classList.remove('c-ok', 'c-bad');
  const fb = document.getElementById(`fb-${tid}`);
  if (fb) {
    fb.className = 'task-fb';
    fb.innerHTML = '';
  }
  const saBtn = document.getElementById(`sa-${tid}`);
  if (saBtn) saBtn.style.display = 'none';

  if (type === 'choose') {
    card.querySelectorAll('.cs-btn').forEach((btn) => {
      btn.textContent = '— вибери —';
      btn.dataset.chosen = '';
      btn.dataset.correct = '';
      btn.classList.remove('ok', 'bad');
    });
    card.querySelectorAll('.cs-opt').forEach((o) => o.classList.remove('chosen'));
  } else if (type === 'fillin') {
    card.querySelectorAll('.fi-inp').forEach((inp) => {
      inp.value = '';
      inp.classList.remove('ok', 'bad');
    });
  } else if (type === 'fillinbox') {
    card.querySelectorAll('.fb-drop').forEach((span) => {
      span.textContent = '___';
      span.dataset.word = '';
      span.classList.remove('filled', 'ok', 'bad');
      span.style.outline = '';
    });
    card.querySelectorAll('.wb-chip').forEach((chip) => chip.classList.remove('used'));
  } else if (type === 'order') {
    card.querySelectorAll('.word-zone').forEach((zone) => {
      const sid = zone.id.replace('zone-', '');
      const bank = document.getElementById(`bank-${sid}`) || card.querySelector('.word-bank');
      zone.querySelectorAll('.wchip').forEach((ch) => {
        ch.classList.remove('w-ok', 'w-bad', 'in-zone');
        ch.style.display = '';
        if (bank) bank.appendChild(ch);
      });
      zone.classList.remove('ok', 'bad');
    });
  } else if (type === 'match') {
    card.querySelectorAll('.match-item').forEach((el) => {
      el.classList.remove('matched', 'selected', 'match-wrong');
      el.dataset.matched = '';
    });
    matchClearSel();
  }
}

export function checkAll(fid, lid) {
  const lesson = (D.lessons[fid] || []).find((x) => x.id === lid);
  if (!lesson) return;
  const tasks = lesson.tasks || [];
  let total = 0;
  let correct = 0;
  tasks.forEach((t) => {
    if (INTERACTIVE_TYPES.includes(t.type)) {
      total++;
      if (checkOne(t.id, t.type)) correct++;
    }
  });
  const sd = document.getElementById('scoreDisp');
  if (sd) sd.innerHTML = `Результат: <b>${correct}/${total}</b> правильно`;
  const ssd = document.getElementById('sectionsScoreDisplay');
  if (ssd) ssd.innerHTML = `<b>${correct}/${total}</b> correct`;
}

export async function resetAll(fid, lid) {
  const nav = await import('../navigation.js');
  nav.openLesson(fid, lid);
}
