export const BADGES = {
  choose: 'badge-choose',
  fillin: 'badge-fillin',
  fillinbox: 'badge-fillinbox',
  order: 'badge-order',
  photo: 'badge-photo',
  gallery: 'badge-gallery',
  video: 'badge-video',
  wordwall: 'badge-wordwall',
  game: 'badge-game',
  text: 'badge-text',
  match: 'badge-match',
};

export const NAMES = {
  choose: 'Choose option',
  fillin: 'Fill in gaps',
  fillinbox: 'Fill from box',
  order: 'Word order',
  photo: 'Photo',
  gallery: 'Gallery',
  video: 'Video',
  wordwall: 'Wordwall',
  game: 'Game',
  text: 'Text block',
  match: 'Match',
};

export const HINTS = {
  choose:
    '<span class="hb-ex">They [is\\are*\\was\\were] on holiday.</span><br>Зірочка * = правильна відповідь. Нові рядки = нові речення.',
  fillin:
    '<span class="hb-ex">I like [walking] in the park.</span><br>Відповідь у дужках [ ]. Нові рядки = нові речення.',
  fillinbox:
    '<span class="hb-ex">I [like] playing.\ni [walk] to school.</span><br>Кожен рядок — речення. [ ] = пропуск. Слова автоматично в скриньці.',
  order:
    '<span class="hb-ex">What\\is\\your\\name?</span><br>Слова через \\. Нові рядки = нові речення.',
  match:
    "<span class=\"hb-ex\">What's your name? | My name is Liza.\nHow old are you? | I am 8.</span><br>Кожна пара на новому рядку: ліво | право",
  text: 'Введи будь-який текст, інструкцію або пояснення для учнів.',
};

export const DEFAULT_FOLDERS = [
  'A1 5-8',
  'A1 8-11',
  'A1 11-18',
];

export const INTERACTIVE_TYPES = ['choose', 'fillin', 'fillinbox', 'order', 'match'];
