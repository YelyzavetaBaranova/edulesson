# EduLesson

Конструктор інтерактивних уроків англійської мови.

## Структура

```
edulesson/
├── index.html          # Розмітка
├── css/
│   └── main.css        # Стилі
└── js/
    ├── main.js         # Точка входу, обробники подій
    ├── store.js        # Дані localStorage
    ├── state.js        # UI-стан
    ├── constants.js    # Константи типів завдань
    ├── utils.js        # Допоміжні функції
    ├── navigation.js   # Навігація, sidebar, уроки
    ├── modals.js       # Модальні вікна
    ├── vocab.js        # Словник
    ├── translator.js   # Перекладач
    ├── delete.js       # Видалення
    └── tasks/
        ├── builders.js     # Побудова HTML завдань
        ├── render.js       # Рендер карток завдань
        ├── grading.js      # Перевірка відповідей
        ├── interactions.js # Drag-and-drop, match, choose
        └── media.js        # Відео, галерея
```

## Запуск

### Швидкий старт (рекомендовано)

Подвійний клік по **`start.bat`** у папці проєкту.

Відкриється браузер: **http://localhost:8765**

Node.js і Python не потрібні.

### Завжди відкритий при вході в Windows

1. Подвійний клік по **`scripts\install-autostart.ps1`**
2. Якщо Windows блокує — правою кнопкою → **Run with PowerShell**

Після цього при кожному увімкненні комп'ютера сайт запускатиметься автоматично.

Щоб вимкнути автозапуск: `Win+R` → `shell:startup` → видали ярлик **EduLesson**.

### Зупинити сервер

Подвійний клік по **`stop.bat`**.

Дані зберігаються в `localStorage` під ключем `edu5`.
