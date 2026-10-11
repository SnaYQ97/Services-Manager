"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import type { BookableService } from "@/actions/booking";
import { getGuestNextFreeDate, getGuestSlots } from "@/actions/guest";
import type { Slot } from "@/lib/availability";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { formatDayLong, formatTime, salonDay, salonToday } from "@/lib/time";

const ANY_EMPLOYEE = "any";

/** Wolne godziny usługi – tylko do odczytu (gość nie rezerwuje i nie płaci) */
const FreeSlots = ({ service }: { service: BookableService }) => {
  const today = salonToday();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [noFreeDate, setNoFreeDate] = useState(false);
  const bookable = service.employees.length > 0;
  const employeeName = (id: string) => service.employees.find(employee => employee.id === id)?.name ?? "";

  useEffect(() => {
    if (!bookable) return;
    let cancelled = false;
    setSlots(null);
    getGuestSlots({ serviceId: service.id, date, employeeId }).then(result => !cancelled && setSlots(result));
    return () => { cancelled = true; };
  }, [bookable, service.id, date, employeeId]);

  const jumpToNextFree = async (fromDate: string) => {
    setSearching(true);
    const next = await getGuestNextFreeDate({ serviceId: service.id, fromDate, employeeId });
    setSearching(false);
    setNoFreeDate(next === null);
    if (next) setDate(next);
  };

  // od razu najbliższy dzień z wolnym terminem (także po zmianie specjalisty)
  useEffect(() => {
    if (bookable) jumpToNextFree(today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const shiftDate = (days: number) => {
    const next = salonDay(date).plus({ days }).toISODate()!;
    if (next >= today) setDate(next);
  };

  return (
    <Card className="gap-4 py-4">
      <div className="px-4">
        <p className="font-medium">{service.name}</p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {service.durationMin} min · {formatMoney(service.price)}
        </p>
      </div>

      {!bookable ? (
        <p className="px-4 text-sm text-muted-foreground">Tej usługi nikt obecnie nie wykonuje.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 px-4">
            <Select value={employeeId ?? ANY_EMPLOYEE} onValueChange={value => setEmployeeId(value === ANY_EMPLOYEE ? null : value)}>
              <SelectTrigger size="sm" className="w-44" aria-label="Specjalista">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_EMPLOYEE}>Dowolny specjalista</SelectItem>
                {service.employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="size-8" onClick={() => shiftDate(-1)} disabled={date <= today} aria-label="Poprzedni dzień">
                <ChevronLeft />
              </Button>
              <Input
                type="date"
                className="h-8 w-auto"
                min={today}
                value={date}
                onChange={e => e.target.value && e.target.value >= today && setDate(e.target.value)}
                aria-label="Dzień"
              />
              <Button variant="outline" size="icon" className="size-8" onClick={() => shiftDate(1)} aria-label="Następny dzień">
                <ChevronRight />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => jumpToNextFree(salonDay(date).plus({ days: 1 }).toISODate()!)}
              disabled={searching}
            >
              <SkipForward />
              {searching ? "Szukam…" : "Następny wolny dzień"}
            </Button>
          </div>

          <div className="space-y-2 px-4">
            <p className="text-sm text-muted-foreground first-letter:uppercase">{formatDayLong(date)}</p>
            {slots === null ? (
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-8 w-14" />)}
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {noFreeDate ? "Brak wolnych terminów w opublikowanym grafiku." : "Brak wolnych terminów tego dnia."}
              </p>
            ) : (
              <ul className="flex flex-wrap gap-1.5" aria-label="Wolne godziny">
                {slots.map(slot => {
                  const names = slot.employeeIds.map(employeeName).join(", ");
                  return (
                    <li
                      key={slot.startAt}
                      title={names}
                      aria-label={`${formatTime(slot.startAt)}, ${names}`}
                      className="inline-flex h-8 items-center rounded-md border px-2.5 text-sm tabular-nums"
                    >
                      {formatTime(slot.startAt)}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      <p className="border-t px-4 pt-3 text-xs text-muted-foreground">Rezerwacji i płatności dokonasz w recepcji.</p>
    </Card>
  );
};

export default FreeSlots;
