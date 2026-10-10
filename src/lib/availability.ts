import 'server-only';
import { DateTime } from 'luxon';
import { prisma } from '@/lib/prisma';
import { BookingStatus, Prisma } from '../../generated/prisma';
import { dateOnlyToDb, dbToDateOnly, salonDay, SLOT_STEP_MIN } from '@/lib/time';

type Db = typeof prisma | Prisma.TransactionClient;

export interface Interval {
  startAt: string; // ISO
  endAt: string;   // ISO
}

export interface Slot extends Interval {
  employeeIds: string[]; // specjaliści wolni w tym terminie
}

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

export const PUBLISHED = { publishedAt: { not: null } } satisfies Prisma.ScheduleMonthWhereInput;

/**
 * Wolne terminy rozpoczęcia usługi w danym dniu.
 * Opublikowany grafik miesięczny − wyjątki (urlopy) − aktywne rezerwacje − `busy` (np. inne pozycje koszyka tego klienta).
 * `employeeId` = null oznacza dowolnego specjalistę wykonującego usługę.
 */
export async function getFreeSlots(
  db: Db,
  { serviceId, date, employeeId, busy = [] }: { serviceId: string; date: string; employeeId: string | null; busy?: Interval[] },
): Promise<Slot[]> {
  const service = await db.service.findUnique({ where: { id: serviceId }, include: { employees: true } });
  if (!service) return [];

  const candidates = service.employees
    .map((e) => e.employeeId)
    .filter((id) => !employeeId || id === employeeId);
  if (candidates.length === 0) return [];

  const day = salonDay(date);
  const [shifts, exceptions, bookings] = await Promise.all([
    // szkic grafiku nie daje terminów – liczy się tylko opublikowany miesiąc
    db.shift.findMany({ where: { employeeId: { in: candidates }, date: dateOnlyToDb(date), scheduleMonth: PUBLISHED } }),
    db.scheduleException.findMany({ where: { employeeId: { in: candidates }, date: dateOnlyToDb(date) } }),
    db.booking.findMany({
      where: {
        employeeId: { in: candidates },
        status: BookingStatus.CONFIRMED,
        startAt: { lt: day.plus({ days: 1 }).toJSDate() },
        endAt: { gt: day.toJSDate() },
      },
    }),
  ]);

  const now = Date.now();
  const busyMs = busy.map((b) => [Date.parse(b.startAt), Date.parse(b.endAt)]);
  const slots = new Map<number, Slot>();

  for (const window of shifts) {
    const employeeExceptions = exceptions.filter((e) => e.employeeId === window.employeeId);
    if (employeeExceptions.some((e) => e.startMinute === null)) continue; // cały dzień wolny

    const employeeBookings = bookings.filter((b) => b.employeeId === window.employeeId);

    for (let minute = window.startMinute; minute + service.durationMin <= window.endMinute; minute += SLOT_STEP_MIN) {
      const end = minute + service.durationMin;
      // set() zamiast plus(), żeby godziny zgadzały się także w dniu zmiany czasu
      const start = day.set({ hour: Math.floor(minute / 60), minute: minute % 60 });
      const startMs = start.toMillis();
      const endMs = start.plus({ minutes: service.durationMin }).toMillis();

      if (startMs <= now) continue;
      if (employeeExceptions.some((e) => overlaps(minute, end, e.startMinute!, e.endMinute!))) continue;
      if (employeeBookings.some((b) => overlaps(startMs, endMs, b.startAt.getTime(), b.endAt.getTime()))) continue;
      if (busyMs.some(([bStart, bEnd]) => overlaps(startMs, endMs, bStart, bEnd))) continue;

      const slot = slots.get(startMs) ?? {
        startAt: start.toUTC().toISO()!,
        endAt: DateTime.fromMillis(endMs).toUTC().toISO()!,
        employeeIds: [],
      };
      if (!slot.employeeIds.includes(window.employeeId)) slot.employeeIds.push(window.employeeId);
      slots.set(startMs, slot);
    }
  }

  return [...slots.entries()].sort(([a], [b]) => a - b).map(([, slot]) => slot);
}

/** Pierwszy dzień (od `fromDate` włącznie) z wolnym terminem. Sprawdzamy tylko dni ze zmianami w opublikowanym grafiku. */
export async function findNextFreeDate(
  db: Db,
  params: { serviceId: string; fromDate: string; employeeId: string | null; busy?: Interval[] },
): Promise<string | null> {
  const shiftDays = await db.shift.findMany({
    where: {
      date: { gte: dateOnlyToDb(params.fromDate) },
      scheduleMonth: PUBLISHED,
      employee: { services: { some: { serviceId: params.serviceId } } },
      ...(params.employeeId ? { employeeId: params.employeeId } : {}),
    },
    select: { date: true },
    distinct: ['date'],
    orderBy: { date: 'asc' },
  });

  for (const { date } of shiftDays) {
    const day = dbToDateOnly(date);
    const slots = await getFreeSlots(db, { ...params, date: day });
    if (slots.length > 0) return day;
  }
  return null;
}
