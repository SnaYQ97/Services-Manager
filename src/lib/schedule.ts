import { minutesToTime, WEEKDAYS_SHORT } from '@/lib/time';

export interface ScheduleWindow {
  weekday: number; // 1 = poniedziałek ... 7 = niedziela
  startMinute: number;
  endMinute: number;
}

/** Grupuje kolejne dni z tymi samymi godzinami: [{ days: 'Pn–Pt', hours: '09:00–17:00' }, { days: 'So', ... }] */
export const summarizeSchedule = (windows: ScheduleWindow[]): { days: string; hours: string }[] => {
  const byDay = new Map<number, string>();
  for (const w of [...windows].sort((a, b) => a.weekday - b.weekday || a.startMinute - b.startMinute)) {
    const hours = `${minutesToTime(w.startMinute)}–${minutesToTime(w.endMinute)}`;
    byDay.set(w.weekday, byDay.has(w.weekday) ? `${byDay.get(w.weekday)}, ${hours}` : hours);
  }

  const groups: { from: number; to: number; hours: string }[] = [];
  for (const [weekday, hours] of byDay) {
    const last = groups.at(-1);
    if (last && last.hours === hours && last.to === weekday - 1) last.to = weekday;
    else groups.push({ from: weekday, to: weekday, hours });
  }

  return groups.map(({ from, to, hours }) => ({
    days: from === to ? WEEKDAYS_SHORT[from - 1] : `${WEEKDAYS_SHORT[from - 1]}–${WEEKDAYS_SHORT[to - 1]}`,
    hours,
  }));
};

/** "Bob Johnson" -> "BJ" */
export const initials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
