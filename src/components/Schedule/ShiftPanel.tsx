"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { saveShift } from "@/actions/schedule";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { summarizeSchedule } from "@/lib/schedule";
import { formatDayLong, minutesToTime, salonDay } from "@/lib/time";
import { monthTotals, notify, ScheduleEmployee } from "./utils";

interface Props {
  employee: ScheduleEmployee;
  date: string;
  onClose: () => void;
}

/** Panel po prawej: godziny pracy w wybranym dniu + szczegóły specjalisty */
const ShiftPanel = ({ employee, date, onClose }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const shift = employee.shifts.find(s => s.date === date);
  const template = employee.template.find(w => w.weekday === salonDay(date).weekday);
  const initial = shift ?? template;
  const [working, setWorking] = useState(!!shift);
  const [start, setStart] = useState(minutesToTime(initial?.startMinute ?? 9 * 60));
  const [end, setEnd] = useState(minutesToTime(initial?.endMinute ?? 17 * 60));

  const absences = employee.absences.filter(a => a.date === date);
  const bookings = employee.bookings.filter(b => b.date === date);
  const totals = monthTotals(employee);
  const schedule = summarizeSchedule(employee.template);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const applyTemplate = () => {
    if (!template) {
      setWorking(false);
      return;
    }
    setWorking(true);
    setStart(minutesToTime(template.startMinute));
    setEnd(minutesToTime(template.endMinute));
  };

  const handleSave = () => startTransition(async () => {
    if (notify(await saveShift({ employeeId: employee.id, date, working, startTime: start, endTime: end }))) router.refresh();
  });

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l bg-background shadow-xl" aria-label="Edycja dnia w grafiku">
      <div className="flex items-start justify-between gap-3 border-b p-4">
        <div>
          <p className="font-semibold">{employee.name}</p>
          <p className="text-sm text-muted-foreground first-letter:uppercase">{formatDayLong(date)}</p>
        </div>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={onClose} aria-label="Zamknij panel">
          <X />
        </Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4 text-sm">
        {absences.map(absence => (
          <p key={absence.id} className="rounded-md bg-destructive/10 px-3 py-2 text-destructive">
            Nieobecność: {absence.startMinute === null ? 'cały dzień' : `${minutesToTime(absence.startMinute)}–${minutesToTime(absence.endMinute!)}`}
            {absence.reason && ` · ${absence.reason}`}
          </p>
        ))}

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox id="shift-working" checked={working} onCheckedChange={checked => setWorking(checked === true)} />
            <Label htmlFor="shift-working" className="font-normal">Pracuje tego dnia</Label>
          </div>
          {working && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="shift-start">Od</Label>
                <Input id="shift-start" type="time" step={900} value={start} onChange={e => setStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shift-end">Do</Label>
                <Input id="shift-end" type="time" step={900} value={end} onChange={e => setEnd(e.target.value)} />
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={isPending}>{isPending ? 'Zapisywanie…' : 'Zapisz dzień'}</Button>
            <Button variant="outline" onClick={applyTemplate}>Jak w szablonie</Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Wizyty tego dnia</p>
          {bookings.length > 0 ? (
            <ul className="space-y-0.5">
              {bookings.map(booking => (
                <li key={booking.id} className="tabular-nums">
                  {booking.time} · {booking.serviceName} <span className="text-muted-foreground">({booking.clientName})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">brak</p>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">W tym miesiącu</p>
          <p className="tabular-nums">{totals.label}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Szablon tygodnia</p>
          {schedule.length > 0
            ? schedule.map(({ days, hours }) => <p key={days} className="tabular-nums">{days} {hours}</p>)
            : <p className="text-muted-foreground">brak szablonu</p>}
        </div>
      </div>
    </aside>
  );
};

export default ShiftPanel;
