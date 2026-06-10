import * as db from './db/index.js';
import { uid } from './utils.js';
import { DEFAULT_FOLDERS } from './constants.js';

export let D = { courses: [], vocab: [] };
let initialized = false;

export async function init() {
  if (initialized) return;
  loadVocab();
  const migrated = await tryMigrate();
  if (!migrated) {
    await loadFromDB();
  }
  await seedIfEmpty();
  initialized = true;
}

async function tryMigrate() {
  const raw = localStorage.getItem('edu6-v2');
  if (!raw) return false;
  try {
    const old = JSON.parse(raw);
    if (!old.folders || !old.folders.length) return false;
    for (const folder of old.folders) {
      const existing = await db.getByIndex('courses', 'name', folder.name);
      if (existing.length > 0) continue;
      const courseId = await db.add('courses', { name: folder.name, description: '', created_at: new Date().toISOString() });
      const lessonList = old.lessons[folder.id] || [];
      for (let i = 0; i < lessonList.length; i++) {
        const l = lessonList[i];
        await db.add('lessons', { course_id: courseId, name: l.name, order_index: i, tasks: l.tasks || [], created_at: new Date().toISOString() });
      }
    }
    if (old.vocab && old.vocab.length) {
      D.vocab = old.vocab;
    }
    localStorage.removeItem('edu6-v2');
    await loadFromDB();
    return true;
  } catch { return false; }
}

async function loadFromDB() {
  const courses = await db.getAll('courses');
  D.courses = [];
  for (const c of courses) {
    const lessons = await db.getByIndex('lessons', 'course_id', c.id);
    lessons.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    D.courses.push({ id: c.id, name: c.name, description: c.description || '', lessons: lessons.map(l => ({ id: l.id, name: l.name, tasks: l.tasks || [] })) });
  }
}

async function seedIfEmpty() {
  if (D.courses.length > 0) return;
  for (const name of DEFAULT_FOLDERS) {
    const courseId = await db.add('courses', { name, description: '', created_at: new Date().toISOString() });
    const lessonIds = [];
    for (let i = 1; i <= 5; i++) {
      const lid = await db.add('lessons', { course_id: courseId, name: `Lesson ${i}`, order_index: i - 1, tasks: [], created_at: new Date().toISOString() });
      lessonIds.push(lid);
    }
    D.courses.push({ id: courseId, name, description: '', lessons: lessonIds.map((id, i) => ({ id, name: `Lesson ${i + 1}`, tasks: [] })) });
  }
  await seedLesson2();
}

export function getCourseRef(id) {
  const nid = Number(id);
  return D.courses.find(c => c.id === nid);
}

export function getLessonRef(courseId, lessonId) {
  const c = getCourseRef(courseId);
  if (!c) return null;
  const nid = Number(lessonId);
  return c.lessons.find(l => l.id === nid) || null;
}

export async function save() {
  for (const c of D.courses) {
    const existing = await db.get('courses', c.id);
    if (!existing) continue;
    await db.put('courses', { ...existing, name: c.name, description: c.description || '' });
    for (const l of c.lessons) {
      const existingLesson = await db.get('lessons', l.id);
      if (!existingLesson) continue;
      existingLesson.name = l.name;
      existingLesson.tasks = l.tasks;
      await db.put('lessons', existingLesson);
    }
  }
  saveVocab();
}

export async function addCourse(name) {
  const id = await db.add('courses', { name, description: '', created_at: new Date().toISOString() });
  D.courses.push({ id, name, description: '', lessons: [] });
  return id;
}

export async function delCourse(courseId) {
  const nid = Number(courseId);
  const lessons = await db.getByIndex('lessons', 'course_id', nid);
  for (const l of lessons) await db.del('lessons', l.id);
  await db.del('courses', nid);
  D.courses = D.courses.filter(c => c.id !== nid);
}

export async function addLesson(courseId, name) {
  const course = getCourseRef(courseId);
  if (!course) return null;
  const order = course.lessons.length;
  const nid = Number(courseId);
  const id = await db.add('lessons', { course_id: nid, name, order_index: order, tasks: [], created_at: new Date().toISOString() });
  course.lessons.push({ id, name, tasks: [] });
  return id;
}

export async function delLesson(courseId, lessonId) {
  const course = getCourseRef(courseId);
  if (!course) return;
  await db.del('lessons', Number(lessonId));
  course.lessons = course.lessons.filter(l => l.id !== Number(lessonId));
}

function t(type, extra) {
  return { id: uid(), type, instruction: '', hint: '', hintImg: '', videoUrl: '', images: [], input: '', captions: [], ...extra };
}

async function seedLesson2() {
  const course = D.courses.find(c => c.name === 'A1 8-11');
  if (!course) return;
  const lesson = course.lessons.find(l => l.name === 'Lesson 2');
  if (!lesson || lesson.tasks.length > 0) return;
  lesson.tasks = [
    t('text', { instruction: '🎯 Цель урока', input: '• повторить буквы\n• закрепить цвета\n• выучить счёт 1–5 через действия\n• научиться говорить о себе:\n  My name is…\n  I am … years old\n  My favorite color is…\n  I am from…' }),
    t('text', { instruction: '1️⃣ Разминка и повторение букв', input: '🎮 Игра: "Guess the Letter"\n\nУчитель загадывает букву, ученики угадывают.' }),
    t('text', { instruction: '2️⃣ Цвета + движение (TPR игра)', input: '🎮 Игра: "Touch something!"\n\nНайди в комнате что-то зеленое, красное, синее и т.д.' }),
    t('photo', { instruction: 'Картинка 1 — Touch something!', images: [] }),
    t('text', { instruction: 'Второй раунд (в подсказке)', hint: '🎮 Раунд 2: ученики меняются ролями — один даёт команду, другой показывает.\n\nКартинка 2', input: 'Меняемся ролями — ученик даёт команду "Touch something red!"' }),
    t('text', { instruction: '3️⃣ Активность: счёт + движение', input: '🎮 Игра: "Count and move"\n\n• "Clap 3 times!" — One, two, three!\n• "Jump 5 times!" — One, two, three, four, five!\n• "Stomp 4 times!"\n• "Turn around 2 times!"' }),
    t('text', { instruction: '4️⃣ Тема урока: "About Me"', input: '🗣️ Новые фразы:' }),
    t('photo', { instruction: 'Картинка 3 — "My name is …" — моє ім\'я це', images: [] }),
    t('photo', { instruction: 'Картинка 4 — "I am 10 years old" — мені 10 років', images: [] }),
    t('photo', { instruction: 'Картинка 5 — "My favorite color is …" — мій улюблений колір це', images: [] }),
    t('photo', { instruction: 'Картинка 6 — "I am from …" — я з', images: [] }),
    t('photo', { instruction: 'Картинка 7 — "My hobby is …"', images: [] }),
    t('photo', { instruction: 'Картинка 10', images: [] }),
    t('video', { instruction: '📺 Відео: About Me', videoUrl: 'https://www.youtube.com/watch?v=IeXsH_Pjz90' }),
    t('match', { instruction: '5️⃣ Super Puzzle — About Me', input: "Hi! I'm Lolla. | Nice to meet you!\nWhat's your name? | My name is Bobby.\nHow old are you? | I am 10 years old.\nWhere are you from? | I am from the USA.\nWhat is your favorite color? | My favorite color is green.\nWhat is your hobby? | My hobby is playing football.\nHave a nice day | goodbye" }),
    t('photo', { instruction: '6️⃣ What\'s your hobby? — Картинка 8', images: [] }),
    t('photo', { instruction: '7️⃣ Grammar: a / an — Картинка 9', images: [] }),
    t('photo', { instruction: '7️⃣ Grammar: a / an — Картинка 10', images: [] }),
    t('text', { instruction: '8️⃣ Ігровий фінал: "Simon Says"', input: '🎯 Мета: розвиток усного мовлення та швидкої реакції\n\n🎾 Правила гри:\nВчитель кидає м\'яч і каже команду "Simon says…"\n\n🗣️ Команди:\n• Simon says: Say your name!\n• Simon says: Say your favorite color!\n• Simon says: Say your age!\n• Simon says: Say your hobby!\n\n👉 Дитина ловить м\'яч і відповідає повним реченням:\nMy name is…\nMy favorite color is…\nI am … years old\nMy hobby is…' }),
    t('wordwall', { instruction: '9️⃣ Колесо фортуни', videoUrl: 'https://wordwall.net/embed/ae442c77fe104fe9861b9fb3d2c4cc4a?themeId=65&templateId=8&fontStackId=0' }),
  ];
  await save();
}

export async function saveVocab() {
  localStorage.setItem('edu6-v2-vocab', JSON.stringify(D.vocab));
}

export function loadVocab() {
  try {
    const raw = localStorage.getItem('edu6-v2-vocab');
    if (raw) D.vocab = JSON.parse(raw);
  } catch { /* ignore */ }
}
