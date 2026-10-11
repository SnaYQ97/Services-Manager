"use client";

import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, SkipForward, X } from "lucide-react";
import { getNextFreeDate, getSlots } from "@/actions/booking";
import type { BookableService } from "@/actions/booking";
import type { Interval, Slot } from "@/lib/availability";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { formatDayLong, formatTime, salonDay, salonToday } from "@/lib/time";
import { cn } from "@/lib/utils";
import { CartItem } from "./types";

interface Props {
  item: CartItem;
  service: BookableService;
  busy: Interval[];        // terminy pozostałych pozycji koszyka
  refreshToken: number;    // zmiana wymusza ponowne pobranie slotów
  onChange: (patch: Partial<CartItem>) => void;
  onRemove: () => void;
}

const ANY_EMPLOYEE = "any";

const CartItemEditor = ({ item, service, busy, refreshToken, onChange, onRemove }: Props) => {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [noFreeDate, setNoFreeDate] = useState(false);
  const busyKey = JSON.stringify(busy);
  const today = salonToday();
  const employeeName = (id: string) => service.employees.find((employee) => employee.id === id)?.name ?? "";

  useEffect(() => {
    let cancelled = false;
    setSlots(null);
    getSlots({ serviceId: service.id, date: item.date, employeeId: item.employeeId, busy: JSON.parse(busyKey) })
      .then((result) => {
        if (cancelled) return;
        setSlots(result);
        // wybrany termin przestał być dostępny (zmiana dnia, specjalisty, upływ czasu lub kolizja z inną pozycją)
        if (item.slot && !result.some((s) => s.startAt === item.slot!.startAt && s.employeeIds.includes(item.slot!.employeeId))) {
          onChange({ slot: null });
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service.id, item.date, item.employeeId, busyKey, refreshToken]);

  const jumpToNextFree = async (fromDate: string) => {
    setSearching(true);
    const date = await getNextFreeDate({ serviceId: service.id, fromDate, employeeId: item.employeeId, busy });
    setSearching(false);
    setNoFreeDate(date === null);
    if (date) onChange({ date });
  };

  // nowa pozycja (lub zmiana specjalisty): od razu najbliższy dzień z wolnym terminem;
  // pozycja z koszyka zapisanego wcześniej nie może wskazywać na miniony dzień
  useEffect(() => {
    if (!item.slot) jumpToNextFree(item.date < today ? today : item.date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.employeeId]);

  const shiftDate = (days: number) => {
    const date = salonDay(item.date).plus({ days }).toISODate()!;
    if (date >= today) onChange({ date });
  };

  return (
    <Card className="gap-4 py-4">
      <div className="flex items-start justify-between gap-3 px-4">
        <div className="min-w-0">
          <p className="truncate font-medium">{service.name}</p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {service.durationMin} min · {formatMoney(service.price)}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={onRemove} aria-label={`Usuń z koszyka: ${service.name}`}>
          <X />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4">
        <Select
          value={item.employeeId ?? ANY_EMPLOYEE}
          onValueChange={(value) => onChange({ employeeId: value === ANY_EMPLOYEE ? null : value, slot: null })}
        >
          <SelectTrigger size="sm" className="w-44" aria-label="Specjalista">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY_EMPLOYEE}>Dowolny specjalista</SelectItem>
            {service.employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-8" onClick={() => shiftDate(-1)} disabled={item.date <= today} aria-label="Poprzedni dzień">
            <ChevronLeft />
          </Button>
          <Input
            type="date"
            className="h-8 w-auto"
            min={today}
            value={item.date}
            onChange={(e) => e.target.value && onChange({ date: e.target.value })}
            aria-label="Dzień wizyty"
          />
          <Button variant="outline" size="icon" className="size-8" onClick={() => shiftDate(1)} aria-label="Następny dzień">
            <ChevronRight />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => jumpToNextFree(salonDay(item.date).plus({ days: 1 }).toISODate()!)}
          disabled={searching}
        >
          <SkipForward />
          {searching ? "Szukam…" : "Następny wolny dzień"}
        </Button>
      </div>

      <div className="space-y-2 px-4">
        <p className="text-sm text-muted-foreground first-letter:uppercase">{formatDayLong(item.date)}</p>
        {slots === null ? (
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-8 w-14" />)}
          </div>
        ) : slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {noFreeDate ? "Brak wolnych terminów w opublikowanym grafiku." : "Brak wolnych terminów tego dnia."}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5" role="listbox" aria-label="Wolne godziny">
            {slots.map((slot) => {
              const selected = item.slot?.startAt === slot.startAt;
              return (
                <button
                  key={slot.startAt}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  title={slot.employeeIds.map(employeeName).join(", ")}
                  aria-label={`${formatTime(slot.startAt)}, ${slot.employeeIds.map(employeeName).join(", ")}`}
                  onClick={() => onChange({
                    slot: {
                      startAt: slot.startAt,
                      endAt: slot.endAt,
                      // zostaw wcześniej przypisanego specjalistę, jeśli nadal jest wolny
                      employeeId: selected && slot.employeeIds.includes(item.slot!.employeeId) ? item.slot!.employeeId : slot.employeeIds[0],
                    },
                  })}
                  className={cn(
                    "h-8 rounded-md border px-2.5 text-sm tabular-nums transition-colors",
                    selected ? "border-brand bg-brand text-brand-foreground" : "hover:border-brand hover:text-brand",
                  )}
                >
                  {formatTime(slot.startAt)}
                </button>
              );
            })}
          </div>
        )}
        {item.slot && (
          <p className="flex items-center gap-1.5 text-sm text-brand">
            <Check className="size-4" />
            {formatTime(item.slot.startAt)}–{formatTime(item.slot.endAt)} · {employeeName(item.slot.employeeId)}
          </p>
        )}
      </div>
    </Card>
  );
};

export default CartItemEditor;
