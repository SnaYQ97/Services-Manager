"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DateTime } from "luxon";
import { CalendarOff, ChevronLeft, ChevronRight, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import type { BookableService } from "@/actions/booking";
import { CalendarEmployee, deleteScheduleException } from "@/actions/calendar";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPhone } from "@/lib/format";
import { formatDayLong, formatMonth, formatTime, minutesToTime, SALON_TZ, salonDay, salonToday, SLOT_STEP_MIN } from "@/lib/time";
import { cn } from "@/lib/utils";
import BookSlotDialog, { BookingTarget } from "./BookSlotDialog";
import ExceptionDialog from "./ExceptionDialog";

interface Props {
  date: string;
  employees: CalendarEmployee[];
  services: BookableService[];
  isManager: boolean;
  schedulePublished: boolean;
}

const PX_PER_MIN = 1.1;
const COLUMN_MIN_WIDTH = 176;

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

const CalendarDay = ({ date, employees, services, isManager, schedulePublished }: Props) => {
  const router = useRouter();
  const day = salonDay(date);
  const today = salonToday();
  const weekStart = day.startOf('week');
  const [hover, setHover] = useState<{ employeeId: string; minute: number } | null>(null);
  const [bookingTarget, setBookingTarget] = useState<BookingTarget | null>(null);

  const minuteOfDay = (iso: string) => {
    const t = DateTime.fromISO(iso).setZone(SALON_TZ);
    return t.hasSame(day, 'day') ? t.hour * 60 + t.minute : (t < day ? 0 : 24 * 60);
  };

  // zakres siatki: od najwcześniejszego do najpóźniejszego grafiku/wizyty (co najmniej 8–18)
  const windows = employees.flatMap(e => e.workingHours);
  const bookingMinutes = employees.flatMap(e => e.bookings.flatMap(b => [minuteOfDay(b.startAt), minuteOfDay(b.endAt)]));
  const gridStart = Math.floor(Math.min(480, ...windows.map(w => w.startMinute), ...bookingMinutes) / 60) * 60;
  const gridEnd = Math.ceil(Math.max(1080, ...windows.map(w => w.endMinute), ...bookingMinutes) / 60) * 60;
  const hours = Array.from({ length: (gridEnd - gridStart) / 60 }, (_, i) => gridStart + i * 60);
  const top = (minute: number) => (minute - gridStart) * PX_PER_MIN;

  const exceptionRange = (ex: CalendarEmployee['exceptions'][number]) =>
    [ex.startMinute ?? 0, ex.endMinute ?? 24 * 60] as const;
  const isWorkingAt = (employee: CalendarEmployee, minute: number) =>
    employee.workingHours.some(w => minute >= w.startMinute && minute < w.endMinute)
    && !employee.exceptions.some(ex => { const [s, e] = exceptionRange(ex); return minute >= s && minute < e; });

  const minuteFromEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return gridStart + Math.floor((e.clientY - rect.top) / PX_PER_MIN / SLOT_STEP_MIN) * SLOT_STEP_MIN;
  };

  const handleColumnClick = (employee: CalendarEmployee, e: React.MouseEvent<HTMLDivElement>) => {
    const minute = minuteFromEvent(e);
    if (!isWorkingAt(employee, minute)) return;
    if (day.set({ hour: Math.floor(minute / 60), minute: minute % 60 }) < DateTime.now()) {
      toast.info('Ten termin już minął.');
      return;
    }
    setBookingTarget({ employee, minute });
  };

  const allExceptions = employees.flatMap(employee => employee.exceptions.map(ex => ({ ...ex, employeeName: employee.name })));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Kalendarz"
        description={<span className="first-letter:uppercase">{formatDayLong(date)}</span>}
        actions={
          <>
            <div className="flex items-center gap-1">
              <Button asChild variant="outline" size="icon" aria-label="Poprzedni dzień">
                <Link href={`/calendar?date=${day.minus({ days: 1 }).toISODate()}`}><ChevronLeft /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/calendar?date=${today}`}>Dziś</Link>
              </Button>
              <Button asChild variant="outline" size="icon" aria-label="Następny dzień">
                <Link href={`/calendar?date=${day.plus({ days: 1 }).toISODate()}`}><ChevronRight /></Link>
              </Button>
              <Input
                type="date"
                className="w-auto"
                value={date}
                onChange={e => e.target.value && router.push(`/calendar?date=${e.target.value}`)}
                aria-label="Wybierz dzień"
              />
            </div>
            {isManager && employees.length > 0 && <ExceptionDialog date={date} employees={employees} />}
          </>
        }
      />

      <nav className="grid grid-cols-7 gap-1" aria-label="Dni tygodnia">
        {Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i })).map(d => {
          const iso = d.toISODate()!;
          return (
            <Link
              key={iso}
              href={`/calendar?date=${iso}`}
              aria-current={iso === date ? 'date' : undefined}
              className={cn(
                'rounded-md py-1.5 text-center text-sm transition-colors',
                iso === date ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                iso === today && iso !== date && 'font-semibold text-brand',
              )}
            >
              <span className="block text-xs opacity-70">{d.setLocale('pl').toFormat('ccc')}</span>
              <span className="tabular-nums">{d.toFormat('d')}</span>
            </Link>
          );
        })}
      </nav>

      {!schedulePublished && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            Grafik na {formatMonth(date.slice(0, 7))} nie jest opublikowany – w tym miesiącu nie ma wolnych terminów.
          </span>
          {isManager && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/schedule?month=${date.slice(0, 7)}`}>Ułóż grafik</Link>
            </Button>
          )}
        </div>
      )}

      {allExceptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allExceptions.map(ex => (
            <span key={ex.id} className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/5 py-1 pr-1.5 pl-3 text-xs text-destructive">
              <CalendarOff className="size-3.5" />
              {ex.employeeName} · {ex.startMinute === null ? 'cały dzień' : `${minutesToTime(ex.startMinute)}–${minutesToTime(ex.endMinute!)}`}
              {ex.reason && ` · ${ex.reason}`}
              {isManager && <DeleteExceptionButton id={ex.id} />}
            </span>
          ))}
        </div>
      )}

      {employees.length === 0 ? (
        <p className="text-sm text-muted-foreground">Brak specjalistów z grafikiem. Kierownik może go ustawić w Zarządzaniu.</p>
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <div className="overflow-x-auto">
            <div className="flex" style={{ minWidth: 56 + employees.length * COLUMN_MIN_WIDTH }}>
              <div className="w-14 shrink-0 border-r">
                <div className="h-11 border-b" />
                <div className="relative" style={{ height: (gridEnd - gridStart) * PX_PER_MIN }}>
                  {hours.map(h => (
                    <span key={h} className="absolute right-2 -translate-y-2 text-[11px] text-muted-foreground tabular-nums" style={{ top: top(h) }}>
                      {minutesToTime(h)}
                    </span>
                  ))}
                </div>
              </div>

              {employees.map(employee => (
                <div key={employee.id} className="min-w-0 flex-1 border-r last:border-r-0">
                  <div className="flex h-11 items-center justify-center border-b px-2 text-sm font-medium">
                    <span className="truncate">{employee.name}</span>
                  </div>
                  <div
                    className="relative bg-muted/50"
                    style={{ height: (gridEnd - gridStart) * PX_PER_MIN }}
                    onClick={e => handleColumnClick(employee, e)}
                    onMouseMove={e => {
                      const minute = minuteFromEvent(e);
                      setHover(isWorkingAt(employee, minute) ? { employeeId: employee.id, minute } : null);
                    }}
                    onMouseLeave={() => setHover(null)}
                  >
                    {employee.workingHours.map(w => (
                      <div
                        key={w.startMinute}
                        className="absolute inset-x-0 cursor-pointer bg-background"
                        style={{ top: top(w.startMinute), height: (w.endMinute - w.startMinute) * PX_PER_MIN }}
                      />
                    ))}

                    {hours.map(h => (
                      <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-border/60" style={{ top: top(h) }} />
                    ))}

                    {employee.exceptions.map(ex => {
                      const [start, end] = exceptionRange(ex);
                      const from = Math.max(start, gridStart);
                      const to = Math.min(end, gridEnd);
                      return (
                        <div
                          key={ex.id}
                          className="pointer-events-none absolute inset-x-0 bg-destructive/5"
                          style={{
                            top: top(from),
                            height: (to - from) * PX_PER_MIN,
                            backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in oklab, var(--destructive) 14%, transparent) 6px 12px)',
                          }}
                        />
                      );
                    })}

                    {hover?.employeeId === employee.id && (
                      <div
                        className="pointer-events-none absolute inset-x-1 rounded-md border border-dashed border-brand/60 px-2 text-[11px] leading-4 text-brand"
                        style={{ top: top(hover.minute), height: SLOT_STEP_MIN * PX_PER_MIN }}
                      >
                        + {minutesToTime(hover.minute)}
                      </div>
                    )}

                    {employee.bookings.map(b => {
                      const start = minuteOfDay(b.startAt);
                      const end = minuteOfDay(b.endAt);
                      const conflict = employee.exceptions.some(ex => {
                        const [s, e] = exceptionRange(ex);
                        return overlaps(start, end, s, e);
                      });
                      return (
                        <div
                          key={b.id}
                          onClick={e => e.stopPropagation()}
                          onMouseMove={e => e.stopPropagation()}
                          title={[conflict && 'Koliduje z niedostępnością', b.serviceName, `${b.clientName}, tel. ${formatPhone(b.clientPhone)}`, b.note, `Transakcja #${b.transactionId}`].filter(Boolean).join('\n')}
                          className={cn(
                            'absolute inset-x-1 z-10 overflow-hidden rounded-md border-l-2 px-2 py-1 text-xs leading-snug',
                            conflict
                              ? 'border-destructive text-destructive'
                              : 'border-brand bg-brand-soft text-brand-soft-foreground',
                          )}
                          style={{
                            top: top(start) + 1,
                            height: (end - start) * PX_PER_MIN - 2,
                            // nieprzezroczyste tło, żeby kreskowanie niedostępności nie prześwitywało
                            ...(conflict && { background: 'color-mix(in oklab, var(--destructive) 10%, var(--background))' }),
                          }}
                        >
                          <p className="font-medium tabular-nums">
                            {conflict && <TriangleAlert className="mr-1 inline size-3 -translate-y-px" aria-label="Koliduje z niedostępnością" />}
                            {formatTime(b.startAt)}–{formatTime(b.endAt)} {b.serviceName}
                          </p>
                          <p className="truncate">{b.clientName} · {formatPhone(b.clientPhone)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">Kliknij wolne miejsce w kolumnie specjalisty, aby dodać wizytę do koszyka.</p>

      <BookSlotDialog date={date} target={bookingTarget} services={services} onClose={() => setBookingTarget(null)} />
    </div>
  );
};

const DeleteExceptionButton = ({ id }: { id: string }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-label="Usuń niedostępność"
      title="Usuń niedostępność"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await deleteScheduleException(id);
        toast.success('Usunięto niedostępność.');
        router.refresh();
      })}
      className="rounded-full p-0.5 hover:bg-destructive/10 disabled:opacity-50"
    >
      <X className="size-3.5" />
    </button>
  );
};

export default CalendarDay;
