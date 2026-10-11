"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { getNextAvailability } from "@/actions/booking";
import type { SpecialistOverview } from "@/lib/specialists";
import { Skeleton } from "@/components/ui/skeleton";
import { summarizeSchedule } from "@/lib/schedule";
import { formatTime, minutesToTime, SALON_TZ, salonDay, salonToday } from "@/lib/time";
import SpecialistAvatar from "./SpecialistAvatar";

type Availability = { startAt: string; endAt: string } | null;

const relativeSlot = (startAt: string) => {
  const start = DateTime.fromISO(startAt).setZone(SALON_TZ).setLocale('pl');
  const today = salonDay(salonToday());
  const day = start.hasSame(today, 'day') ? 'dziś'
    : start.hasSame(today.plus({ days: 1 }), 'day') ? 'jutro'
    : start.toFormat('cccc, d MMMM');
  return `${day}, ${formatTime(startAt)}`;
};

interface Props {
  specialist: SpecialistOverview;
  serviceId?: string;
  saved: boolean; // przypisanie zapisane w bazie – dopiero wtedy da się policzyć wolny termin
}

/** Grafik, nieobecności i najbliższy wolny termin specjalisty – w panelu edycji usługi */
const SpecialistDetails = ({ specialist, serviceId, saved }: Props) => {
  // undefined = ładowanie
  const [availability, setAvailability] = useState<Availability | undefined>(undefined);
  const schedule = summarizeSchedule(specialist.workingHours);

  useEffect(() => {
    if (!serviceId || !saved) return;
    let cancelled = false;
    setAvailability(undefined);
    getNextAvailability({ serviceId, employeeId: specialist.id }).then(result => !cancelled && setAvailability(result));
    return () => { cancelled = true; };
  }, [serviceId, specialist.id, saved]);

  return (
    <div className="space-y-2 rounded-lg border p-3 text-sm">
      <div className="flex items-center gap-2">
        <SpecialistAvatar name={specialist.name} size="sm" />
        <p className="font-medium">{specialist.name}</p>
      </div>
      <dl className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5">
        <dt className="text-muted-foreground">Szablon tygodnia</dt>
        <dd className="tabular-nums">
          {schedule.length > 0
            ? schedule.map(({ days, hours }) => <p key={days}>{days} {hours}</p>)
            : <p className="text-muted-foreground">brak szablonu</p>}
        </dd>

        <dt className="text-muted-foreground">Nieobecności</dt>
        <dd>
          {specialist.absences.length > 0
            ? specialist.absences.map(absence => (
                <p key={absence.id} className="text-destructive">
                  {salonDay(absence.date).setLocale('pl').toFormat('ccc, d MMM')} ·{' '}
                  {absence.startMinute === null ? 'cały dzień' : `${minutesToTime(absence.startMinute)}–${minutesToTime(absence.endMinute!)}`}
                  {absence.reason && ` · ${absence.reason}`}
                </p>
              ))
            : <p className="text-muted-foreground">brak w ciągu 14 dni</p>}
        </dd>

        <dt className="text-muted-foreground">Najbliższy termin</dt>
        <dd>
          {!serviceId || !saved ? (
            <p className="text-muted-foreground">po zapisaniu usługi</p>
          ) : availability === undefined ? (
            <Skeleton className="h-5 w-36" />
          ) : availability ? (
            <p className="text-brand">{relativeSlot(availability.startAt)}</p>
          ) : (
            <p className="text-muted-foreground">brak wolnych terminów</p>
          )}
        </dd>
      </dl>
    </div>
  );
};

export default SpecialistDetails;
