'use server'

import { prisma } from '@/lib/prisma';
import { findNextFreeDate, getFreeSlots } from '@/lib/availability';
import { salonDay, salonToday } from '@/lib/time';

// Publiczne – strona /guest działa bez logowania, więc tylko odczyt wolnych terminów i walidacja wejścia
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isValidDate = (date: string) => DATE_RE.test(date) && salonDay(date).isValid;

export async function getGuestSlots({ serviceId, date, employeeId }: { serviceId: string; date: string; employeeId: string | null }) {
  if (!isValidDate(date) || date < salonToday()) return [];
  return getFreeSlots(prisma, { serviceId, date, employeeId });
}

export async function getGuestNextFreeDate({ serviceId, fromDate, employeeId }: { serviceId: string; fromDate: string; employeeId: string | null }) {
  if (!isValidDate(fromDate)) return null;
  const today = salonToday();
  return findNextFreeDate(prisma, { serviceId, fromDate: fromDate < today ? today : fromDate, employeeId });
}
