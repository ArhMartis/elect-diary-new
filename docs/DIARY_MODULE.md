# Модуль "Дневник учащегося" - KnowledgeBY

## Обзор

Модуль "Дневник учащегося" реализует полноценный электронный дневник в соответствии с типовой формой из постановления № 267 (с изменениями до 14.02.2025) Республики Беларусь.

## Структура файлов

```
src/
├── app/
│   ├── student/
│   │   └── diary/
│   │       └── page.tsx              # Основная страница дневника
│   └── api/
│       ├── student/[id]/route.ts     # Данные ученика
│       ├── grades/route.ts           # Оценки (CRUD)
│       ├── homework/route.ts         # Домашние задания (CRUD)
│       ├── absences/route.ts         # Пропуски
│       ├── school-contacts/route.ts  # Контакты школы
│       ├── bell-schedule/route.ts    # Расписание звонков
│       ├── electives/route.ts        # Факультативы
│       ├── holidays/route.ts         # Каникулы
│       ├── final-grades/route.ts     # Итоговые оценки
│       └── teacher-comments/route.ts # Замечания учителей
└── db/
    └── schema/
        ├── diary-extra.ts            # Дополнительные таблицы БД
        └── ...
```

## Установка

### 1. Добавление новых таблиц в базу данных

Новые таблицы определены в файле `src/db/schema/diary-extra.ts`:

- `schoolContacts` - контакты школы
- `bellSchedule` - расписание звонков
- `electives` - факультативы
- `holidays` - каникулы
- `finalGrades` - итоговые оценки
- `absences` - пропуски
- `teacherComments` - замечания учителей
- `teacherRecommendations` - рекомендации и благодарности
- `schoolInfo` - информация о школе
- `academicYears` - учебные годы

Выполните миграцию:

```bash
npm run db:generate
npm run db:push
```

### 2. API эндпоинты

Все API эндпоинты уже созданы и готовы к использованию. Каждый эндпоинт содержит:

- GET запрос для получения данных
- POST/PUT запросы для сохранения данных
- DELETE запросы для удаления (где применимо)

## Интеграция с существующей БД

### Основные связи

```sql
-- users (existing)
-- ├── id (PRIMARY KEY)
-- ├── full_name
-- ├── groupId → groups.id
-- └── role (student, teacher, parent, admin, principal)

-- groups (existing)
-- ├── id (PRIMARY KEY)
-- └── name (e.g., "7А")

-- subjects (existing)
-- ├── id (PRIMARY KEY)
-- └── name

-- grades (existing)
-- ├── id
-- ├── studentId → users.id
-- ├── subjectId → subjects.id
-- ├── teacherId → users.id
-- ├── value
-- ├── date
-- └── academicPeriodId → academicPeriods.id

-- homework (existing)
-- ├── id
-- ├── teacherId → users.id
-- ├── groupId → groups.id
-- ├── subjectId → subjects.id
-- ├── lessonDate
-- └── description

-- diary-extra (new tables)
```

### Примеры запросов

#### Получение данных ученика

```typescript
// GET /api/student/{id}
const response = await fetch('/api/student/student-123');
const student = await response.json();

// Возвращает:
// {
//   id: "student-123",
//   fullName: "Иванов Иван",
//   surname: "Иванов",
//   name: "Иван",
//   classId: 1,
//   className: "7А",
//   schoolName: "ГУО \"Средняя школа № 1\"",
//   schoolAddress: "220000, г. Минск, ул. Примерная, д. 1",
//   schoolPhone: "+375 17 123-45-67",
//   academicYear: "2025/2026"
// }
```

#### Добавление оценки

```typescript
// POST /api/grades
await fetch('/api/grades', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentId: "student-123",
    subjectId: 5,
    teacherId: "teacher-456",
    value: "8",
    date: "2025-09-10",
    comment: "Хороший ответ",
    academicPeriodId: 1
  })
});
```

#### Получение оценок за период

```typescript
// GET /api/grades?studentId=...&academicPeriodId=...
const response = await fetch(
  '/api/grades?studentId=student-123&academicPeriodId=1'
);
const grades = await response.json();
```

#### Добавление домашнего задания

```typescript
// POST /api/homework
await fetch('/api/homework', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    teacherId: "teacher-456",
    groupId: 1,
    subjectId: 5,
    lessonDate: "2025-09-10",
    description: "Упражнение 123, страница 45",
    dueDate: "2025-09-12"
  })
});
```

#### Сохранение пропусков

```typescript
// POST /api/absences
await fetch('/api/absences', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentId: "student-123",
    month: "Сентябрь",
    academicYear: "2025/2026",
    total: 5,
    unexcused: 2
  })
});
```

## Структура страницы дневника

Страница дневника (`/student/diary`) состоит из следующих секций:

1. **Титульный лист** - основная информация об ученике
2. **Контакты** - контактная информация школы и должностных лиц
3. **Предметы** - учебные предметы и учителя
4. **Расписание** - расписание уроков
5. **Месяцы (Сентябрь-Май)** - ежедневные записи, задания, оценки
6. **Аттестация** - четвертные и итоговые оценки
7. **Каникулы** - даты каникул
8. **Праздники** - государственные праздники и памятные даты

## Навигация

- Переключение между секциями через верхнее меню
- Кнопки управления внизу страницы:
  - 💾 Сохранить - сохранение в localStorage + отправка в БД
  - 📂 Загрузить - загрузка из localStorage
  - 🖨️ Печать - печать дневника
  - 🗑️ Очистить - очистка данных

## Хранение данных

### Временное хранение (прототип)

Данные сохраняются в `localStorage` браузера:

```typescript
localStorage.setItem("diaryData", JSON.stringify(data));
```

### Постоянное хранение (БД)

При нажатии кнопки "Сохранить" данные отправляются в БД через API:

```typescript
// Пример сохранения контактов школы
await saveSchoolContacts({
  schoolName: "...",
  director: "...",
  // ...
});

// Пример сохранения оценки
await saveGrade({
  studentId: "...",
  subjectId: 1,
  teacherId: "...",
  value: "8",
  date: "2025-09-10"
});
```

## Заглушки API

Все API вызовы в коде содержат комментарии с указанием:

1. **Метод и URL**: `// API: POST /api/grades`
2. **Таблица БД**: `// Таблица: grades`
3. **Поля**: `(studentId, subjectId, teacherId, value, date, comment)`
4. **SQL запрос**: `// [DB] INSERT INTO grades ...`

Это позволяет быстро заменить заглушки на реальные вызовы.

## Пример интеграции

### Шаг 1: Получить данные ученика

```typescript
useEffect(() => {
  const loadData = async () => {
    const response = await fetch(`/api/student/${currentUserId}`);
    const student = await response.json();
    setData(prev => ({ ...prev, ...student }));
  };
  
  loadData();
}, [currentUserId]);
```

### Шаг 2: Загрузить предметы и учителей

```typescript
const subjectsResponse = await fetch(`/api/subjects?groupId=${classId}`);
const subjects = await subjectsResponse.json();

// subjects: Array<{ id, name, teacherName, teacherId }>
```

### Шаг 3: Загрузить расписание

```typescript
const scheduleResponse = await fetch(
  `/api/schedule?groupId=${classId}&lessonDate=${date}`
);
const schedule = await scheduleResponse.json();

// schedule: Array<{ subjectName, teacherName, lessonNumber }>
```

### Шаг 4: Сохранить оценку

```typescript
const handleGradeChange = async (lessonId: number, value: string) => {
  await fetch('/api/grades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: currentUserId,
      subjectId: lesson.subjectId,
      teacherId: lesson.teacherId,
      value,
      date: lesson.date
    })
  });
};
```

## Тестирование

### Проверка API

```bash
# Получить данные ученика
curl http://localhost:3000/api/student/student-123

# Добавить оценку
curl -X POST http://localhost:3000/api/grades \
  -H "Content-Type: application/json" \
  -d '{"studentId":"student-123","subjectId":1,"teacherId":"teacher-456","value":"8","date":"2025-09-10"}'

# Получить оценки
curl "http://localhost:3000/api/grades?studentId=student-123"
```

### Проверка страницы

1. Запустите сервер разработки: `npm run dev`
2. Откройте: `http://localhost:3000/student/diary`
3. Проверьте все секции
4. Нажмите "Сохранить" и проверьте консоль на наличие API вызовов

## Миграция с localStorage на БД

1. В файле `src/app/student/diary/page.tsx` найдите функции-заглушки:
   - `loadStudentData()`
   - `loadSubjects()`
   - `saveGrade()`
   - `saveHomework()`
   - и т.д.

2. Замените `console.log()` на реальные `fetch()` вызовы:

```typescript
// Было (заглушка):
async function saveGrade(gradeData: {...}) {
  console.log("[API] POST /api/grades", gradeData);
  return { success: true };
}

// Стало (реальный вызов):
async function saveGrade(gradeData: {...}) {
  const response = await fetch('/api/grades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gradeData),
  });
  return await response.json();
}
```

## Примечания

- Все даты в формате `YYYY-MM-DD`
- Учебный год в формате `2025/2026`
- Оценки: `1-10`, `Н` (не аттестирован)
- ID пользователей: строки (UUID)
- ID остальных сущностей: целые числа (autoincrement)

## Контакты и поддержка

Документация: [внутренняя вики KnowledgeBY]
Вопросы: [техподдержка]
