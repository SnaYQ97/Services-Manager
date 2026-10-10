'use server'

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireManager } from '@/lib/session';
import { dateOnlyToDb, salonDay, timeToMinutes } from '@/lib/time';
import { BookingStatus } from '../../generated/prisma';

export async function getCalendarDay(date: string) {
  const day = salonDay(date);

  // w kalendarzu pokazujemy specjalistów: osoby z przypisanymi usługami lub grafikiem
  const employees = await prisma.employee.findMany({
    where: { OR: [{ services: { some: {} } }, { workingHours: { some: {} } }] },
    orderBy: { name: 'asc' },
    include: {
      workingHours: { where: { weekday: day.weekday }, orderBy: { startMinute: 'asc' } },
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
    workingHours: employee.workingHours.map(({ startMinute, endMinute }) => ({ startMinute, endMinute })),
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

export type ExceptionResult = { ok: true; conflictingBookings: number } | { ok: false; error: string };

export async function addScheduleException(input: ExceptionInput): Promise<ExceptionResult> {
  await requireManager();

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
  return { ok: true, conflictingBookings };
}

export async function deleteScheduleException(id: string) {
  await requireManager();
  await prisma.scheduleException.delete({ where: { id } });
  revalidatePath('/calendar');
}
