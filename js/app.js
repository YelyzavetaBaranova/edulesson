const uid = () => Math.random().toString(36).slice(2, 10);
const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// ─── Store ───
const STORAGE_KEY = 'edu7';
let D = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
if (!D.folders) D.folders = [];
if (!D.lessons) D.lessons = {};
if (!D.vocab) D.vocab = [];
if (!D.homework) D.homework = [];
if (!D.tests) D.tests = [];
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(D)); }
  catch(e) { alert('Storage full! Remove some images.'); }
}

// ─── Router ───
let route = { view: 'home', fid: null, lid: null, tab: 'tasks', testId: null };
function go(view, params = {}) {
  route = { view, ...params };
  render();
}

// ─── Render ───
function render() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="app-layout">
      ${renderSidebar()}
      <div class="main">
        ${renderTopbar()}
        <div class="content">
          ${renderView()}
        </div>
      </div>
    </div>
  `;
  bindEvents();
}

function renderSidebar() {
  let foldersHtml = D.folders.map(f => {
    const lessons = D.lessons[f.id] || [];
    const isOpen = route.fid === f.id && route.view !== 'home';
    const isActive = (fid) => route.fid === fid && route.lid === fid + '_' + fid;
    return `
      <div class="nav-item ${route.fid === f.id && route.view !== 'home' ? 'active' : ''}"
           data-nav="folder" data-fid="${f.id}">
        <span class="nav-item-icon">📁</span>
        <span class="nav-item-text">${esc(f.name)}</span>
        <span class="nav-item-badge">${lessons.length}</span>
      </div>
      ${isOpen ? lessons.map(l => `
        <div class="nav-sub">
          <div class="nav-item ${route.lid === l.id ? 'active' : ''}"
               data-nav="lesson" data-fid="${f.id}" data-lid="${l.id}">
            <span class="nav-item-icon">📝</span>
            <span class="nav-item-text">${esc(l.name)}</span>
            <span class="nav-item-badge">${(l.tasks||[]).length}</span>
          </div>
        </div>
      `).join('') : ''}
    `;
  }).join('');

  return `
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icon">📚</div>
          <div class="sidebar-logo-text">EduLesson</div>
        </div>
      </div>
      <div class="sidebar-nav">
        <div class="nav-item ${route.view === 'home' ? 'active' : ''}" data-nav="home">
          <span class="nav-item-icon">🏠</span>
          <span class="nav-item-text">Головна</span>
        </div>
        <div class="nav-item ${route.view === 'homework' ? 'active' : ''}" data-nav="homework">
          <span class="nav-item-icon">📋</span>
          <span class="nav-item-text">Домашні завдання</span>
          <span class="nav-item-badge">${D.homework.length}</span>
        </div>
        <div class="nav-item ${route.view === 'tests' ? 'active' : ''}" data-nav="tests">
          <span class="nav-item-icon">✅</span>
          <span class="nav-item-text">Тести</span>
          <span class="nav-item-badge">${D.tests.length}</span>
        </div>
        <div class="nav-item ${route.view === 'vocab' ? 'active' : ''}" data-nav="vocab">
          <span class="nav-item-icon">📖</span>
          <span class="nav-item-text">Словник</span>
        </div>
        <div class="nav-section-title">Папки</div>
        ${foldersHtml}
      </div>
      <div class="sidebar-footer">
        <button class="btn btn-primary" style="width:100%" data-action="new-folder">＋ Папка</button>
      </div>
    </div>
  `;
}

function renderTopbar() {
  let title = 'EduLesson';
  let actions = '';

  if (route.view === 'home') {
    title = 'Головна';
  } else if (route.view === 'folder') {
    const f = D.folders.find(x => x.id === route.fid);
    title = f ? f.name : 'Папка';
    actions = `<button class="btn btn-secondary btn-sm" data-action="new-lesson">＋ Урок</button>`;
  } else if (route.view === 'lesson') {
    const f = D.folders.find(x => x.id === route.fid);
    const l = (D.lessons[route.fid]||[]).find(x => x.id === route.lid);
    title = l ? l.name : 'Урок';
    actions = `
      <button class="btn btn-secondary btn-sm" data-action="new-task">＋ Завдання</button>
      <button class="btn btn-primary btn-sm" data-action="start-test">▶ Тест</button>
    `;
  } else if (route.view === 'homework') {
    title = 'Домашні завдання';
    actions = `<button class="btn btn-primary btn-sm" data-action="new-homework">＋ Завдання</button>`;
  } else if (route.view === 'tests') {
    title = 'Тести';
  } else if (route.view === 'vocab') {
    title = 'Словник';
  } else if (route.view === 'take-test') {
    title = 'Проходження тесту';
  } else if (route.view === 'test-result') {
    title = 'Результат тесту';
  } else if (route.view === 'edit-homework') {
    title = 'Редагування завдання';
  }

  return `
    <div class="topbar">
      <div class="topbar-title">${title}</div>
      <div class="topbar-actions">${actions}</div>
    </div>
  `;
}

function renderView() {
  switch (route.view) {
    case 'home': return renderHome();
    case 'folder': return renderFolder();
    case 'lesson': return renderLesson();
    case 'homework': return renderHomeworkList();
    case 'tests': return renderTestsList();
    case 'vocab': return renderVocab();
    case 'take-test': return renderTakeTest();
    case 'test-result': return renderTestResult();
    case 'edit-homework': return renderEditHomework();
    default: return renderHome();
  }
}

// ─── Home ───
function renderHome() {
  const totalLessons = D.folders.reduce((s,f) => s + (D.lessons[f.id]||[]).length, 0);
  const totalTasks = D.folders.reduce((s,f) =>
    s + (D.lessons[f.id]||[]).reduce((s2,l) => s2 + (l.tasks||[]).length, 0), 0);

  return `
    <div class="hero">
      <div class="hero-badge">📚 Конструктор уроків</div>
      <div class="hero-title">Вітаю!</div>
      <div class="hero-sub">Створюйте інтерактивні уроки англійської мови з домашніми завданнями та тестами.</div>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">${D.folders.length}</div>
        <div class="stat-label">Папок</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${totalLessons}</div>
        <div class="stat-label">Уроків</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${totalTasks}</div>
        <div class="stat-label">Завдань</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${D.vocab.length}</div>
        <div class="stat-label">Слів</div>
      </div>
    </div>
    <div style="margin-top:8px">
      <div class="card-grid">
        <div class="card" style="cursor:pointer" data-nav="homework">
          <div style="font-size:28px;margin-bottom:8px">📋</div>
          <div class="card-title">Домашні завдання</div>
          <div class="card-meta">Створюйте та призначайте завдання</div>
        </div>
        <div class="card" style="cursor:pointer" data-nav="tests">
          <div style="font-size:28px;margin-bottom:8px">✅</div>
          <div class="card-title">Тести</div>
          <div class="card-meta">Створюйте тести з перевіркою</div>
        </div>
        <div class="card" style="cursor:pointer" data-nav="vocab">
          <div style="font-size:28px;margin-bottom:8px">📖</div>
          <div class="card-title">Словник</div>
          <div class="card-meta">Зберігайте нові слова</div>
        </div>
      </div>
    </div>
  `;
}

// ─── Folder ───
function renderFolder() {
  const f = D.folders.find(x => x.id === route.fid);
  if (!f) return '<div class="empty-state"><div class="empty-icon">📁</div><div class="empty-title">Папку не знайдено</div></div>';
  const lessons = D.lessons[f.id] || [];

  if (!lessons.length) {
    return `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-title">Порожньо</div>
        <div class="empty-text">Створіть перший урок</div>
      </div>
    `;
  }

  return `
    <div class="card-grid">
      ${lessons.map((l,i) => `
        <div class="card" style="cursor:pointer" data-action="open-lesson" data-fid="${f.id}" data-lid="${l.id}">
          <div class="card-title">📝 ${esc(l.name)}</div>
          <div class="card-meta" style="margin-top:6px">
            <span class="card-tag tag-blue">${(l.tasks||[]).length} завдань</span>
          </div>
          <div style="display:flex;gap:6px;margin-top:12px">
            <button class="btn btn-danger btn-sm" data-action="del-lesson" data-fid="${f.id}" data-lid="${l.id}">🗑</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ─── Lesson ───
function renderLesson() {
  const f = D.folders.find(x => x.id === route.fid);
  const l = (D.lessons[route.fid]||[]).find(x => x.id === route.lid);
  if (!l) return '<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-title">Урок не знайдено</div></div>';
  const tasks = l.tasks || [];

  return `
    <div style="display:flex;gap:12px;margin-bottom:20px;align-items:center">
      <span style="font-size:14px;color:var(--gray-400)">${esc(f?.name)} /</span>
      <span style="font-size:14px;font-weight:700;color:var(--gray-700)">${esc(l.name)}</span>
      <span class="card-tag tag-blue" style="margin-left:auto">${tasks.length} завдань</span>
    </div>

    ${tasks.length ? `
      <div class="task-list">
        ${tasks.map((t, i) => renderTaskCard(t, i, l)).join('')}
      </div>
    ` : `
      <div class="empty-state">
        <div class="empty-icon">✨</div>
        <div class="empty-title">Додайте завдання</div>
        <div class="empty-text">Натисніть кнопку "＋ Завдання" щоб почати</div>
      </div>
    `}

    <div class="add-task-area" data-action="new-task">＋ Додати завдання</div>
  `;
}

function renderTaskCard(t, index, lesson) {
  const typeLabels = {
    choose: ['💬', 'Заповнити пропуск', 'tag-blue'],
    fillin: ['✏️', 'Написати слово', 'tag-green'],
    fillinbox: ['🧩', 'Перетягти слово', 'tag-purple'],
    order: ['🔢', 'Впорядкувати', 'tag-amber'],
    match: ['🔗', 'Відповідності', 'tag-red'],
    text: ['📄', 'Текст', ''],
    photo: ['📷', 'Зображення', ''],
    video: ['🎬', 'Відео', ''],
    wordwall: ['🎰', 'Wordwall', ''],
    game: ['🎮', 'Гра', ''],
  };
  const [icon, label, tagClass] = typeLabels[t.type] || ['❓', t.type, ''];

  return `
    <div class="task-card" data-type="${t.type}">
      <div class="task-num">${index + 1}</div>
      <span class="task-type-badge ${tagClass ? 'card-tag ' + tagClass : ''}">${icon} ${label}</span>
      <div class="task-instruction">${esc(t.instruction || '')}</div>
      ${renderTaskBody(t)}
      ${t.hint ? `
        <button class="hint-toggle" data-action="toggle-hint" data-tid="${t.id}">💡 Підказка</button>
        <div class="hint-body" id="hint-${t.id}">${esc(t.hint)}</div>
      ` : ''}
      <div class="task-actions">
        <button class="btn btn-ghost btn-sm" data-action="edit-task" data-fid="${lesson ? lesson.id : ''}" data-lid="${getLessonId()}" data-tid="${t.id}">✏️</button>
        <button class="btn btn-danger btn-sm" data-action="del-task" data-fid="${lesson ? lesson.id : ''}" data-lid="${getLessonId()}" data-tid="${t.id}">🗑</button>
      </div>
    </div>
  `;
}

function getLessonId() { return route.lid; }

function renderTaskBody(t) {
  switch (t.type) {
    case 'choose': {
      const parts = (t.input || '').split(/\n/);
      return `<div class="choose-sentence">${parts.map(p => esc(p)).join('<br>')}</div>`;
    }
    case 'fillin': {
      return `<div class="text-block">${esc(t.input || '')}</div>`;
    }
    case 'fillinbox': {
      return `<div class="text-block">${esc(t.input || '')}</div>`;
    }
    case 'order': {
      const items = (t.input || '').split('\n').filter(Boolean);
      return `<div class="order-list">${items.map((item, i) => `
        <div class="order-item"><span class="order-num">${i+1}</span>${esc(item)}</div>
      `).join('')}</div>`;
    }
    case 'match': {
      const pairs = (t.input || '').split('\n').filter(Boolean);
      const lefts = pairs.map(p => p.split('|')[0]?.trim()).filter(Boolean);
      const rights = pairs.map(p => p.split('|')[1]?.trim()).filter(Boolean);
      return `
        <div class="match-grid">
          <div class="match-col">${lefts.map(l => `<div class="match-item">${esc(l)}</div>`).join('')}</div>
          <div class="match-col">${rights.map(r => `<div class="match-item">${esc(r)}</div>`).join('')}</div>
        </div>
      `;
    }
    case 'text': {
      return `<div class="text-block">${esc(t.input || '')}</div>`;
    }
    case 'photo': {
      if (t.images && t.images.length) {
        return t.images.map(img => `<img src="${img}" class="photo-display" alt="">`).join('');
      }
      return '<div style="color:var(--gray-300);font-size:13px;font-style:italic">Зображення не додано</div>';
    }
    case 'video': {
      const url = t.videoUrl || '';
      const embed = url.replace('watch?v=', 'embed/');
      if (embed) return `<div class="video-wrap"><iframe src="${esc(embed)}" allowfullscreen></iframe></div>`;
      return '';
    }
    case 'wordwall': {
      if (t.videoUrl) return `<div class="wordwall-wrap"><iframe src="${esc(t.videoUrl)}"></iframe></div>`;
      return '';
    }
    default:
      return '';
  }
}

// ─── Homework ───
function renderHomeworkList() {
  if (!D.homework.length) {
    return `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">Немає домашніх завдань</div>
        <div class="empty-text">Створіть завдання для учнів</div>
      </div>
    `;
  }
  return `
    <div class="task-list">
      ${D.homework.map((hw, i) => `
        <div class="task-card" data-type="text">
          <div class="task-num">${i+1}</div>
          <div class="hw-badge">📋 Домашнє завдання</div>
          <div class="task-instruction">${esc(hw.title)}</div>
          <div class="text-block">${esc(hw.description || '')}</div>
          ${hw.deadline ? `<div style="margin-top:8px;font-size:12px;color:var(--gray-400)">📅 Дедлайн: ${esc(hw.deadline)}</div>` : ''}
          <div class="task-actions">
            <button class="btn btn-ghost btn-sm" data-action="edit-homework" data-hwid="${hw.id}">✏️ Редагувати</button>
            <button class="btn btn-danger btn-sm" data-action="del-homework" data-hwid="${hw.id}">🗑 Видалити</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderEditHomework() {
  const hw = D.homework.find(x => x.id === route.hwid);
  if (!hw) return '<div class="empty-state"><div class="empty-title">Завдання не знайдено</div></div>';
  return `
    <div class="card">
      <div class="form-group">
        <label class="form-label">Назва</label>
        <input class="form-input" id="hw-title" value="${esc(hw.title)}">
      </div>
      <div class="form-group">
        <label class="form-label">Опис завдання</label>
        <textarea class="form-textarea" id="hw-desc" rows="6">${esc(hw.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Дедлайн</label>
        <input class="form-input" id="hw-deadline" type="date" value="${hw.deadline || ''}">
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-secondary" data-action="cancel-edit-hw">Скасувати</button>
        <button class="btn btn-primary" data-action="save-homework" data-hwid="${hw.id}">Зберегти</button>
      </div>
    </div>
  `;
}

// ─── Tests ───
function renderTestsList() {
  if (!D.tests.length) {
    return `
      <div class="empty-state">
        <div class="empty-icon">✅</div>
        <div class="empty-title">Немає тестів</div>
        <div class="empty-text">Створіть тест з завдань уроку</div>
      </div>
    `;
  }
  return `
    <div class="card-grid">
      ${D.tests.map((test, i) => `
        <div class="card">
          <div class="card-title">✅ ${esc(test.name)}</div>
          <div class="card-meta" style="margin-top:6px">
            <span class="card-tag tag-purple">${test.questions.length} питань</span>
            ${test.homeworkId ? '<span class="card-tag tag-amber">ДЗ</span>' : ''}
          </div>
          <div style="display:flex;gap:6px;margin-top:12px">
            <button class="btn btn-primary btn-sm" data-action="take-test" data-testid="${test.id}">▶ Пройти</button>
            <button class="btn btn-danger btn-sm" data-action="del-test" data-testid="${test.id}">🗑</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ─── Take Test ───
function renderTakeTest() {
  const test = D.tests.find(x => x.id === route.testId);
  if (!test) return '<div class="empty-state"><div class="empty-title">Тест не знайдено</div></div>';

  const q = test.questions[route.qIdx || 0];
  if (!q) return renderTestResult();

  const idx = route.qIdx || 0;
  const total = test.questions.length;
  const pct = Math.round((idx / total) * 100);

  return `
    <div class="test-header">
      <div>
        <div style="font-weight:700;color:var(--gray-800)">${esc(test.name)}</div>
        <div style="font-size:13px;color:var(--gray-400);margin-top:2px">Питання ${idx + 1} з ${total}</div>
      </div>
      <button class="btn btn-secondary btn-sm" data-action="cancel-test">Завершити</button>
    </div>
    <div class="test-progress">
      <div class="test-progress-bar" style="width:${pct}%"></div>
    </div>
    <div style="margin-top:24px">
      <div class="task-card" data-type="${q.type}">
        <div class="task-num">${idx + 1}</div>
        <div class="task-instruction">${esc(q.instruction)}</div>
        ${renderTestQuestion(q, idx)}
        <div class="task-actions">
          <button class="btn btn-primary" data-action="test-answer" data-testid="${test.id}" data-qidx="${idx}">
            ${idx < total - 1 ? 'Далі →' : 'Завершити'}
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderTestQuestion(q, idx) {
  switch (q.type) {
    case 'choose': {
      const options = q.options || [];
      return `<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
        ${options.map((opt, oi) => `
          <label class="checkbox-wrap">
            <input type="radio" name="tq-${idx}" value="${oi}" data-qa="${idx}">
            ${esc(opt)}
          </label>
        `).join('')}
      </div>`;
    }
    case 'fillin': {
      return `<div style="margin-top:12px">
        <input class="form-input" placeholder="Ваша відповідь..." data-qa="${idx}" style="max-width:400px">
      </div>`;
    }
    case 'match': {
      const pairs = (q.input || '').split('\n').filter(Boolean);
      const lefts = pairs.map(p => p.split('|')[0]?.trim()).filter(Boolean);
      const rights = pairs.map(p => p.split('|')[1]?.trim()).filter(Boolean);
      const shuffled = [...rights].sort(() => Math.random() - .5);
      return `
        <div class="match-grid" style="margin-top:12px">
          <div class="match-col">${lefts.map((l,li) => `
            <div class="match-item">${esc(l)}</div>
            <select class="form-input" data-qa="${idx}" data-ml="${li}" style="margin-top:4px">
              <option value="">Оберіть...</option>
              ${shuffled.map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('')}
            </select>
          `).join('')}</div>
        </div>
      `;
    }
    case 'order': {
      const items = (q.input || '').split('\n').filter(Boolean).sort(() => Math.random() - .5);
      return `<div style="margin-top:12px;font-size:14px;color:var(--gray-500)">Розташуйте в правильному порядку:</div>
        <div class="order-list" style="margin-top:8px">${items.map((item, i) => `
          <div class="order-item">
            <span class="order-num">${i+1}</span>
            <input type="number" min="1" max="${items.length}" class="form-input" data-qa="${idx}" data-oi="${i}" data-oval="${esc(item)}" style="width:50px;padding:4px 6px;text-align:center">
            <span>${esc(item)}</span>
          </div>
        `).join('')}</div>`;
    }
    default:
      return `<div class="text-block" style="margin-top:12px">${esc(q.input || '')}</div>`;
  }
}

// ─── Test Result ───
function renderTestResult() {
  const r = route.lastResult;
  if (!r) return '<div class="empty-state"><div class="empty-title">Немає результатів</div></div>';
  const pct = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
  const color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';
  const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚';

  return `
    <div class="score-card">
      <div class="score-circle" style="border-color:${color}">
        <div class="score-num" style="color:${color}">${pct}%</div>
        <div class="score-total">${r.correct}/${r.total}</div>
      </div>
      <div class="score-label">${emoji} ${pct >= 80 ? 'Чудово!' : pct >= 50 ? 'Непогано!' : 'Потрібно повторити'}</div>
      <div class="score-sub">Правильних відповідей: ${r.correct} з ${r.total}</div>
      <div style="margin-top:20px;display:flex;gap:8px;justify-content:center">
        <button class="btn btn-secondary" data-action="go-tests">До тестів</button>
        <button class="btn btn-primary" data-action="retake-test" data-testid="${r.testId}">Пройти ще раз</button>
      </div>
    </div>
  `;
}

// ─── Vocab ───
function renderVocab() {
  return `
    <div class="card" style="margin-bottom:20px">
      <div style="display:flex;gap:8px">
        <input class="form-input" id="vocab-word" placeholder="Слово (EN)" style="max-width:200px">
        <input class="form-input" id="vocab-tr" placeholder="Переклад" style="max-width:200px">
        <button class="btn btn-success" data-action="add-vocab">＋</button>
        <button class="btn btn-secondary" data-action="export-vocab">📥 Експорт</button>
      </div>
    </div>
    <div class="vocab-list">
      ${D.vocab.length ? D.vocab.map((v, i) => `
        <div class="vocab-item">
          <div>
            <span class="vocab-word">${esc(v.word)}</span>
            <span class="vocab-translation">${esc(v.tr)}</span>
          </div>
          <button class="vocab-delete" data-action="del-vocab" data-idx="${i}">×</button>
        </div>
      `).join('') : `
        <div class="empty-state">
          <div class="empty-icon">📖</div>
          <div class="empty-title">Словник порожній</div>
          <div class="empty-text">Додайте перше слово</div>
        </div>
      `}
    </div>
  `;
}

// ─── Actions ───
function bindEvents() {
  document.body.onclick = (e) => {
    const el = e.target.closest('[data-action]');
    const nav = e.target.closest('[data-nav]');
    if (nav) {
      e.preventDefault();
      const view = nav.dataset.nav;
      if (view === 'home') go('home');
      else if (view === 'homework') go('homework');
      else if (view === 'tests') go('tests');
      else if (view === 'vocab') go('vocab');
      else if (view === 'folder') go('folder', { fid: nav.dataset.fid });
      else if (view === 'lesson') go('lesson', { fid: nav.dataset.fid, lid: nav.dataset.lid });
      return;
    }
    if (!el) return;
    const a = el.dataset.action;

    if (a === 'new-folder') {
      showModal('Нова папка', `
        <div class="form-group">
          <label class="form-label">Назва папки</label>
          <input class="form-input" id="folder-name" placeholder="Наприклад: A1 Elementary">
        </div>
      `, () => {
        const name = document.getElementById('folder-name').value.trim();
        if (!name) return;
        const id = uid();
        D.folders.push({ id, name });
        D.lessons[id] = [];
        save();
        closeModal();
        go('folder', { fid: id });
      });
    }

    if (a === 'new-lesson') {
      showModal('Новий урок', `
        <div class="form-group">
          <label class="form-label">Назва уроку</label>
          <input class="form-input" id="lesson-name" placeholder="Наприклад: Lesson 1">
        </div>
      `, () => {
        const name = document.getElementById('lesson-name').value.trim();
        if (!name) return;
        const id = uid();
        if (!D.lessons[route.fid]) D.lessons[route.fid] = [];
        D.lessons[route.fid].push({ id, name, tasks: [] });
        save();
        closeModal();
        go('lesson', { fid: route.fid, lid: id });
      });
    }

    if (a === 'open-lesson') {
      go('lesson', { fid: el.dataset.fid, lid: el.dataset.lid });
    }

    if (a === 'del-lesson') {
      e.stopPropagation();
      if (!confirm('Видалити урок?')) return;
      const lessons = D.lessons[el.dataset.fid] || [];
      const idx = lessons.findIndex(l => l.id === el.dataset.lid);
      if (idx >= 0) lessons.splice(idx, 1);
      save();
      go('folder', { fid: el.dataset.fid });
    }

    if (a === 'new-task') {
      showTaskModal(route.fid, route.lid);
    }

    if (a === 'edit-task') {
      const l = (D.lessons[el.dataset.fid || route.fid]||[]).find(x => x.id === (el.dataset.lid || route.lid));
      const t = (l?.tasks||[]).find(x => x.id === el.dataset.tid);
      if (t) showTaskModal(el.dataset.fid || route.fid, el.dataset.lid || route.lid, t);
    }

    if (a === 'del-task') {
      if (!confirm('Видалити завдання?')) return;
      const l = (D.lessons[el.dataset.fid || route.fid]||[]).find(x => x.id === (el.dataset.lid || route.lid));
      if (l) {
        const idx = l.tasks.findIndex(t => t.id === el.dataset.tid);
        if (idx >= 0) l.tasks.splice(idx, 1);
        save();
        render();
      }
    }

    if (a === 'toggle-hint') {
      const hint = document.getElementById('hint-' + el.dataset.tid);
      if (hint) hint.classList.toggle('show');
    }

    if (a === 'new-homework') {
      showModal('Нове домашнє завдання', `
        <div class="form-group">
          <label class="form-label">Назва</label>
          <input class="form-input" id="hw-title" placeholder="Наприклад: Vocabulary Unit 3">
        </div>
        <div class="form-group">
          <label class="form-label">Опис завдання</label>
          <textarea class="form-textarea" id="hw-desc" rows="5" placeholder="Опишіть завдання..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Дедлайн</label>
          <input class="form-input" id="hw-deadline" type="date">
        </div>
      `, () => {
        const title = document.getElementById('hw-title').value.trim();
        if (!title) return;
        D.homework.push({
          id: uid(),
          title,
          description: document.getElementById('hw-desc').value,
          deadline: document.getElementById('hw-deadline').value,
          createdAt: new Date().toISOString()
        });
        save();
        closeModal();
        go('homework');
      });
    }

    if (a === 'edit-homework') {
      go('edit-homework', { hwid: el.dataset.hwid });
    }

    if (a === 'cancel-edit-hw') {
      go('homework');
    }

    if (a === 'save-homework') {
      const hw = D.homework.find(x => x.id === el.dataset.hwid);
      if (hw) {
        hw.title = document.getElementById('hw-title').value.trim();
        hw.description = document.getElementById('hw-desc').value;
        hw.deadline = document.getElementById('hw-deadline').value;
        save();
        go('homework');
      }
    }

    if (a === 'del-homework') {
      if (!confirm('Видалити завдання?')) return;
      const idx = D.homework.findIndex(x => x.id === el.dataset.hwid);
      if (idx >= 0) D.homework.splice(idx, 1);
      save();
      go('homework');
    }

    if (a === 'start-test') {
      const l = (D.lessons[route.fid]||[]).find(x => x.id === route.lid);
      if (!l || !(l.tasks||[]).length) { alert('Спочатку додайте завдання до уроку'); return; }
      const interactive = l.tasks.filter(t => ['choose','fillin','match','order'].includes(t.type));
      if (!interactive.length) { alert('Для тесту потрібні інтерактивні завдання (заповнити, вибрати, відповідності, порядок)'); return; }
      const test = {
        id: uid(),
        name: l.name + ' — Тест',
        questions: interactive.map(t => ({
          type: t.type,
          instruction: t.instruction || '',
          input: t.input || '',
          options: t.type === 'choose' ? parseChooseOptions(t.input) : undefined,
          correctAnswer: t.type === 'fillin' ? extractFillinAnswer(t.input) : undefined,
        })),
        fromLesson: route.lid,
      };
      D.tests.push(test);
      save();
      go('take-test', { testId: test.id, qIdx: 0, answers: [] });
    }

    if (a === 'take-test') {
      go('take-test', { testId: el.dataset.testid, qIdx: 0, answers: [] });
    }

    if (a === 'test-answer') {
      const test = D.tests.find(x => x.id === el.dataset.testid);
      if (!test) return;
      const idx = parseInt(el.dataset.qidx);
      const q = test.questions[idx];
      const answers = route.answers || [];
      let answer = null;

      if (q.type === 'choose') {
        const radio = document.querySelector(`input[name="tq-${idx}"]:checked`);
        answer = radio ? parseInt(radio.value) : -1;
      } else if (q.type === 'fillin') {
        const inp = document.querySelector(`input[data-qa="${idx}"]`);
        answer = inp ? inp.value.trim().toLowerCase() : '';
      } else if (q.type === 'match') {
        const selects = document.querySelectorAll(`select[data-qa="${idx}"]`);
        answer = Array.from(selects).map(s => s.value);
      } else if (q.type === 'order') {
        const inputs = document.querySelectorAll(`input[data-qa="${idx}"]`);
        answer = Array.from(inputs).map(i => ({ num: i.value, expected: i.dataset.oval }));
      }

      answers[idx] = { question: q, answer };
      const nextIdx = idx + 1;

      if (nextIdx >= test.questions.length) {
        const result = gradeTest(test, answers);
        route.lastResult = { ...result, testId: test.id };
        go('test-result', { lastResult: route.lastResult });
      } else {
        go('take-test', { testId: test.id, qIdx: nextIdx, answers });
      }
    }

    if (a === 'cancel-test') {
      go('tests');
    }

    if (a === 'retake-test') {
      go('take-test', { testId: el.dataset.testid, qIdx: 0, answers: [] });
    }

    if (a === 'go-tests') {
      go('tests');
    }

    if (a === 'del-test') {
      if (!confirm('Видалити тест?')) return;
      const idx = D.tests.findIndex(x => x.id === el.dataset.testid);
      if (idx >= 0) D.tests.splice(idx, 1);
      save();
      go('tests');
    }

    if (a === 'add-vocab') {
      const w = document.getElementById('vocab-word');
      const t = document.getElementById('vocab-tr');
      if (w && w.value.trim()) {
        const word = w.value.trim();
        const tr = t ? t.value.trim() : '';
        if (!D.vocab.find(v => v.word.toLowerCase() === word.toLowerCase())) {
          D.vocab.push({ word, tr });
          save();
          render();
        }
        if (w) { w.value = ''; t.value = ''; w.focus(); }
      }
    }

    if (a === 'del-vocab') {
      D.vocab.splice(parseInt(el.dataset.idx), 1);
      save();
      render();
    }

    if (a === 'export-vocab') {
      const data = JSON.stringify(D.vocab, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'vocab.json'; a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Enter key for vocab
  document.body.onkeydown = (e) => {
    if (e.key === 'Enter') {
      const target = e.target;
      if (target.id === 'vocab-word') {
        document.getElementById('vocab-tr')?.focus();
      } else if (target.id === 'vocab-tr') {
        document.body.querySelector('[data-action="add-vocab"]')?.click();
      }
    }
  };
}

// ─── Task Modal ───
function showTaskModal(fid, lid, existing) {
  const types = [
    { type: 'choose', icon: '💬', name: 'Заповнити пропуск' },
    { type: 'fillin', icon: '✏️', name: 'Написати слово' },
    { type: 'fillinbox', icon: '🧩', name: 'Перетягти слово' },
    { type: 'order', icon: '🔢', name: 'Впорядкувати' },
    { type: 'match', icon: '🔗', name: 'Відповідності' },
    { type: 'text', icon: '📄', name: 'Текст' },
    { type: 'photo', icon: '📷', name: 'Зображення' },
    { type: 'video', icon: '🎬', name: 'Відео' },
    { type: 'wordwall', icon: '🎰', name: 'Wordwall' },
  ];
  const selected = existing ? existing.type : 'text';

  const modal = document.getElementById('modal-root');
  modal.innerHTML = `
    <div class="modal-overlay show" id="modal-overlay">
      <div class="modal-box">
        <div class="modal-scroll">
          <div class="modal-title">${existing ? 'Редагувати завдання' : 'Нове завдання'}</div>
          <div class="modal-sub">Оберіть тип та заповніть дані</div>
          <div class="type-grid" id="type-grid">
            ${types.map(t => `
              <div class="type-option ${t.type === selected ? 'selected' : ''}" data-type="${t.type}">
                <div class="type-icon">${t.icon}</div>
                <div class="type-name">${t.name}</div>
              </div>
            `).join('')}
          </div>
          <div class="form-group">
            <label class="form-label">Інструкція / Заголовок</label>
            <input class="form-input" id="task-instruction" value="${esc(existing?.instruction || '')}" placeholder="Наприклад: Choose the correct word">
          </div>
          <div id="task-fields">
            ${renderTaskFields(selected, existing)}
          </div>
          <div class="form-group">
            <label class="form-label">Підказка (опціонально)</label>
            <input class="form-input" id="task-hint" value="${esc(existing?.hint || '')}" placeholder="Підказка для учня">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Скасувати</button>
          <button class="btn btn-primary" data-action="save-task" data-fid="${fid}" data-lid="${lid}" ${existing ? `data-tid="${existing.id}"` : ''}>
            ${existing ? 'Зберегти' : 'Додати'}
          </button>
        </div>
      </div>
    </div>
  `;

  // Type selection
  document.getElementById('type-grid').onclick = (e) => {
    const opt = e.target.closest('.type-option');
    if (!opt) return;
    document.querySelectorAll('.type-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    document.getElementById('task-fields').innerHTML = renderTaskFields(opt.dataset.type, existing);
  };

  // Save task
  document.body.querySelector('[data-action="save-task"]').onclick = () => {
    const type = document.querySelector('.type-option.selected')?.dataset.type || 'text';
    const instruction = document.getElementById('task-instruction').value.trim();
    const hint = document.getElementById('task-hint').value.trim();
    let input = '';
    let videoUrl = '';
    let images = [];

    if (type === 'video') {
      videoUrl = document.getElementById('task-video')?.value.trim() || '';
    } else if (type === 'wordwall') {
      videoUrl = document.getElementById('task-wordwall')?.value.trim() || '';
    } else if (type === 'photo') {
      // images handled separately
    } else {
      input = document.getElementById('task-content')?.value || '';
    }

    if (!instruction && type !== 'photo') { alert('Введіть інструкцію'); return; }

    const lesson = (D.lessons[fid]||[]).find(x => x.id === lid);
    if (!lesson) return;

    if (existing) {
      existing.type = type;
      existing.instruction = instruction;
      existing.hint = hint;
      existing.input = input;
      existing.videoUrl = videoUrl;
      existing.images = images;
    } else {
      lesson.tasks.push({
        id: uid(), type, instruction, hint, input, videoUrl, images: [], hintImg: ''
      });
    }

    save();
    closeModal();
    go('lesson', { fid, lid });
  };
}

function renderTaskFields(type, existing) {
  const val = existing?.input || '';
  switch (type) {
    case 'choose':
      return `
        <div class="form-group">
          <label class="form-label">Речення з пропусками (кожне з нового рядка)</label>
          <textarea class="form-textarea" id="task-content" rows="4" placeholder="My name ___ Anna.&#10;I ___ 10 years old.">${esc(val)}</textarea>
        </div>
      `;
    case 'fillin':
      return `
        <div class="form-group">
          <label class="form-label">Текст (слово для введення в квадратних дужках)</label>
          <textarea class="form-textarea" id="task-content" rows="3" placeholder="My name is [Anna].">[${esc(val)}]</textarea>
        </div>
      `;
    case 'fillinbox':
      return `
        <div class="form-group">
          <label class="form-label">Текст з пропусками (__ ) та словник через |</label>
          <textarea class="form-textarea" id="task-content" rows="4" placeholder="My name __ Anna. | cat | dog | Anna">${esc(val)}</textarea>
        </div>
      `;
    case 'order':
      return `
        <div class="form-group">
          <label class="form-label">Елементи (кожен з нового рядка, правильний порядок)</label>
          <textarea class="form-textarea" id="task-content" rows="4" placeholder="My&#10;name&#10;is&#10;Anna.">${esc(val)}</textarea>
        </div>
      `;
    case 'match':
      return `
        <div class="form-group">
          <label class="form-label">Пари (лів | прав, кожна пара з нового рядка)</label>
          <textarea class="form-textarea" id="task-content" rows="4" placeholder="кіт | cat&#10;собака | dog">${esc(val)}</textarea>
        </div>
      `;
    case 'text':
      return `
        <div class="form-group">
          <label class="form-label">Текст</label>
          <textarea class="form-textarea" id="task-content" rows="5" placeholder="Текст завдання...">${esc(val)}</textarea>
        </div>
      `;
    case 'photo':
      return `
        <div class="form-group">
          <label class="form-label">URL зображення</label>
          <input class="form-input" id="task-photo-url" placeholder="https://..." value="">
        </div>
      `;
    case 'video':
      return `
        <div class="form-group">
          <label class="form-label">URL відео (YouTube)</label>
          <input class="form-input" id="task-video" placeholder="https://www.youtube.com/watch?v=..." value="${esc(existing?.videoUrl || '')}">
        </div>
      `;
    case 'wordwall':
      return `
        <div class="form-group">
          <label class="form-label">Wordwall embed URL</label>
          <input class="form-input" id="task-wordwall" placeholder="https://wordwall.net/embed/..." value="${esc(existing?.videoUrl || '')}">
        </div>
      `;
    default:
      return '';
  }
}

// ─── Modal ───
function showModal(title, bodyHtml, onConfirm) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-overlay show" id="modal-overlay">
      <div class="modal-box">
        <div class="modal-scroll">
          <div class="modal-title">${title}</div>
          ${bodyHtml}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-modal-close>Скасувати</button>
          <button class="btn btn-primary" data-modal-confirm>Далі</button>
        </div>
      </div>
    </div>
  `;
  root.querySelector('[data-modal-close]').onclick = closeModal;
  root.querySelector('[data-modal-confirm]').onclick = onConfirm;
  root.querySelector('#modal-overlay').onclick = (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  };
  const firstInput = root.querySelector('input, textarea');
  if (firstInput) setTimeout(() => firstInput.focus(), 100);
}

function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
}
window.closeModal = closeModal;

// ─── Grading ───
function parseChooseOptions(input) {
  const parts = (input || '').split('\n').filter(Boolean);
  const options = new Set();
  parts.forEach(line => {
    const matches = line.match(/\[([^\]]+)\]/g) || line.match(/__\(([^)]+)\)/g);
    if (matches) matches.forEach(m => options.add(m.replace(/[\[\]()]/g, '')));
  });
  return [...options];
}

function extractFillinAnswer(input) {
  const match = (input || '').match(/\[([^\]]+)\]/);
  return match ? match[1].trim().toLowerCase() : '';
}

function gradeTest(test, answers) {
  let correct = 0;
  const details = [];

  answers.forEach((a, i) => {
    const q = a.question;
    let isCorrect = false;

    if (q.type === 'choose') {
      const correctIdx = parseChooseOptions(q.input).findIndex(opt =>
        q.input.includes(`[${opt}]`) || q.input.includes(`__(${opt})`)
      );
      isCorrect = a.answer === correctIdx;
    } else if (q.type === 'fillin') {
      const correct = extractFillinAnswer(q.input);
      isCorrect = (a.answer || '').toLowerCase() === correct;
    } else if (q.type === 'match') {
      const pairs = q.input.split('\n').filter(Boolean);
      const correctRights = pairs.map(p => p.split('|')[1]?.trim());
      isCorrect = a.answer && a.answer.every((v, j) => v === correctRights[j]);
    } else if (q.type === 'order') {
      const correctOrder = (q.input || '').split('\n').filter(Boolean);
      const given = (a.answer || []).map(x => x.num);
      isCorrect = correctOrder.every((item, j) => given[j] == (j + 1));
    }

    if (isCorrect) correct++;
    details.push({ question: q, answer: a.answer, correct: isCorrect });
  });

  return { correct, total: test.questions.length, details };
}

// ─── Init ───
go('home');
