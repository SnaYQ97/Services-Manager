'use server'

import { revalidatePath } from 'next/cache';
import { DateTime } from 'luxon';
import { prisma } from '@/lib/prisma';
import { plural } from '@/lib/format';
import { getCurrentEmployee, requireManager } from '@/lib/session';
import {
  dateOnlyToDb, dbToDateOnly, formatTime, MONTH_RE, monthBounds, SALON_TZ, salonDay, timeToMinutes,
} from '@/lib/time';
import { BookingStatus, Role } from '../../generated/prisma';

export type ScheduleResult = { ok: true; message: string | null; warning?: string | null } | { ok: false; error: string };

const revalidateSchedule = () => {
  revalidatePath('/schedule');
  revalidatePath('/calendar');
};

const minuteOfDay = (date: Date) => {
  const t = DateTime.fromJSDate(date).setZone(SALON_TZ);
  return t.hour * 60 + t.minute;
};

/** Grafik miesiąca do siatki. Kierownik widzi też szkic; pracownik tylko opublikowany grafik. */
export async function getScheduleMonth(month: string) {
  const viewer = await getCurrentEmployee();
  if (!viewer) throw new Error('Sesja wygasła – zaloguj się ponownie.');
  if (!MONTH_RE.test(month)) throw new Error('Nieprawidłowy miesiąc.');

  const { first, next } = monthBounds(month);
  const range = { gte: dateOnlyToDb(first.toISODate()!), lt: dateOnlyToDb(next.toISODate()!) };
  const canEdit = viewer.role === Role.MANAGER;

  const [scheduleMonth, employees] = await Promise.all([
    prisma.scheduleMonth.findUnique({ where: { month } }),
    prisma.employee.findMany({
      // specjaliści: mają usługi, szablon albo zmiany w tym miesiącu
      where: { OR: [{ services: { some: {} } }, { workingHours: { some: {} } }, { shifts: { some: { date: range } } }] },
      orderBy: { name: 'asc' },
      include: {
        workingHours: true,
        shifts: { where: { date: range }, orderBy: { date: 'asc' } },
        scheduleExceptions: { where: { date: range }, orderBy: { date: 'asc' } },
        bookings: {
          where: { status: BookingStatus.CONFIRMED, startAt: { gte: first.toJSDate(), lt: next.toJSDate() } },
          orderBy: { startAt: 'asc' },
          include: { service: { select: { name: true } } },
        },
      },
    }),
  ]);

  const visible = canEdit || !!scheduleMonth?.publishedAt;

  return {
    month,
    canEdit,
    visible,
    publishedAt: scheduleMonth?.publishedAt?.toISOString() ?? null,
    employees: employees.map((e) => ({
      id: e.id,
      name: e.name,
      template: e.workingHours.map(({ weekday, startMinute, endMinute }) => ({ weekday, startMinute, endMinute })),
      shifts: visible ? e.shifts.map(({ date, startMinute, endMinute }) => ({ date: dbToDateOnly(date), startMinute, endMinute })) : [],
      absences: e.scheduleExceptions.map(({ id, date, startMinute, endMinute, reason }) => ({ id, date: dbToDateOnly(date), startMinute, endMinute, reason })),
      // wizyty tylko dla kierownika – do ostrzeżeń przy zmianie godzin
      bookings: canEdit
        ? e.bookings.map((b) => ({
            id: b.id,
            date: DateTime.fromJSDate(b.startAt).setZone(SALON_TZ).toISODate()!,
            time: `${formatTime(b.startAt)}–${formatTime(b.endAt)}`,
            serviceName: b.service.name,
            clientName: b.clientName,
          }))
        : [],
    })),
  };
}

export type ScheduleMonthData = Awaited<ReturnType<typeof getScheduleMonth>>;

/** Wypełnia puste dni miesiąca zmianami z szablonu tygodniowego (pomija całodniowe nieobecności) */
export async function fillMonthFromTemplate(month: string): Promise<ScheduleResult> {
  await requireManager();
  if (!MONTH_RE.test(month)) return { ok: false, error: 'Nieprawidłowy miesiąc.' };

  const { first, next, days } = monthBounds(month);
  const scheduleMonth = await prisma.scheduleMonth.upsert({ where: { month }, update: {}, create: { month } });
  const employees = await prisma.employee.findMany({
    where: { workingHours: { some: {} } },
    include: {
      workingHours: true,
      scheduleExceptions: {
        where: { startMinute: null, date: { gte: dateOnlyToDb(first.toISODate()!), lt: dateOnlyToDb(next.toISODate()!) } },
      },
    },
  });

  const data = employees.flatMap((employee) => {
    const daysOff = new Set(employee.scheduleExceptions.map((ex) => dbToDateOnly(ex.date)));
    return Array.from({ length: days }, (_, i) => first.plus({ days: i })).flatMap((day) => {
      const window = employee.workingHours.find((w) => w.weekday === day.weekday);
      const date = day.toISODate()!;
      if (!window || daysOff.has(date)) return [];
      return [{
        scheduleMonthId: scheduleMonth.id,
        employeeId: employee.id,
        date: dateOnlyToDb(date),
        startMinute: window.startMinute,
        endMinute: window.endMinute,
      }];
    });
  });

  // dni już ustawione ręcznie zostają bez zmian
  const { count } = await prisma.shift.createMany({ data, skipDuplicates: true });
  revalidateSchedule();
  return {
    ok: true,
    message: count > 0
      ? `Dodano ${count} ${plural(count, ['zmianę', 'zmiany', 'zmian'])} z szablonu.`
      : 'Wszystkie dni z szablonu są już w grafiku.',
  };
}

export interface ShiftInput {
  employeeId: string;
  date: string;        // yyyy-MM-dd
  working: boolean;
  startTime?: string;  // HH:mm
  endTime?: string;
}

/** Ustawia albo usuwa zmianę jednego pracownika w jednym dniu */
export async function saveShift(input: ShiftInput): Promise<ScheduleResult> {
  await requireManager();
  const day = salonDay(input.date);
  if (!day.isValid) return { ok: false, error: 'Nieprawidłowa data.' };

  const startMinute = input.working ? timeToMinutes(input.startTime ?? '') : 0;
  const endMinute = input.working ? timeToMinutes(input.endTime ?? '') : 0;
  if (input.working && !(startMinute >= 0 && startMinute < endMinute && endMinute <= 24 * 60)) {
    return { ok: false, error: 'Godzina „od” musi być wcześniejsza niż „do”.' };
  }

  const date = dateOnlyToDb(input.date);
  if (input.working) {
    const month = input.date.slice(0, 7);
    const scheduleMonth = await prisma.scheduleMonth.upsert({ where: { month }, update: {}, create: { month } });
    await prisma.shift.upsert({
      where: { employeeId_date: { employeeId: input.employeeId, date } },
      update: { startMinute, endMinute, scheduleMonthId: scheduleMonth.id },
      create: { employeeId: input.employeeId, date, startMinute, endMinute, scheduleMonthId: scheduleMonth.id },
    });
  } else {
    await prisma.shift.deleteMany({ where: { employeeId: input.employeeId, date } });
  }

  // umówione wizyty nie znikają – kierownik dostaje informację, które trzeba przełożyć
  const bookings = await prisma.booking.findMany({
    where: {
      employeeId: input.employeeId,
      status: BookingStatus.CONFIRMED,
      startAt: { gte: day.toJSDate(), lt: day.plus({ days: 1 }).toJSDate() },
    },
  });
  const outside = bookings.filter((b) => !input.working || minuteOfDay(b.startAt) < startMinute || minuteOfDay(b.endAt) > endMinute).length;

  revalidateSchedule();
  return {
    ok: true,
    message: input.working ? 'Zapisano zmianę.' : 'Dzień ustawiony jako wolny.',
    warning: outside > 0
      ? `${outside} ${plural(outside, ['wizyta wypada', 'wizyty wypadają', 'wizyt wypada'])} poza godzinami pracy – trzeba je przełożyć.`
      : null,
  };
}

export async function publishMonth(month: string): Promise<ScheduleResult> {
  await requireManager();
  if (!MONTH_RE.test(month)) return { ok: false, error: 'Nieprawidłowy miesiąc.' };

  const shifts = await prisma.shift.count({ where: { scheduleMonth: { month } } });
  if (shifts === 0) return { ok: false, error: 'Grafik jest pusty – wypełnij go z szablonu albo ustaw zmiany.' };

  await prisma.scheduleMonth.update({ where: { month }, data: { publishedAt: new Date() } });
  revalidateSchedule();
  return { ok: true, message: 'Grafik opublikowany – terminy są dostępne do rezerwacji.' };
}

export async function unpublishMonth(month: string): Promise<ScheduleResult> {
  await requireManager();
  if (!MONTH_RE.test(month)) return { ok: false, error: 'Nieprawidłowy miesiąc.' };

  await prisma.scheduleMonth.update({ where: { month }, data: { publishedAt: null } });
  const { first, next } = monthBounds(month);
  const now = new Date();
  const futureBookings = await prisma.booking.count({
    where: {
      status: BookingStatus.CONFIRMED,
      startAt: { gte: first.toJSDate() > now ? first.toJSDate() : now, lt: next.toJSDate() },
    },
  });

  revalidateSchedule();
  return {
    ok: true,
    message: 'Grafik wrócił do szkicu – nowe terminy w tym miesiącu nie są proponowane.',
    warning: futureBookings > 0
      ? `${futureBookings} ${plural(futureBookings, ['umówiona wizyta zostaje', 'umówione wizyty zostają', 'umówionych wizyt zostaje'])} w kalendarzu.`
      : null,
  };
}

/** Czy grafik miesiąca jest opublikowany (baner w kalendarzu) */
export async function isMonthPublished(month: string) {
  const scheduleMonth = await prisma.scheduleMonth.findUnique({ where: { month } });
  return !!scheduleMonth?.publishedAt;
}
