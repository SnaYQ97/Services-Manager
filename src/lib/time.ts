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

export const formatDate = (date: Date | string): string =>
  DateTime.fromJSDate(new Date(date)).setZone(SALON_TZ).setLocale('pl').toFormat('ccc, d LLL yyyy');
