import { D, save } from './store.js';
import * as state from './state.js';

export async function delTask(fid, lid, tid) {
  if (!confirm('Видалити завдання?')) return;
  const lesson = (D.lessons[fid] || []).find((x) => x.id === lid);
  lesson.tasks = (lesson.tasks || []).filter((x) => x.id !== tid);
  save();
  const nav = await import('./navigation.js');
  nav.openLesson(fid, lid);
}

export async function delLesson(fid, lid) {
  if (!confirm('Видалити урок?')) return;
  D.lessons[fid] = (D.lessons[fid] || []).filter((x) => x.id !== lid);
  save();
  state.setCLid(null);
  const nav = await import('./navigation.js');
  const folder = D.folders.find((x) => x.id === fid);
  nav.showFolderView(folder, D.lessons[fid] || []);
  nav.renderSB();
}

export async function delFolder(fid) {
  if (!confirm('Видалити папку і всі уроки?')) return;
  D.folders = D.folders.filter((x) => x.id !== fid);
  delete D.lessons[fid];
  save();
  state.setCFid(null);
  state.setCLid(null);
  const nav = await import('./navigation.js');
  nav.renderSB();
  nav.showHome();
}
