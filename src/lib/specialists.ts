import 'server-only';
import { prisma } from '@/lib/prisma';
import { dateOnlyToDb, dbToDateOnly, salonDay, salonToday } from '@/lib/time';

const ABSENCE_HORIZON_DAYS = 14;

/** Pracownicy z grafikiem i nieobecnościami na najbliższe 2 tygodnie – do kart po najechaniu na awatar */
export async function getSpecialistsOverview() {
  const today = salonToday();
  const horizon = salonDay(today).plus({ days: ABSENCE_HORIZON_DAYS }).toISODate()!;

  const employees = await prisma.employee.findMany({
    orderBy: { name: 'asc' },
    include: {
      workingHours: true,
      scheduleExceptions: {
        where: { date: { gte: dateOnlyToDb(today), lt: dateOnlyToDb(horizon) } },
        orderBy: { date: 'asc' },
      },
    },
  });

  return employees.map((employee) => ({
    id: employee.id,
    name: employee.name,
    workingHours: employee.workingHours.map(({ weekday, startMinute, endMinute }) => ({ weekday, startMinute, endMinute })),
    absences: employee.scheduleExceptions.map((ex) => ({
      id: ex.id,
      date: dbToDateOnly(ex.date),
      startMinute: ex.startMinute,
      endMinute: ex.endMinute,
      reason: ex.reason,
    })),
  }));
}

export type SpecialistOverview = Awaited<ReturnType<typeof getSpecialistsOverview>>[number];
