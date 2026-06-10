const BASE = '/api';

const SNAKE_TO_CAMEL = {
  user_id: 'userId', course_id: 'courseId', lesson_id: 'lessonId',
  task_id: 'taskId', order_index: 'orderIndex',
  created_at: 'createdAt', updated_at: 'updatedAt',
  tasks_json: 'tasksJson',
};

const CAMEL_TO_SNAKE = {};
for (const [k, v] of Object.entries(SNAKE_TO_CAMEL)) CAMEL_TO_SNAKE[v] = k;

function toCamel(o) {
  if (Array.isArray(o)) return o.map(toCamel);
  if (!o || typeof o !== 'object') return o;
  const r = {};
  for (const [k, v] of Object.entries(o)) {
    if (k === 'tasks') { r.tasksJson = JSON.stringify(v); continue; }
    r[SNAKE_TO_CAMEL[k] || k] = v;
  }
  return r;
}

function toSnake(o) {
  if (Array.isArray(o)) return o.map(toSnake);
  if (!o || typeof o !== 'object') return o;
  const r = {};
  for (const [k, v] of Object.entries(o)) {
    if (k === 'tasksJson') { try { r.tasks = JSON.parse(v); } catch { r.tasks = []; } continue; }
    r[CAMEL_TO_SNAKE[k] || k] = v;
  }
  return r;
}

async function api(url, options = {}) {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  const ct = res.headers.get('content-type');
  if (ct && ct.includes('application/json')) return res.json();
  return res.text();
}

function storeUrl(store) {
  const m = { users: '/users', courses: '/courses', lessons: '/lessons', enrollments: '/enrollments', progress: '/progress', homework: '/homework', schedule: '/schedule', activity: '/activity' };
  if (!m[store]) throw new Error('Unknown store: ' + store);
  return m[store];
}

export async function getAll(store) {
  const data = await api(storeUrl(store));
  return (data || []).map(toSnake);
}

export async function get(store, id) {
  const data = await api(storeUrl(store) + '/' + id);
  return toSnake(data);
}

export async function getByIndex(store, index, value) {
  const params = {};
  if (index === 'email') params.email = value;
  else if (index === 'course_id') params.courseId = value;
  else if (index === 'user_id') params.userId = value;
  else if (index === 'lesson_id') params.lessonId = value;
  const qs = new URLSearchParams(params).toString();
  const url = storeUrl(store) + (qs ? '?' + qs : '');
  const data = await api(url);
  return (data || []).map(toSnake);
}

export async function getByCompositeIndex(store, index, values) {
  const params = {};
  if (index === 'user_course' && store === 'enrollments') { params.userId = values[0]; params.courseId = values[1]; }
  else if (index === 'user_lesson' && store === 'progress') { params.userId = values[0]; params.lessonId = values[1]; }
  const qs = new URLSearchParams(params).toString();
  const url = storeUrl(store) + (qs ? '?' + qs : '');
  const data = await api(url);
  return (data || []).map(toSnake);
}

export async function add(store, obj) {
  const body = toCamel({ ...obj });
  delete body.createdAt;
  let url;
  if (store === 'lessons') {
    const courseId = body.courseId;
    if (!courseId) throw new Error('course_id required for lessons');
    delete body.courseId;
    delete body.id;
    url = '/courses/' + courseId + '/lessons';
  } else {
    url = storeUrl(store);
  }
  const data = await api(url, { method: 'POST', body: JSON.stringify(body) });
  return data.id;
}

export async function put(store, obj) {
  const body = toCamel({ ...obj });
  delete body.createdAt;
  delete body.updatedAt;
  let url;
  if (store === 'lessons') {
    const courseId = body.courseId;
    if (!courseId) throw new Error('course_id required for lessons');
    delete body.courseId;
    url = '/courses/' + courseId + '/lessons/' + body.id;
  } else if (store === 'progress') {
    // API upserts via POST
    return add(store, obj);
  } else {
    url = storeUrl(store) + '/' + body.id;
  }
  const data = await api(url, { method: 'PUT', body: JSON.stringify(body) });
  return toSnake(data);
}

export async function del(store, id) {
  await api(storeUrl(store) + '/' + id, { method: 'DELETE' });
}
