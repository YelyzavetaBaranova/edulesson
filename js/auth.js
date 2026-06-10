export let currentUser = null;

const BASE = '/api';

async function authReq(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Помилка');
  }
  return res.json();
}

export async function seedAdmin() {
  // Admin is seeded server-side on first DB creation
}

export async function login(email, password) {
  const data = await authReq('/auth/login', { email, password });
  const session = { id: data.id, email: data.email, name: data.name, role: data.role, token: data.token };
  sessionStorage.setItem('edu-session', JSON.stringify(session));
  currentUser = session;
  return session;
}

export async function register(email, password, name) {
  const data = await authReq('/auth/register', { email, password, name });
  const session = { id: data.id, email: data.email, name: data.name, role: data.role, token: data.token };
  sessionStorage.setItem('edu-session', JSON.stringify(session));
  currentUser = session;
  return session;
}

export function logout() {
  sessionStorage.removeItem('edu-session');
  currentUser = null;
  window.__enrolledChecked = false;
  window.__enrolledCourseId = null;
  window.__enrolledCourseIds = null;
  localStorage.removeItem('activeCourseId');
}

export function restoreSession() {
  const raw = sessionStorage.getItem('edu-session');
  if (raw) {
    try { currentUser = JSON.parse(raw); return currentUser; } catch { /* */ }
  }
  return null;
}

export function isAdmin() { return currentUser?.role === 'admin'; }
export function isLoggedIn() { return !!currentUser; }
