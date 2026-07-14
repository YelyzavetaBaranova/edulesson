import { uid } from './utils.js';
import { DEFAULT_FOLDERS } from './constants.js';

export let D = JSON.parse(localStorage.getItem('edu6') || '{}');

if (!D.folders) D.folders = [];
if (!D.lessons) D.lessons = {};
if (!D.vocab) D.vocab = [];

if (D.folders.length === 0) {
  DEFAULT_FOLDERS.forEach((name) => {
    const id = uid();
    D.folders.push({ id, name });
    D.lessons[id] = [];
    for (let i = 1; i <= 5; i++) {
      D.lessons[id].push({ id: uid(), name: `Lesson ${i}`, tasks: [] });
    }
  });
}

function seedLesson2() {
  const folder = D.folders.find((f) => f.name === 'A1 8-11');
  if (!folder) return;
  const lesson = (D.lessons[folder.id] || []).find((l) => l.name === 'Lesson 2');
  if (!lesson || (lesson.tasks || []).length > 0) return;

  const t = (type, extra) => ({ id: uid(), type, instruction: '', hint: '', hintImg: '', videoUrl: '', images: [], input: '', ...extra });

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
}

seedLesson2();

export function save() {
  try {
    localStorage.setItem('edu6', JSON.stringify(D));
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      alert('Забагато даних! Спробуй видалити зайві зображення або очистити localStorage.');
    } else {
      throw e;
    }
  }
}

save();
