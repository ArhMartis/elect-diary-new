# Исправление ошибки 404 при переходе в дневник

## Проблема
При переходе по ссылке `/diary` или `/student/diary` появлялась ошибка 404.

## Решение

### 1. Создана страница по умолчанию для `/student/diary`
**Файл:** `src/app/student/diary/page.tsx`

```typescript
// Перенаправляет на страницу выбора ученика
redirect("/select-student");
```

### 2. Обновлён редирект с `/diary`
**Файл:** `src/app/diary/page.tsx`

Теперь перенаправляет на `/select-student`:
```typescript
redirect("/select-student");
```

### 3. Обновлены ссылки в админ-панели
**Файл:** `src/app/admin/page.tsx`

**Кнопка "Дневник" в меню:**
```tsx
// Было:
href="/diary"

// Стало:
href="/select-student"
```

**Кнопка "Дневник" для учеников:**
```tsx
// Было:
href={`/admin/student/${u.id}`}

// Стало:
href={`/student/diary/${u.id}`}
```

## Новая структура маршрутов

```
/diary                          → Редирект на /select-student
/student/diary                  → Редирект на /select-student
/student/diary/[id]             → Дневник конкретного ученика
/select-student                 → Страница выбора ученика
/admin                          → Админ-панель
  └── Кнопка "Дневник"          → /select-student
  └── Кнопка "Дневник" (ученик) → /student/diary/{id}
```

## Проверка работы

### 1. Переход из админ-панели
```
1. Открыть /admin
2. Нажать кнопку "Дневник" в меню
3. Должна открыться страница /select-student
```

### 2. Переход к дневнику ученика
```
1. В админ-панели в списке пользователей
2. Найти ученика
3. Нажать кнопку "Дневник"
4. Должен открыться /student/diary/{id}
```

### 3. Прямой переход
```
1. Открыть /diary
2. Должна открыться /select-student

1. Открыть /student/diary
2. Должна открыться /select-student

1. Открыть /student/diary/student-1
2. Должен открыться дневник ученика
```

## Испытанные URL

✅ `/diary` → `/select-student`
✅ `/student/diary` → `/select-student`
✅ `/student/diary/{id}` → дневник ученика
✅ `/select-student` → страница выбора
✅ `/admin` → админ-панель

## Файлы

1. ✅ `src/app/diary/page.tsx` - редирект на select-student
2. ✅ `src/app/student/diary/page.tsx` - редирект на select-student
3. ✅ `src/app/student/diary/[id]/page.tsx` - дневник ученика
4. ✅ `src/app/select-student/page.tsx` - страница выбора
5. ✅ `src/app/admin/page.tsx` - обновлены ссылки

## Примечание

Если у вас есть старые закладки или ссылки на `/admin/student/{id}`, они всё ещё работают, так как эта страница существует. Рекомендуется использовать новые ссылки `/student/diary/{id}`.
