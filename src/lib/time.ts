import { DateTime } from 'luxon';

// Strefa czasowa salonu – grafik i sloty liczymy zawsze w niej, niezależnie od strefy serwera
export const SALON_TZ = 'Europe/Warsaw';
export const SLOT_STEP_MIN = 15;

export const WEEKDAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

/** 540 -> "09:00" */
export const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

/** "09:00" -> 540 */
export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/** Początek dnia "yyyy-MM-dd" w strefie salonu */
export const salonDay = (date: string): DateTime => DateTime.fromISO(date, { zone: SALON_TZ }).startOf('day');

/** Dzisiejsza data w strefie salonu jako "yyyy-MM-dd" */
export const salonToday = (): string => DateTime.now().setZone(SALON_TZ).toISODate()!;

/** Kolumna @db.Date przechowuje datę jako północ UTC */
export const dateOnlyToDb = (date: string): Date => new Date(`${date}T00:00:00.000Z`);
export const dbToDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

export const formatTime = (date: Date | string): string =>
  DateTime.fromJSDate(new Date(date)).setZone(SALON_TZ).toFormat('HH:mm');

// MMMM/MMM = forma zależna („12 października”), LLLL byłoby mianownikiem („12 październik”)
export const formatDate = (date: Date | string): string =>
  DateTime.fromJSDate(new Date(date)).setZone(SALON_TZ).setLocale('pl').toFormat('ccc, d MMM yyyy');

/** "2026-10-12" -> "poniedziałek, 12 października" (rok tylko gdy inny niż bieżący) */
export const formatDayLong = (date: string): string => {
  const day = salonDay(date).setLocale('pl');
  return day.toFormat(day.year === DateTime.now().setZone(SALON_TZ).year ? 'cccc, d MMMM' : 'cccc, d MMMM yyyy');
};

/** Krótkie nazwy dni do podsumowań grafiku */
export const WEEKDAYS_SHORT = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Bieżący miesiąc w strefie salonu: "2026-10" */
export const salonMonth = (): string => salonToday().slice(0, 7);

/** Pierwszy dzień miesiąca, pierwszy dzień następnego i liczba dni */
export const monthBounds = (month: string) => {
  const first = DateTime.fromISO(`${month}-01`, { zone: SALON_TZ }).startOf('day');
  return { first, next: first.plus({ months: 1 }), days: first.daysInMonth! };
};

/** "2026-10" -> "październik 2026" (mianownik, LLLL) */
export const formatMonth = (month: string): string =>
  monthBounds(month).first.setLocale('pl').toFormat('LLLL yyyy');

/** 540 -> "9", 510 -> "8:30" – do wąskich komórek grafiku */
export const shortTime = (minutes: number): string =>
  minutes % 60 === 0 ? String(minutes / 60) : minutesToTime(minutes).replace(/^0/, '');
