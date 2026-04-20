# Быстрый старт - Модуль "Дневник учащегося"

## 📋 Чеклист интеграции

### ✅ Шаг 1: Создание таблиц БД

```bash
# Генерация миграций
npm run db:generate

# Применение миграций
npm run db:push

# Проверка в Drizzle Studio
npm run db:studio
```

### ✅ Шаг 2: Проверка API

```bash
# 1. Данные ученика
curl http://localhost:3000/api/student/student-123

# 2. Оценки
curl "http://localhost:3000/api/grades?studentId=student-123"

# 3. Домашние задания
curl "http://localhost:3000/api/homework?groupId=1"

# 4. Добавить оценку (POST)
curl -X POST http://localhost:3000/api/grades \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-123",
    "subjectId": 1,
    "teacherId": "teacher-456",
    "value": "8",
    "date": "2025-09-10"
  }'
```

### ✅ Шаг 3: Тестирование страницы

1. Запустить сервер:
```bash
npm run dev
```

2. Открыть в браузере:
```
http://localhost:3000/student/diary
```

3. Проверить:
   - [ ] Отображение титульного листа
   - [ ] Переключение между секциями
   - [ ] Редактирование полей
   - [ ] Кнопку "Сохранить" (проверить консоль)
   - [ ] Кнопку "Печать"

### ✅ Шаг 4: Замена заглушек на API

**Файл:** `src/app/student/diary/page.tsx`

**Пример замены:**

```typescript
// БЫЛО (заглушка):
async function saveGrade(gradeData: {...}) {
  console.log("[API] POST /api/grades", gradeData);
  console.log("[DB] INSERT INTO grades ...");
  return { success: true };
}

// СТАЛО (реальный вызов):
async function saveGrade(gradeData: {...}) {
  const response = await fetch('/api/grades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gradeData),
  });
  
  if (!response.ok) {
    throw new Error('Ошибка при сохранении оценки');
  }
  
  return await response.json();
}
```

**Найти и заменить:**
- [ ] `loadStudentData()` - строка ~270
- [ ] `loadSubjects()` - строка ~285
- [ ] `loadSchedule()` - строка ~300
- [ ] `loadGrades()` - строка ~315
- [ ] `loadHomework()` - строка ~330
- [ ] `saveGrade()` - строка ~345
- [ ] `saveHomework()` - строка ~365
- [ ] `saveAbsence()` - строка ~385
- [ ] `saveTeacherComment()` - строка ~405
- [ ] `saveSchoolContacts()` - строка ~425

### ✅ Шаг 5: Настройка авторизации

**Добавить получение текущего пользователя:**

```typescript
// В начале компонента StudentDiaryPage
const [currentUserId, setCurrentUserId] = useState<string>("");

useEffect(() => {
  const getSession = async () => {
    // TODO: Получить из сессии
    // const session = await auth.api.getSession({ headers: await headers() });
    // setCurrentUserId(session?.user.id || "");
    
    // Временно:
    setCurrentUserId("student-123");
  };
  
  getSession();
}, []);
```

---

## 🔍 Поиск и устранение проблем

### Ошибка: "Таблица не существует"

**Решение:**
```bash
# Проверить, создана ли таблица
npm run db:studio

# Если нет - создать миграцию
npm run db:generate
npm run db:push
```

### Ошибка: "CORS"

**Решение:** Добавить в `next.config.ts`:
```typescript
const nextConfig = {
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
        { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
      ]
    }
  ]
};
```

### Ошибка: "Нет данных в localStorage"

**Решение:** Данные загружаются из API при первом запуске. Проверить консоль на наличие ошибок API.

---

## 📊 Структура данных

### Данные ученика
```typescript
{
  id: string,              // UUID из users.id
  fullName: string,        // ФИО полностью
  surname: string,         // Фамилия
  name: string,            // Имя
  classId: number,         // ID класса (groups.id)
  className: string,       // Название класса (напр. "7А")
  schoolName: string,      // Название школы
  schoolAddress: string,   // Адрес
  schoolPhone: string,     // Телефон
  academicYear: string     // "2025/2026"
}
```

### Оценка
```typescript
{
  id?: number,             // ID записи (для обновления)
  studentId: string,       // users.id (ученик)
  subjectId: number,       // subjects.id
  teacherId: string,       // users.id (учитель)
  value: string,           // "1"-"10", "Н"
  date: string,            // "YYYY-MM-DD"
  comment?: string,        // Комментарий
  academicPeriodId?: number // academicPeriods.id
}
```

### Домашнее задание
```typescript
{
  id?: number,
  teacherId: string,       // users.id (учитель)
  groupId: number,         // groups.id (класс)
  subjectId: number,       // subjects.id
  lessonDate: string,      // "YYYY-MM-DD"
  description: string,     // Текст задания
  dueDate?: string         // "YYYY-MM-DD" (срок)
}
```

### Пропуски
```typescript
{
  studentId: string,
  month: string,           // "Сентябрь", "Октябрь" и т.д.
  academicYear: string,    // "2025/2026"
  total: number,           // Всего пропусков
  unexcused: number        // По неуважительной причине
}
```

---

## 🎯 Ключевые файлы для редактирования

### 1. Основная страница
**Файл:** `src/app/student/diary/page.tsx`
- Заменить заглушки на fetch()
- Настроить получение текущего пользователя
- Добавить обработку ошибок

### 2. API эндпоинты
**Папка:** `src/app/api/`
- При необходимости добавить авторизацию
- Добавить валидацию данных
- Настроить логирование

### 3. Схема БД
**Файл:** `src/db/schema/diary-extra.ts`
- Проверить соответствие требованиям
- Добавить индексы для производительности

---

## 📝 Примеры кода

### Получение данных ученика с авторизацией

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверка авторизации
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    // Проверка прав доступа
    if (session.user.id !== id && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Нет доступа" },
        { status: 403 }
      );
    }
    
    // Получение данных
    const student = await db.query.user.findFirst({
      where: eq(user.id, id),
      with: { group: true },
    });
    
    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json(
      { error: "Внутренняя ошибка" },
      { status: 500 }
    );
  }
}
```

### Массовое сохранение оценок

```typescript
async function saveAllGrades(grades: GradeRecord[]) {
  const response = await fetch('/api/final-grades', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: currentUserId,
      academicYear: data.academicYear,
      grades: grades.map(g => ({
        subjectId: g.subjectId,
        q1: g.q1,
        q2: g.q2,
        q3: g.q3,
        q4: g.q4,
        year: g.year,
        exam: g.exam,
        final: g.final,
      }))
    })
  });
  
  return await response.json();
}
```

---

## 📞 Поддержка

**Документация:**
- `docs/DIARY_MODULE.md` - полное руководство
- `docs/DIARY_FILES.md` - список файлов
- `QUICKSTART.md` - этот файл

**Вопросы:**
- Проверить логи в консоли браузера
- Проверить логи сервера
- Использовать Drizzle Studio для проверки БД
