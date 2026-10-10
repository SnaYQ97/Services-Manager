"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DateTime } from "luxon";
import { addScheduleException, CalendarEmployee, deleteScheduleException } from "@/actions/calendar";
import { formatTime, minutesToTime, SALON_TZ, salonDay, salonToday } from "@/lib/time";

interface Props {
  date: string;
  employees: CalendarEmployee[];
  isManager: boolean;
}

const PX_PER_MIN = 1.2;

const CalendarDay = ({ date, employees, isManager }: Props) => {
  const day = salonDay(date);
  const weekStart = day.startOf('week');
  const today = salonToday();

  // zakres godzin siatki: od najwcześniejszego do najpóźniejszego grafiku (domyślnie 8–18)
  const windows = employees.flatMap(e => e.workingHours);
  const bookingMinutes = employees.flatMap(e => e.bookings.flatMap(b => [b.startAt, b.endAt]))
    .map(iso => { const t = DateTime.fromISO(iso).setZone(SALON_TZ); return t.hour * 60 + t.minute; });
  const gridStart = Math.floor(Math.min(480, ...windows.map(w => w.startMinute), ...bookingMinutes) / 60) * 60;
  const gridEnd = Math.ceil(Math.max(1080, ...windows.map(w => w.endMinute), ...bookingMinutes) / 60) * 60;
  const hours = Array.from({ length: (gridEnd - gridStart) / 60 }, (_, i) => gridStart + i * 60);
  const top = (minute: number) => (minute - gridStart) * PX_PER_MIN;
  const minuteOf = (iso: string) => {
    const t = DateTime.fromISO(iso).setZone(SALON_TZ);
    return t.hasSame(day, 'day') ? t.hour * 60 + t.minute : (t < day ? gridStart : gridEnd);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Kalendarz</h1>
        <div className="flex items-center gap-1 text-sm">
          <Link href={`/calendar?date=${weekStart.minus({ weeks: 1 }).toISODate()}`} className="px-2 py-1 rounded-md border border-gray-200">‹</Link>
          {Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i })).map(d => {
            const iso = d.toISODate()!;
            return (
              <Link
                key={iso}
                href={`/calendar?date=${iso}`}
                className={`px-3 py-1 rounded-md border text-center ${
                  iso === date ? 'bg-blue-600 border-blue-600 text-white' : iso === today ? 'border-blue-400' : 'border-gray-200'
                }`}
              >
                <span className="block text-xs">{d.setLocale('pl').toFormat('ccc')}</span>
                {d.toFormat('dd.MM')}
              </Link>
            );
          })}
          <Link href={`/calendar?date=${weekStart.plus({ weeks: 1 }).toISODate()}`} className="px-2 py-1 rounded-md border border-gray-200">›</Link>
          <Link href={`/calendar?date=${today}`} className="ml-2 px-2 py-1 rounded-md border border-gray-200">Dziś</Link>
        </div>
      </div>

      <p className="text-gray-600">{day.setLocale('pl').toFormat('cccc, d LLLL yyyy')}</p>

      {employees.length === 0 ? (
        <p className="text-gray-500">Brak specjalistów z grafikiem.</p>
      ) : (
        <div className="flex bg-white rounded-lg shadow-sm overflow-x-auto">
          <div className="w-14 shrink-0 border-r border-gray-100">
            <div className="h-10" />
            <div className="relative" style={{ height: (gridEnd - gridStart) * PX_PER_MIN }}>
              {hours.map(h => (
                <span key={h} className="absolute right-2 -translate-y-2 text-xs text-gray-400" style={{ top: top(h) }}>
                  {minutesToTime(h)}
                </span>
              ))}
            </div>
          </div>

          {employees.map(employee => (
            <div key={employee.id} className="flex-1 min-w-48 border-r border-gray-100 last:border-r-0">
              <div className="h-10 flex items-center justify-center font-semibold text-gray-800 border-b border-gray-100">
                {employee.name}
              </div>
              <div className="relative bg-gray-100" style={{ height: (gridEnd - gridStart) * PX_PER_MIN }}>
                {hours.map(h => (
                  <div key={h} className="absolute inset-x-0 border-t border-gray-200/70" style={{ top: top(h) }} />
                ))}

                {employee.workingHours.map(w => (
                  <div
                    key={w.startMinute}
                    className="absolute inset-x-0 bg-white"
                    style={{ top: top(w.startMinute), height: (w.endMinute - w.startMinute) * PX_PER_MIN }}
                  />
                ))}

                {employee.exceptions.map(ex => {
                  const start = ex.startMinute ?? gridStart;
                  const end = ex.endMinute ?? gridEnd;
                  return (
                    <div
                      key={ex.id}
                      className="absolute inset-x-0 bg-red-50 border-y border-red-200 text-xs text-red-700 p-1 flex justify-between items-start"
                      style={{
                        top: top(start),
                        height: (end - start) * PX_PER_MIN,
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 8px, rgb(254 202 202 / .5) 8px 16px)',
                      }}
                    >
                      <span>
                        {ex.reason || 'Niedostępny'}
                        {ex.startMinute !== null && ` (${minutesToTime(ex.startMinute)}–${minutesToTime(ex.endMinute!)})`}
                      </span>
                      {isManager && <DeleteExceptionButton id={ex.id} />}
                    </div>
                  );
                })}

                {employee.bookings.map(b => {
                  const start = minuteOf(b.startAt);
                  const end = minuteOf(b.endAt);
                  return (
                    <div
                      key={b.id}
                      title={[b.serviceName, `${b.clientName}, tel. ${b.clientPhone}`, b.note, `Transakcja #${b.transactionId}`].filter(Boolean).join('\n')}
                      className="absolute inset-x-1 rounded-md bg-blue-100 border-l-4 border-blue-500 px-2 py-1 text-xs text-blue-900 overflow-hidden"
                      style={{ top: top(start), height: (end - start) * PX_PER_MIN }}
                    >
                      <p className="font-semibold">{formatTime(b.startAt)}–{formatTime(b.endAt)} {b.serviceName}</p>
                      <p>{b.clientName} · {b.clientPhone}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {isManager && employees.length > 0 && <ExceptionForm date={date} employees={employees} />}
    </div>
  );
};

const DeleteExceptionButton = ({ id }: { id: string }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      title="Usuń wyjątek"
      disabled={isPending}
      onClick={() => startTransition(async () => { await deleteScheduleException(id); router.refresh(); })}
      className="px-1 text-red-700 hover:text-red-900"
    >
      ×
    </button>
  );
};

const ExceptionForm = ({ date, employees }: { date: string; employees: CalendarEmployee[] }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [employeeId, setEmployeeId] = useState(employees[0].id);
  const [exceptionDate, setExceptionDate] = useState(date);
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('14:00');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);

  const handleSubmit = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await addScheduleException({ employeeId, date: exceptionDate, allDay, startTime, endTime, reason });
      if (!result.ok) {
        setMessage({ type: 'error', text: result.error });
        return;
      }
      setReason('');
      setMessage(result.conflictingBookings > 0
        ? { type: 'error', text: `Wyjątek dodany. Uwaga: ${result.conflictingBookings} istniejąca rezerwacja(e) koliduje – trzeba ją przełożyć.` }
        : { type: 'info', text: 'Wyjątek dodany.' });
      router.refresh();
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col gap-3 text-sm">
      <h2 className="font-semibold text-gray-800">Urlop / niedostępność (kierownik)</h2>
      <div className="flex flex-wrap gap-3 items-center">
        <select className="border border-gray-200 rounded-md px-2 py-1" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <input type="date" className="border border-gray-200 rounded-md px-2 py-1" value={exceptionDate} onChange={e => setExceptionDate(e.target.value)} />
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} />
          Cały dzień
        </label>
        {!allDay && (
          <>
            <input type="time" step={900} className="border border-gray-200 rounded-md px-2 py-1" value={startTime} onChange={e => setStartTime(e.target.value)} />
            –
            <input type="time" step={900} className="border border-gray-200 rounded-md px-2 py-1" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </>
        )}
        <input className="border border-gray-200 rounded-md px-2 py-1 flex-auto" placeholder="Powód (np. urlop)" value={reason} onChange={e => setReason(e.target.value)} />
        <button
          onClick={handleSubmit}
          disabled={isPending || !exceptionDate}
          className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
        >
          Dodaj
        </button>
      </div>
      {message && <p className={message.type === 'error' ? 'text-red-600' : 'text-green-700'}>{message.text}</p>}
    </div>
  );
};

export default CalendarDay;
