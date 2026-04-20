# Архитектура модуля "Дневник учащегощегося"

## Схема данных

```
┌─────────────────────────────────────────────────────────────────┐
│                         БАЗА ДАННЫХ                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐        │
│  │  users   │         │  groups  │         │ subjects │        │
│  ├──────────┤         ├──────────┤         ├──────────┤        │
│  │ id       │◄────┐   │ id       │         │ id       │        │
│  │ full_name│     │   │ name     │         │ name     │        │
│  │ groupId  │─────┼──►│ teacherId│         │ teacherId│        │
│  │ role     │     │   └──────────┘         └──────────┘        │
│  └──────────┘     │                                              │
│       │           │                                              │
│       │           │                                              │
│       ▼           │                                              │
│  ┌──────────┐     │    ┌──────────────┐    ┌──────────┐        │
│  │  grades  │     │    │  homework    │    │ schedule │        │
│  ├──────────┤     │    ├──────────────┤    ├──────────┤        │
│  │ studentId│─────┘    │ groupId      │───►│ groupId  │        │
│  │ subjectId│──────────►│ subjectId    │    │ subjectId│        │
│  │ teacherId│──────────►│ teacherId    │    │ teacherId│        │
│  │ value    │          │ description  │    │ lessonDate│       │
│  │ date     │          │ lessonDate   │    └──────────┘        │
│  └──────────┘          └──────────────┘                        │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────┐          │
│  │ schoolContacts│   │ bellSchedule │   │ electives│          │
│  ├──────────────┤    ├──────────────┤   ├──────────┤          │
│  │ schoolName   │    │ number       │   │ name     │          │
│  │ director     │    │ start        │   │ teacherId│          │
│  │ vicePrincipal│   │ end          │   │ schedule │          │
│  │ ...          │    │ break        │   └──────────┘          │
│  └──────────────┘    └──────────────┘                          │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────┐          │
│  │   holidays   │    │ finalGrades  │    │ absences │          │
│  ├──────────────┤    ├──────────────┤    ├──────────┤          │
│  │ academicYear │    │ studentId    │    │ studentId│          │
│  │ autumnStart  │    │ subjectId    │    │ month    │          │
│  │ winterStart  │    │ q1-q4        │    │ total    │          │
│  │ springStart  │    │ year         │    │ unexcused│          │
│  │ summerStart  │    │ exam, final  │    └──────────┘          │
│  └──────────────┘    └──────────────┘                          │
│                                                                  │
│  ┌──────────────┐                                              │
│  │teacherComments│                                             │
│  ├──────────────┤                                              │
│  │ studentId    │                                              │
│  │ teacherId    │                                              │
│  │ comment      │                                              │
│  │ date         │                                              │
│  └──────────────┘                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Поток данных

```
┌─────────────┐
│  БРАУЗЕР    │
│             │
│  /student/  │
│    diary    │
└──────┬──────┘
       │
       │ 1. Загрузка страницы
       ▼
┌─────────────────────────────────┐
│  Компонент StudentDiaryPage     │
│                                 │
│  ┌─────────────────────────┐   │
│  │  useEffect (mount)      │   │
│  └───────────┬─────────────┘   │
│              │                 │
│              │ 2. GET /api/student/{id}
│              ▼                 │
│  ┌─────────────────────────┐   │
│  │  loadStudentData()      │   │
│  │  - users                │   │
│  │  - groups               │   │
│  └───────────┬─────────────┘   │
│              │                 │
│              │ 3. GET /api/subjects
│              ▼                 │
│  ┌─────────────────────────┐   │
│  │  loadSubjects()         │   │
│  │  - subjects             │   │
│  │  - teacherSubjects      │   │
│  │  - users (teachers)     │   │
│  └───────────┬─────────────┘   │
│              │                 │
│              │ 4. Инициализация state
│              ▼                 │
│  ┌─────────────────────────┐   │
│  │  setData(initialData)   │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  Рендеринг UI           │   │
│  │  - Титульный лист       │   │
│  │  - Контакты             │   │
│  │  - Предметы             │   │
│  │  - Месяцы               │   │
│  │  - Аттестация           │   │
│  └───────────┬─────────────┘   │
│              │                 │
└──────────────┼─────────────────┘
               │
               │ 5. Действия пользователя
               │
    ┌──────────┼──────────┬────────────┐
    │          │          │            │
    ▼          ▼          ▼            ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│ Измене │ │ Измене │ │ Измене │ │  Нажатие │
│  ние    │ │  ние   │ │  ние   │ │  кнопки  │
│ поля   │ │ оценки │ │  ДЗ    │ │ Сохранить│
└───┬────┘ └───┬────┘ └───┬────┘ └────┬─────┘
    │          │          │           │
    │          │          │           │
    │          │          │           │ 6. POST запросы
    │          │          │           ▼
    │          │          │    ┌──────────────┐
    │          │          │    │ API Endpoints│
    │          │          │    ├──────────────┤
    │          │          │    │ /api/grades  │
    │          │          │    │ /api/homework│
    │          │          │    │ /api/absences│
    │          │          │    └───────┬──────┘
    │          │          │            │
    │          │          │            │ 7. INSERT/UPDATE
    │          │          │            ▼
    │          │          │    ┌──────────────┐
    │          │          │    │   БАЗА       │
    │          │          │    │   ДАННЫХ     │
    │          │          │    └──────────────┘
    │          │          │
    │          │          │
    └──────────┴──────────┴────────────┘
               │
               │ 8. Сохранение в localStorage
               ▼
    ┌─────────────────────┐
    │  localStorage       │
    │  diaryData          │
    └─────────────────────┘
```

## Последовательность вызовов API

### Загрузка данных

```
1. GET /api/student/{id}
   ↓
   Возвращает: { id, fullName, className, schoolName, ... }

2. GET /api/subjects?groupId={classId}
   ↓
   Возвращает: [{ id, name, teacherName, teacherId }, ...]

3. GET /api/schedule?groupId={classId}&lessonDate={date}
   ↓
   Возвращает: [{ subjectName, teacherName, lessonNumber }, ...]

4. GET /api/grades?studentId={id}&academicPeriodId={period}
   ↓
   Возвращает: [{ subjectName, value, date, comment }, ...]

5. GET /api/homework?groupId={classId}&lessonDate={date}
   ↓
   Возвращает: [{ subjectName, description, dueDate }, ...]
```

### Сохранение данных

```
1. POST /api/grades
   Body: { studentId, subjectId, teacherId, value, date, comment }
   ↓
   INSERT INTO grades (...) VALUES (...)

2. POST /api/homework
   Body: { teacherId, groupId, subjectId, lessonDate, description, dueDate }
   ↓
   INSERT INTO homework (...) VALUES (...)

3. POST /api/absences
   Body: { studentId, month, academicYear, total, unexcused }
   ↓
   INSERT INTO absences (...) VALUES (...)

4. POST /api/school-contacts
   Body: { schoolName, director, vicePrincipal, ... }
   ↓
   INSERT OR REPLACE INTO school_contacts (...) VALUES (...)

5. POST /api/final-grades
   Body: { studentId, subjectId, academicYear, q1, q2, q3, q4, year, exam, final }
   ↓
   INSERT OR REPLACE INTO final_grades (...) VALUES (...)
```

## Компоненты страницы

```
StudentDiaryPage (главный компонент)
│
├── TitleSection
│   ├── Основная информация (academicYear, fullName, className)
│   ├── Права учащегося
│   ├── Обязанности учащегося
│   └── Порядок ведения дневника
│
├── ContactsSection
│   ├── Контакты должностных лиц
│   └── Расписание звонков
│
├── SubjectsSection
│   ├── Учебные предметы
│   └── Факультативы
│
├── ScheduleSection
│   └── Расписание уроков по дням
│
├── MonthSection (x9 для каждого месяца)
│   ├── Таблица дней
│   ├── Уроки (предмет, ДЗ, оценка, подпись)
│   └── Итоги месяца (пропуски, подписи)
│
├── GradesSection
│   ├── Таблица оценок по предметам
│   └── Решение о переводе
│
├── HolidaysSection
│   └── Даты каникул
│
└── OfficialSection
    ├── Государственные праздники
    ├── Памятные даты
    └── Профессиональные праздники
```

## Состояние приложения

```typescript
interface StudentDiaryState {
  // Данные ученика
  student: {
    id: string;
    fullName: string;
    className: string;
    schoolName: string;
    // ...
  };
  
  // Предметы и учителя
  subjects: Array<{
    id: number;
    name: string;
    teacherName: string;
    teacherId: string;
  }>;
  
  // Расписание звонков
  bellSchedule: Array<{
    number: string;
    start: string;
    end: string;
    break: string;
  }>;
  
  // Месячные данные
  months: Array<{
    name: string;
    days: Array<{
      date: string;
      lessons: Array<{
        subject: string;
        homework: string;
        grade: string;
        teacherSign: string;
      }>;
    }>;
    absent: number;
    absentUnexcused: number;
    teacherSigned: boolean;
    parentSigned: boolean;
  }>;
  
  // Оценки
  grades: Array<{
    subject: string;
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    year: string;
    exam: string;
    final: string;
  }>;
  
  // Каникулы
  holidays: {
    autumn: string;
    winter: string;
    spring: string;
    summer: string;
  };
}
```

## Безопасность

### Авторизация

```
┌─────────────┐
│  Запрос к  │
│     API    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Проверка сессии │
│ (auth.getSession)│
└──────┬──────────┘
       │
       ├───► Нет сессии ───► 401 Unauthorized
       │
       ▼
┌─────────────────┐
│ Проверка прав   │
│ (role check)    │
└──────┬──────────┘
       │
       ├───► Нет прав ─────► 403 Forbidden
       │
       ▼
┌─────────────────┐
│ Выполнение      │
│ запроса к БД    │
└─────────────────┘
```

### Валидация данных

```typescript
// Пример валидации в API
if (!studentId || !subjectId || !value || !date) {
  return NextResponse.json(
    { error: "Заполните все обязательные поля" },
    { status: 400 }
  );
}

// Проверка на дубликат
const existing = await db.query.grades.findFirst({
  where: and(
    eq(grades.studentId, studentId),
    eq(grades.subjectId, subjectId),
    eq(grades.date, date)
  ),
});

if (existing) {
  return NextResponse.json(
    { error: "Оценка уже существует" },
    { status: 409 }
  );
}
```

## Производительность

### Оптимизация запросов

```typescript
// ❌ ПЛОХО: N+1 запрос
for (const student of students) {
  const grades = await db.query.grades.findMany({
    where: eq(grades.studentId, student.id),
  });
}

// ✅ ХОРОШО: Один запрос с join
const result = await db
  .select({
    studentName: user.fullName,
    gradeValue: grades.value,
    subjectName: subjects.name,
  })
  .from(grades)
  .leftJoin(user, eq(grades.studentId, user.id))
  .leftJoin(subjects, eq(grades.subjectId, subjects.id))
  .where(inArray(grades.studentId, studentIds));
```

### Индексы

```typescript
// В схеме БД
export const grades = sqliteTable("grades", {
  // ...
}, (table) => [
  index("grades_studentId_idx").on(table.studentId),
  index("grades_subjectId_idx").on(table.subjectId),
  index("grades_date_idx").on(table.date),
]);
```

## Масштабирование

### Микросервисная архитектура (будущее)

```
┌─────────────┐
│   Frontend  │
│   (Next.js) │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│           API Gateway                    │
└───┬──────────┬──────────┬───────────────┘
    │          │          │
    ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌──────────┐
│ Students│ │ Grades  │ │ Homework │
│ Service │ │ Service │ │ Service  │
└─────────┘ └─────────┘ └──────────┘
```

### Кэширование

```typescript
// Кэширование данных ученика
const studentData = await cache(
  async () => {
    const response = await fetch(`/api/student/${id}`);
    return await response.json();
  },
  ['student', id]
)();
```
