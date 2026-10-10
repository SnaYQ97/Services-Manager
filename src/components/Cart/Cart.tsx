"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Banknote, CheckCircle2, CreditCard, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { createReservation } from "@/actions/booking";
import type { BookableService } from "@/actions/booking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PaymentType } from "../../../generated/prisma";
import { formatMoney, normalizePhone, plural } from "@/lib/format";
import { formatDate, formatTime, salonDay } from "@/lib/time";
import { useCart } from "./CartProvider";
import CartItemEditor from "./CartItemEditor";

interface Confirmation {
  transactionId: string;
  clientName: string;
  firstDate: string;
  lines: string[];
}

const PAYMENT_OPTIONS = [
  { value: PaymentType.CARD, label: "Karta", icon: CreditCard },
  { value: PaymentType.CASH, label: "Gotówka", icon: Banknote },
];

const Cart = ({ services }: { services: BookableService[] }) => {
  const { items, hydrated, update, remove, clear } = useCart();
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [note, setNote] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.CARD);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [isPending, startTransition] = useTransition();
  const confirmationRef = useRef<HTMLDivElement>(null);

  const serviceById = new Map(services.map(service => [service.id, service]));
  // pozycje zapisane w przeglądarce, których usługa zniknęła albo straciła specjalistów
  const validItems = items.filter(item => serviceById.get(item.serviceId)?.employees.length);
  const staleKeys = items.filter(item => !validItems.includes(item)).map(item => item.key).join();

  useEffect(() => {
    if (!hydrated || !staleKeys) return;
    staleKeys.split(',').forEach(remove);
    toast.info('Usunięto z koszyka usługi, które nie są już dostępne.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, staleKeys]);

  useEffect(() => {
    if (confirmation) confirmationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [confirmation]);

  const total = validItems.reduce((sum, item) => sum + serviceById.get(item.serviceId)!.price, 0);
  const allScheduled = validItems.length > 0 && validItems.every(item => item.slot);
  const phoneValid = normalizePhone(clientPhone) !== null;
  const canSubmit = allScheduled && clientName.trim() !== '' && phoneValid && !isPending;

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createReservation({
        clientName,
        clientPhone,
        note,
        paymentType,
        items: validItems.map(item => ({
          serviceId: item.serviceId,
          employeeId: item.slot!.employeeId,
          startAt: item.slot!.startAt,
        })),
      });

      if (!result.ok) {
        setError(result.error);
        setRefreshToken(t => t + 1);
        return;
      }

      const scheduled = [...validItems].sort((a, b) => a.slot!.startAt.localeCompare(b.slot!.startAt));
      setConfirmation({
        transactionId: result.transactionId,
        clientName: clientName.trim(),
        firstDate: salonDay(scheduled[0].date).toISODate()!,
        lines: scheduled.map(item => {
          const service = serviceById.get(item.serviceId)!;
          const specialist = service.employees.find(employee => employee.id === item.slot!.employeeId)?.name;
          return `${formatDate(item.slot!.startAt)}, ${formatTime(item.slot!.startAt)} · ${service.name} · ${specialist}`;
        }),
      });
      toast.success('Rezerwacja opłacona', {
        description: `${clientName.trim()} · ${scheduled.length} ${plural(scheduled.length, ['wizyta', 'wizyty', 'wizyt'])}`,
      });
      clear();
      setClientName('');
      setClientPhone('');
      setPhoneTouched(false);
      setNote('');
    });
  };

  return (
    <section className="flex min-w-0 flex-col gap-4" aria-label="Koszyk">
      {confirmation && (
        <div ref={confirmationRef} className="scroll-mt-20 rounded-xl border border-brand/30 bg-brand-soft p-4 text-sm text-brand-soft-foreground">
          <p className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="size-4" />
            Rezerwacja opłacona – {confirmation.clientName}
          </p>
          <ul className="mt-2 space-y-0.5 pl-6">
            {confirmation.lines.map(line => <li key={line}>{line}</li>)}
          </ul>
          <div className="mt-3 flex gap-4 pl-6">
            <Link href={`/calendar?date=${confirmation.firstDate}`} className="underline underline-offset-4">Pokaż w kalendarzu</Link>
            <Link href="/transactions" className="underline underline-offset-4">Transakcje</Link>
          </div>
        </div>
      )}

      {!hydrated ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : validItems.length === 0 ? (
        <Card className="items-center gap-2 py-10 text-center">
          <ShoppingBag className="size-6 text-muted-foreground" />
          <p className="font-medium">Koszyk jest pusty</p>
          <p className="text-sm text-muted-foreground">Dodaj usługę z listy albo kliknij wolne miejsce w kalendarzu.</p>
        </Card>
      ) : (
        <>
          {validItems.map(item => (
            <CartItemEditor
              key={item.key}
              item={item}
              service={serviceById.get(item.serviceId)!}
              busy={validItems
                .filter(other => other.key !== item.key && other.slot)
                .map(other => ({ startAt: other.slot!.startAt, endAt: other.slot!.endAt }))}
              refreshToken={refreshToken}
              onChange={patch => update(item.key, patch)}
              onRemove={() => remove(item.key)}
            />
          ))}

          <Card className="gap-4 py-4">
            <CardHeader className="px-4">
              <CardTitle>Klient i płatność</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="client-name">Imię i nazwisko</Label>
                  <Input id="client-name" value={clientName} onChange={e => setClientName(e.target.value)} autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="client-phone">Telefon</Label>
                  <Input
                    id="client-phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="600 100 200"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    onBlur={() => setPhoneTouched(true)}
                    aria-invalid={phoneTouched && !phoneValid}
                    aria-describedby="client-phone-error"
                    autoComplete="off"
                  />
                  {phoneTouched && !phoneValid && (
                    <p id="client-phone-error" className="text-xs text-destructive">Podaj 9 cyfr, opcjonalnie z +48.</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-note">Notatka <span className="font-normal text-muted-foreground">(opcjonalnie)</span></Label>
                <Textarea id="client-note" rows={2} value={note} onChange={e => setNote(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Forma płatności">
                {PAYMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={paymentType === value}
                    variant={paymentType === value ? 'default' : 'outline'}
                    onClick={() => setPaymentType(value)}
                  >
                    <Icon />
                    {label}
                  </Button>
                ))}
              </div>

              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              {!allScheduled && <p className="text-sm text-muted-foreground">Wybierz termin dla każdej usługi.</p>}

              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">Razem</span>
                <span className="text-lg font-semibold tabular-nums">{formatMoney(total)}</span>
              </div>
              <Button className="w-full" size="lg" onClick={handleSubmit} disabled={!canSubmit}>
                {isPending ? 'Zapisywanie…' : 'Zarezerwuj i zapłać'}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
};

export default Cart;
