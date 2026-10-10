"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { getSlots } from "@/actions/booking";
import type { BookableService } from "@/actions/booking";
import type { CalendarEmployee } from "@/actions/calendar";
import type { Slot } from "@/lib/availability";
import { useCart } from "@/components/Cart/CartProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { formatDayLong, formatTime, minutesToTime, SALON_TZ } from "@/lib/time";
import { cn } from "@/lib/utils";

export interface BookingTarget {
  employee: CalendarEmployee;
  minute: number; // kliknięta godzina (minuty od północy)
}

interface Props {
  date: string;
  target: BookingTarget | null;
  services: BookableService[];
  onClose: () => void;
}

const slotMinute = (slot: Slot) => {
  const t = DateTime.fromISO(slot.startAt).setZone(SALON_TZ);
  return t.hour * 60 + t.minute;
};

const BookSlotDialog = ({ date, target, services, onClose }: Props) => {
  const router = useRouter();
  const { items, add } = useCart();
  const available = target ? services.filter(service => target.employee.serviceIds.includes(service.id)) : [];
  const [serviceId, setServiceId] = useState<string>('');
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [chosen, setChosen] = useState<Slot | null>(null);

  // nowe kliknięcie: pierwsza usługa specjalisty
  useEffect(() => {
    setServiceId(available[0]?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  // terminy już wybrane w koszyku – klient nie może być w dwóch miejscach naraz
  const busyKey = JSON.stringify(items.filter(item => item.slot).map(item => ({ startAt: item.slot!.startAt, endAt: item.slot!.endAt })));

  useEffect(() => {
    if (!target || !serviceId) return;
    let cancelled = false;
    setSlots(null);
    setChosen(null);
    getSlots({ serviceId, date, employeeId: target.employee.id, busy: JSON.parse(busyKey) }).then(result => {
      if (cancelled) return;
      setSlots(result);
      setChosen(result.find(slot => slotMinute(slot) === target.minute) ?? null);
    });
    return () => { cancelled = true; };
  }, [target, serviceId, date, busyKey]);

  const service = available.find(s => s.id === serviceId);
  const exactFree = !!slots && !!target && slots.some(slot => slotMinute(slot) === target.minute);
  // najbliższe wolne godziny wokół klikniętego miejsca
  const suggestions = slots && target
    ? [...slots].sort((a, b) => Math.abs(slotMinute(a) - target.minute) - Math.abs(slotMinute(b) - target.minute)).slice(0, 6)
      .sort((a, b) => slotMinute(a) - slotMinute(b))
    : [];

  const handleAdd = () => {
    if (!target || !service || !chosen) return;
    add({
      serviceId: service.id,
      employeeId: target.employee.id,
      date,
      slot: { startAt: chosen.startAt, endAt: chosen.endAt, employeeId: target.employee.id },
    });
    toast.success('Dodano do koszyka', {
      description: `${service.name} · ${formatTime(chosen.startAt)} · ${target.employee.name}`,
      action: { label: 'Przejdź do koszyka', onClick: () => router.push('/') },
    });
    onClose();
  };

  return (
    <Dialog open={target !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nowa wizyta</DialogTitle>
          {target && (
            <DialogDescription>
              {target.employee.name} · <span className="first-letter:uppercase">{formatDayLong(date)}</span>, {minutesToTime(target.minute)}
            </DialogDescription>
          )}
        </DialogHeader>

        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ten specjalista nie ma przypisanych usług.</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="book-service">Usługa</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger id="book-service" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {available.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} · {s.durationMin} min · {formatMoney(s.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {slots === null ? (
              <Skeleton className="h-16 w-full" />
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tego dnia nie ma już wolnego terminu na tę usługę.</p>
            ) : (
              <div className="space-y-2">
                {!exactFree && target && (
                  <p className="text-sm text-muted-foreground">
                    O {minutesToTime(target.minute)} ta usługa się nie zmieści. Najbliższe wolne godziny:
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map(slot => {
                    const selected = chosen?.startAt === slot.startAt;
                    return (
                      <button
                        key={slot.startAt}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setChosen(slot)}
                        className={cn(
                          'h-8 rounded-md border px-2.5 text-sm tabular-nums transition-colors',
                          selected ? 'border-brand bg-brand text-brand-foreground' : 'hover:border-brand hover:text-brand',
                        )}
                      >
                        {formatTime(slot.startAt)}
                      </button>
                    );
                  })}
                </div>
                {chosen && (
                  <p className="flex items-center gap-1.5 text-sm text-brand">
                    <Check className="size-4" />
                    {formatTime(chosen.startAt)}–{formatTime(chosen.endAt)} wolne
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Anuluj</Button>
          <Button onClick={handleAdd} disabled={!chosen}>Dodaj do koszyka</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookSlotDialog;
