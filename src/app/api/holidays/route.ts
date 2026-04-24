import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { holidays } from "@/db/schema/diary-extra";
import { eq } from "drizzle-orm";

/**
 * API: GET /api/holidays
 * 
 * Получение дат каникул
 * 
 * Query параметры:
 * - academicYear?: string - учебный год (напр. "2025/2026")
 * 
 * @returns {
 *   autumn: string,
 *   winter: string,
 *   spring: string,
 *   summer: string
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const academicYear = searchParams.get("academicYear") || "2025/2026";

    const holidayData = await db.query.holidays.findFirst({
      where: eq(holidays.academicYear, academicYear),
    });

    if (!holidayData) {
      return NextResponse.json({
        autumn: "",
        winter: "",
        spring: "",
        summer: "",
      });
    }

    // Форматируем даты для отображения
    const formatPeriod = (start?: string | null, end?: string | null) => {
      if (!start || !end) return "";
      // Преобразуем формат YYYY-MM-DD в DD.MM.YYYY
      const formatDate = (dateStr: string) => {
        const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          return `${match[3]}.${match[2]}.${match[1]}`;
        }
        return dateStr;
      };
      return `${formatDate(start)} - ${formatDate(end)}`;
    };

    return NextResponse.json({
      autumn: formatPeriod(holidayData.autumnStart, holidayData.autumnEnd),
      winter: formatPeriod(holidayData.winterStart, holidayData.winterEnd),
      spring: formatPeriod(holidayData.springStart, holidayData.springEnd),
      summer: formatPeriod(holidayData.summerStart, holidayData.summerEnd),
    });
  } catch (error) {
    console.error("Ошибка при получении дат каникул:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * API: POST /api/holidays
 * 
 * Сохранение дат каникул
 * 
 * Body:
 * - academicYear: string
 * - autumn: string (формат: "DD.MM.YYYY - DD.MM.YYYY")
 * - winter: string
 * - spring: string
 * - summer: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { academicYear, autumn, winter, spring, summer } = body;

    if (!academicYear) {
      return NextResponse.json({ error: "Учебный год обязателен" }, { status: 400 });
    }

    // Парсим даты из формата "DD.MM.YYYY - DD.MM.YYYY" в "YYYY-MM-DD"
    const parseDates = (dateString: string) => {
      if (!dateString) return { start: null, end: null };
      const match = dateString.match(/(\d{2})\.(\d{2})\.(\d{4})\s+-\s+(\d{2})\.(\d{2})\.(\d{4})/);
      if (match) {
        return {
          start: `${match[3]}-${match[2]}-${match[1]}`,
          end: `${match[6]}-${match[5]}-${match[4]}`,
        };
      }
      return { start: null, end: null };
    };

    const autumnDates = parseDates(autumn);
    const winterDates = parseDates(winter);
    const springDates = parseDates(spring);
    const summerDates = parseDates(summer);

    // Проверяем существующую запись
    const existing = await db.query.holidays.findFirst({
      where: eq(holidays.academicYear, academicYear),
    });

    if (existing) {
      // Обновляем существующую запись
      await db
        .update(holidays)
        .set({
          autumnStart: autumnDates.start,
          autumnEnd: autumnDates.end,
          winterStart: winterDates.start,
          winterEnd: winterDates.end,
          springStart: springDates.start,
          springEnd: springDates.end,
          summerStart: summerDates.start,
          summerEnd: summerDates.end,
        })
        .where(eq(holidays.id, existing.id));
    } else {
      // Создаем новую запись
      await db.insert(holidays).values({
        academicYear,
        autumnStart: autumnDates.start,
        autumnEnd: autumnDates.end,
        winterStart: winterDates.start,
        winterEnd: winterDates.end,
        springStart: springDates.start,
        springEnd: springDates.end,
        summerStart: summerDates.start,
        summerEnd: summerDates.end,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при сохранении дат каникул:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
