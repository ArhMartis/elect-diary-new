# Исправление ошибок дневника и предметов

## ✅ Исправленные ошибки

### 1. `studentsWithoutGroup is not defined`

**Файл:** `src/app/admin/groups/page.tsx`

**Ошибка:**
```typescript
{studentsWithoutGroup.length > 0 && (
```

**Решение:**
Добавлена переменная перед `return`:
```typescript
const studentsWithoutGroup = students.filter((s) => !s.groupId);
```

### 2. Модальное окно выбора предметов

**Файл:** `src/app/admin/subjects/page.tsx`

**Что добавлено:**
- ✅ При клике на номер класса открывается модальное окно
- ✅ Список всех предметов с чекбоксами
- ✅ Кнопки "Сохранить" и "Отмена"
- ✅ Счётчик выбранных предметов

**Пример:**
```
┌──────────────────────────────────────────┐
│ Выбор предметов для 7 класса        ✕   │
│ Классы: 7-А                              │
├──────────────────────────────────────────┤
│ ☑ Математика                             │
│ ☑ Русский язык                           │
│ ☐ Физика                                 │
│ ☑ История                                │
│ ...                                      │
├──────────────────────────────────────────┤
│ [Сохранить (5)]     [Отмена]             │
└──────────────────────────────────────────┘
```

### 3. Загрузка реальных данных из БД в дневнике

**Файл:** `src/app/diary/page.tsx`

**Было (заглушка):**
```typescript
const mockClasses = [
  { id: 1, name: "5-А" },
  { id: 2, name: "5-Б" },
  // ... 6 классов
];
setClasses(mockClasses);
```

**Стало (реальные данные):**
```typescript
// Загрузка через API
const response = await fetch("/api/classes");
const data = await response.json();
setClasses(data); // Только то, что есть в БД
```

### 4. Созданы API эндпоинты

**Файл:** `src/app/api/classes/route.ts`
```typescript
// GET /api/classes
// SELECT * FROM groups
```

**Файл:** `src/app/api/students/route.ts`
```typescript
// GET /api/students?classId={id}
// SELECT * FROM users WHERE groupId = ? AND role = 'student'
```

## 📊 Как это работает

### Загрузка классов

```typescript
useEffect(() => {
  const loadClasses = async () => {
    const response = await fetch("/api/classes");
    const data = await response.json();
    setClasses(data); // Только 5 классов из БД
    setIsLoading(false);
  };
  loadClasses();
}, []);
```

### Загрузка учеников

```typescript
useEffect(() => {
  const loadStudents = async () => {
    if (!selectedClassId) return;
    
    const response = await fetch(
      `/api/students?classId=${selectedClassId}`
    );
    const data = await response.json();
    setStudents(data); // Только ученики выбранного класса
  };
  loadStudents();
}, [selectedClassId]);
```

## 🔍 Проверка данных

### В дневнике

**Если классы не загрузились:**
```tsx
{classes.length === 0 && !isLoading && (
  <p className="text-xs text-red-500 mt-1">
    Классы не загружены. Проверите БД.
  </p>
)}
```

**Если в классе нет учеников:**
```tsx
{selectedClassId && students.length === 0 && (
  <p className="text-xs text-orange-500 mt-1">
    В этом классе нет учеников
  </p>
)}
```

## 🧪 Тестирование

### 1. Проверка классов из БД
```
1. Открыть /diary
2. Открыть выпадающий список "Класс"
3. Должны быть только 5 классов из БД
   (5-А, 6-А, 7-А, 8-А, 9-А)
```

### 2. Проверка учеников
```
1. Выбрать класс (например, 7-А)
2. Открыть выпадающий список "Ученик"
3. Должны быть только ученики 7-А класса
```

### 3. Проверка модального окна предметов
```
1. /admin/subjects
2. Нажать на кнопку "7" (или другой номер)
3. Открывается модальное окно
4. Выбрать предметы чекбоксами
5. Нажать "Сохранить"
```

## 📁 Обновлённые файлы

1. ✅ `src/app/admin/groups/page.tsx` - исправлена ошибка
2. ✅ `src/app/admin/subjects/page.tsx` - модальное окно
3. ✅ `src/app/diary/page.tsx` - загрузка из БД
4. ✅ `src/app/api/classes/route.ts` - API классов
5. ✅ `src/app/api/students/route.ts` - API учеников

## 💡 Примечания

1. **Все данные из БД**
   - Классы: `groups`
   - Ученики: `users WHERE groupId = ? AND role = 'student'`

2. **API заглушки удалены**
   - Теперь реальные запросы к БД

3. **Обработка ошибок**
   - Если API не работает - показывается сообщение
   - Если нет учеников - показывается предупреждение

4. **Модальное окно предметов**
   - Открывается для каждого номера класса
   - Показывает все предметы для выбора
   - Считает количество выбранных

## 🚀 Следующие шаги

1. Реализовать сохранение выбранных предметов в БД
2. Создать таблицу `class_subjects` для связи
3. Использовать предметы для расписания
