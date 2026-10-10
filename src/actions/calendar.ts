'use server'

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireManager } from '@/lib/session';
import { plural } from '@/lib/format';
import { dateOnlyToDb, salonDay, timeToMinutes } from '@/lib/time';
import { PUBLISHED } from '@/lib/availability';
import { BookingStatus } from '../../generated/prisma';

export async function getCalendarDay(date: string) {
  const day = salonDay(date);

  // w kalendarzu pokazujemy specjalistów: osoby z przypisanymi usługami lub grafikiem
  const employees = await prisma.employee.findMany({
    where: { OR: [{ services: { some: {} } }, { workingHours: { some: {} } }] },
    orderBy: { name: 'asc' },
    include: {
      services: { select: { serviceId: true } },
      // godziny pracy z opublikowanego grafiku miesięcznego (szkic nie jest pokazywany)
      shifts: { where: { date: dateOnlyToDb(date), scheduleMonth: PUBLISHED } },
      scheduleExceptions: { where: { date: dateOnlyToDb(date) } },
      bookings: {
        where: {
          status: BookingStatus.CONFIRMED,
          startAt: { lt: day.plus({ days: 1 }).toJSDate() },
          endAt: { gt: day.toJSDate() },
        },
        orderBy: { startAt: 'asc' },
        include: { service: { select: { name: true } } },
      },
    },
  });

  return employees.map((employee) => ({
    id: employee.id,
    name: employee.name,
    serviceIds: employee.services.map(({ serviceId }) => serviceId),
    workingHours: employee.shifts.map(({ startMinute, endMinute }) => ({ startMinute, endMinute })),
    exceptions: employee.scheduleExceptions.map(({ id, startMinute, endMinute, reason }) => ({ id, startMinute, endMinute, reason })),
    bookings: employee.bookings.map((b) => ({
      id: b.id,
      startAt: b.startAt.toISOString(),
      endAt: b.endAt.toISOString(),
      serviceName: b.service.name,
      clientName: b.clientName,
      clientPhone: b.clientPhone,
      note: b.note,
      transactionId: b.transactionId,
    })),
  }));
}

export type CalendarEmployee = Awaited<ReturnType<typeof getCalendarDay>>[number];

export interface ExceptionInput {
  employeeId: string;
  date: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export type ExceptionResult = { ok: true; warning: string | null } | { ok: false; error: string };

export async function addScheduleException(input: ExceptionInput): Promise<ExceptionResult> {
  await requireManager();
  if (!salonDay(input.date).isValid) return { ok: false, error: 'Wybierz datę.' };

  const startMinute = input.allDay ? null : timeToMinutes(input.startTime ?? '');
  const endMinute = input.allDay ? null : timeToMinutes(input.endTime ?? '');
  if (!input.allDay && (Number.isNaN(startMinute) || Number.isNaN(endMinute) || startMinute! >= endMinute!)) {
    return { ok: false, error: 'Godzina „od” musi być wcześniejsza niż „do”.' };
  }

  await prisma.scheduleException.create({
    data: {
      employeeId: input.employeeId,
      date: dateOnlyToDb(input.date),
      startMinute,
      endMinute,
      reason: input.reason?.trim() || null,
    },
  });

  // istniejące rezerwacje nie są usuwane – kierownik dostaje informację, że trzeba je przełożyć
  const day = salonDay(input.date);
  const from = startMinute === null ? day : day.set({ hour: Math.floor(startMinute / 60), minute: startMinute % 60 });
  const to = endMinute === null ? day.plus({ days: 1 }) : day.set({ hour: Math.floor(endMinute / 60), minute: endMinute % 60 });
  const conflictingBookings = await prisma.booking.count({
    where: {
      employeeId: input.employeeId,
      status: BookingStatus.CONFIRMED,
      startAt: { lt: to.toJSDate() },
      endAt: { gt: from.toJSDate() },
    },
  });

  revalidatePath('/calendar');
  return {
    ok: true,
    warning: conflictingBookings > 0
      ? `${conflictingBookings} ${plural(conflictingBookings, ['rezerwacja koliduje', 'rezerwacje kolidują', 'rezerwacji koliduje'])} z tą niedostępnością – trzeba je przełożyć.`
      : null,
  };
}

export async function deleteScheduleException(id: string) {
  await requireManager();
  await prisma.scheduleException.delete({ where: { id } });
  revalidatePath('/calendar');
}
