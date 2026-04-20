# Изменения в системе KnowledgeBY

## Выполненные задачи

### ✅ 1. Перенаправление /diary → /student/diary

**Файл:** `src/app/diary/page.tsx`

Создана страница-редирект, которая автоматически перенаправляет пользователя с `/diary` на `/student/diary`.

```typescript
// При переходе на /diary происходит автоматический редирект на /student/diary
redirect("/student/diary");
```

**Использование:**
```
/diary → /student/diary
```

---

### ✅ 2. Удалены кнопки "Расписание" и "Четверти" из админ-панели

**Файл:** `src/app/admin/page.tsx`

Из главного меню админ-панели удалены:
- ❌ Кнопка "Расписание" (`/admin/schedule/class`)
- ❌ Кнопка "Четверти" (`/admin/academic-periods`)

**Оставшиеся кнопки:**
- ✅ Пользователи
- ✅ Предметы
- ✅ Дневник (теперь ведёт на `/diary`)
- ✅ Классы
- ✅ Связи

---

### ✅ 3. Страница выбора ученика `/select-student`

**Файл:** `src/app/select-student/page.tsx`

Создана новая страница для выбора ученика перед заполнением дневника.

**Функционал:**
1. Выбор класса из выпадающего списка
2. Выбор ученика (фильтруется по классу)
3. Кнопка "Продолжить" → переход на `/student/diary?id={studentId}`
4. Отображение информации об ученике (нередактируемое)
5. Информация об учреждении образования (подтягивается из настроек)

**API заглушки:**
- `GET /api/classes` - получение списка классов
- `GET /api/students?classId={id}` - получение учеников класса
- `GET /api/school-info` - информация о школе

**Таблицы БД:**
- `groups` - классы
- `users` - ученики
- `school_info` - информация о школе

---

### ✅ 4. Динамический маршрут для дневника

**Файл:** `src/app/student/diary/[id]/page.tsx`

Страница дневника теперь принимает `id` ученика через параметры маршрута.

**Маршрут:**
```
/student/diary/{studentId}
```

**Пример:**
```
/student/diary/student-123
```

**Изменения:**
- Добавлен хук `useParams()` для получения ID из маршрута
- ID ученика используется для загрузки данных через API
- Все данные привязываются к конкретному ученику

---

## Структура маршрутов

```
/
├── /admin                          # Админ-панель
│   ├── /users                      # Пользователи
│   ├── /subjects                   # Предметы
│   ├── /groups                     # Классы
│   └── /parent-student-links       # Связи
│
├── /diary                          # → Редирект на /student/diary
│
├── /select-student                 # Выбор ученика
│   └── (переход на /student/diary?id=...)
│
└── /student/diary/[id]             # Дневник ученика (динамический)
    ├── /student/diary/student-1
    ├── /student/diary/student-2
    └── ...
```

---

## API эндпоинты (заглушки)

### Для страницы выбора ученика

```typescript
// GET /api/classes
// Возвращает: [{ id, name, teacherId }]
// Таблица: groups

// GET /api/students?classId={id}
// Возвращает: [{ id, fullName, email, groupId }]
// Таблица: users WHERE groupId = ? AND role = 'student'

// GET /api/school-info
// Возвращает: { schoolName, schoolAddress, schoolPhone }
// Таблица: school_info
```

### Для дневника

```typescript
// GET /api/student/{id}
// Возвращает: { id, fullName, className, schoolName, ... }
// Таблицы: users + groups

// GET /api/subjects?groupId={id}
// Возвращает: [{ id, name, teacherName, teacherId }]
// Таблицы: subjects + teacherSubjects + users

// POST /api/grades
// Body: { studentId, subjectId, teacherId, value, date, comment }
// Таблица: grades

// POST /api/homework
// Body: { teacherId, groupId, subjectId, lessonDate, description }
// Таблица: homework
```

---

## Примеры использования

### 1. Переход к дневнику из админ-панели

```tsx
// В админ-панели для каждого ученика:
<Link href={`/student/diary/${student.id}`}>
  Дневник
</Link>
```

### 2. Выбор ученика через страницу выбора

```
1. Пользователь переходит на /select-student
2. Выбирает класс "7А"
3. Выбирает ученика "Иванов Иван"
4. Нажимает "Продолжить"
5. Перенаправляется на /student/diary/student-123
```

### 3. Прямой переход по ID

```
/student/diary/student-123
```

---

## Интеграция с БД

### Таблица `groups` (классы)
```sql
CREATE TABLE groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,           -- "7А", "8Б"
  teacherId TEXT                -- классный руководитель
);
```

### Таблица `users` (ученики)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student',
  groupId INTEGER,              -- ссылка на класс
  FOREIGN KEY (groupId) REFERENCES groups(id)
);
```

### Таблица `school_info` (информация о школе)
```sql
CREATE TABLE school_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  updatedAt INTEGER
);
```

---

## Тестирование

### 1. Проверка редиректа
```bash
# Перейти на /diary должно перенаправить на /student/diary
curl -L http://localhost:3000/diary
```

### 2. Проверка страницы выбора
```
1. Открыть http://localhost:3000/select-student
2. Выбрать класс
3. Выбрать ученика
4. Нажать "Продолжить"
5. Проверить переход на /student/diary/{id}
```

### 3. Проверка дневника
```
1. Открыть http://localhost:3000/student/diary/student-1
2. Проверить загрузку данных ученика
3. Проверить редактирование полей
```

---

## Визуальные изменения

### Админ-панель (до)
```
[Пользователи] [Предметы] [Расписание] [Дневник] [Четверти] [Классы] [Связи]
```

### Админ-панель (после)
```
[Пользователи] [Предметы] [Дневник] [Классы] [Связи]
```

### Страница выбора ученика (новая)
```
┌────────────────────────────────────┐
│      Выбор ученика                 │
│  Выберите класс и ученика для      │
│  заполнения дневника               │
├────────────────────────────────────┤
│  Класс: [Выберите класс ▼]         │
│  Ученик: [Выберите ученика ▼]      │
│                                    │
│  [Продолжить]                      │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Информация об ученике             │
├────────────────────────────────────┤
│  Собственное имя: Иванов Иван      │
│  Класс: 7А                         │
│  Учреждение: ГУО "СШ № 1"          │
│  Адрес: г. Минск, ул. ...          │
│  Телефон: +375 17 123-45-67        │
└────────────────────────────────────┘
```

---

## Зависимости

Все изменения используют существующие зависимости:
- ✅ Next.js 16.1.6
- ✅ React 19.2.3
- ✅ TypeScript 5

**Новые зависимости не требуются.**

---

## Миграция данных

Если в БД ещё нет таблицы `school_info`, выполните:

```bash
npm run db:generate
npm run db:push
```

Или создайте таблицу вручную:

```sql
CREATE TABLE school_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  updatedAt INTEGER DEFAULT (unixepoch() * 1000)
);

-- Добавить запись по умолчанию
INSERT INTO school_info (name, address, phone) VALUES 
('ГУО "Средняя школа № 1"', '220000, г. Минск, ул. Примерная, д. 1', '+375 17 123-45-67');
```

---

## Примечания

1. **Кнопка "Дневник"** в админ-панели теперь ведёт на `/diary`, который перенаправляет на `/student/diary`
2. **Страница `/select-student`** - отдельная страница для выбора ученика
3. **Динамический маршрут** `/student/diary/[id]` позволяет открывать дневник конкретного ученика
4. **Все API** содержат заглушки с комментариями для быстрой интеграции

---

## Контакты

Вопросы и предложения: внутренняя техподдержка KnowledgeBY
