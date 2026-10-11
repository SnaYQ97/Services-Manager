"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { Banknote, ChevronDown, ChevronLeft, ChevronRight, CreditCard, Search, X } from "lucide-react";
import type { TransactionRow, TransactionsPage } from "@/actions/transactions";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentType } from "../../../generated/prisma";
import { formatMoney, formatPhone, plural } from "@/lib/format";
import { formatDate, formatDayLong, formatTime, SALON_TZ, salonToday } from "@/lib/time";
import { cn } from "@/lib/utils";

export interface TransactionFilterValues {
  from: string;
  to: string;
  payment: PaymentType | 'ALL';
  q: string;
}

const PAYMENT = {
  [PaymentType.CARD]: { label: 'Karta', icon: CreditCard },
  [PaymentType.CASH]: { label: 'Gotówka', icon: Banknote },
};

/** Grupowanie po dniach kalendarzowych w strefie salonu (nie po 24 h od teraz) */
const dayLabel = (isoDate: string) => {
  const today = salonToday();
  if (isoDate === today) return 'Dziś';
  if (isoDate === DateTime.fromISO(today).minus({ days: 1 }).toISODate()) return 'Wczoraj';
  return formatDayLong(isoDate);
};

const groupByDay = (items: TransactionRow[]) => {
  const groups: { date: string; items: TransactionRow[] }[] = [];
  for (const item of items) {
    const date = DateTime.fromISO(item.createdAt).setZone(SALON_TZ).toISODate()!;
    const last = groups.at(-1);
    if (last?.date === date) last.items.push(item);
    else groups.push({ date, items: [item] });
  }
  return groups;
};

const TransactionsView = ({ data, filters }: { data: TransactionsPage; filters: TransactionFilterValues }) => {
  const router = useRouter();
  const [query, setQuery] = useState(filters.q);

  const hrefWith = (patch: Partial<TransactionFilterValues> & { page?: number }) => {
    const next = { ...filters, ...patch };
    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q);
    if (next.payment !== 'ALL') params.set('payment', next.payment);
    if (next.from) params.set('from', next.from);
    if (next.to) params.set('to', next.to);
    if (patch.page && patch.page > 1) params.set('page', String(patch.page));
    const search = params.toString();
    return search ? `/transactions?${search}` : '/transactions';
  };

  const applyFilters = (patch: Partial<TransactionFilterValues>) => router.replace(hrefWith(patch), { scroll: false });

  // wyszukiwanie z opóźnieniem, żeby nie odpytywać serwera przy każdym znaku
  useEffect(() => {
    if (query === filters.q) return;
    const timeout = setTimeout(() => applyFilters({ q: query.trim() }), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const hasFilters = filters.q || filters.payment !== 'ALL' || filters.from || filters.to;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Transakcje"
        description={`${data.total} ${plural(data.total, ['transakcja', 'transakcje', 'transakcji'])} · razem ${formatMoney(data.sum)}`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Klient, telefon lub nr transakcji"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Szukaj transakcji"
          />
        </div>
        <Select value={filters.payment} onValueChange={value => applyFilters({ payment: value as TransactionFilterValues['payment'] })}>
          <SelectTrigger className="w-40" aria-label="Forma płatności">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Każda płatność</SelectItem>
            <SelectItem value={PaymentType.CARD}>Karta</SelectItem>
            <SelectItem value={PaymentType.CASH}>Gotówka</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <Input type="date" className="w-auto" value={filters.from} max={filters.to || undefined} onChange={e => applyFilters({ from: e.target.value })} aria-label="Od dnia" />
          <span className="text-muted-foreground">–</span>
          <Input type="date" className="w-auto" value={filters.to} min={filters.from || undefined} onChange={e => applyFilters({ to: e.target.value })} aria-label="Do dnia" />
        </div>
        {hasFilters && (
          <Button variant="ghost" onClick={() => { setQuery(''); router.replace('/transactions', { scroll: false }); }}>
            <X />
            Wyczyść
          </Button>
        )}
      </div>

      {data.items.length === 0 ? (
        <Card className="items-center py-10 text-sm text-muted-foreground">
          {hasFilters ? 'Brak transakcji dla wybranych filtrów.' : 'Brak transakcji.'}
        </Card>
      ) : (
        groupByDay(data.items).map(group => (
          <section key={group.date} className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground first-letter:uppercase">{dayLabel(group.date)}</h2>
            <Card className="gap-0 overflow-hidden py-0">
              <ul className="divide-y">
                {group.items.map(transaction => <TransactionItem key={transaction.id} transaction={transaction} />)}
              </ul>
            </Card>
          </section>
        ))
      )}

      {data.pageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Strona {data.page} z {data.pageCount}</span>
          <div className="flex gap-2">
            <Button asChild={data.page > 1} variant="outline" size="sm" disabled={data.page <= 1}>
              {data.page > 1 ? <Link href={hrefWith({ page: data.page - 1 })}><ChevronLeft />Nowsze</Link> : <span><ChevronLeft />Nowsze</span>}
            </Button>
            <Button asChild={data.page < data.pageCount} variant="outline" size="sm" disabled={data.page >= data.pageCount}>
              {data.page < data.pageCount ? <Link href={hrefWith({ page: data.page + 1 })}>Starsze<ChevronRight /></Link> : <span>Starsze<ChevronRight /></span>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const TransactionItem = ({ transaction }: { transaction: TransactionRow }) => {
  const [expanded, setExpanded] = useState(false);
  const { label, icon: PaymentIcon } = PAYMENT[transaction.paymentType];
  const clients = [...new Set(transaction.bookings.map(b => b.clientName))].join(', ');
  const servicesSummary = transaction.services.map(s => s.quantity > 1 ? `${s.name} ×${s.quantity}` : s.name).join(', ');

  return (
    <li>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="grid w-full grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 sm:grid-cols-[3rem_minmax(0,1fr)_7rem_auto]"
      >
        <span className="text-sm text-muted-foreground tabular-nums">{formatTime(transaction.createdAt)}</span>
        <span className="min-w-0">
          <span className="block truncate font-medium">{clients || servicesSummary}</span>
          {clients && <span className="block truncate text-sm text-muted-foreground">{servicesSummary}</span>}
        </span>
        <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
          <PaymentIcon className="size-4" />
          {label}
        </span>
        <span className="flex items-center gap-2 font-medium tabular-nums">
          {formatMoney(transaction.totalAmount)}
          <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        </span>
      </button>

      {expanded && (
        <div className="space-y-4 border-t bg-muted/30 px-4 py-4 text-sm sm:pl-19">
          {transaction.bookings.length > 0 && (
            <div className="space-y-1">
              <p className="font-medium">Wizyty</p>
              <ul className="space-y-0.5 text-muted-foreground">
                {transaction.bookings.map(booking => (
                  <li key={booking.id} className={cn(booking.status === 'CANCELLED' && 'line-through')}>
                    {formatDate(booking.startAt)}, {formatTime(booking.startAt)}–{formatTime(booking.endAt)} · {booking.serviceName} · {booking.specialistName}
                    <span className="block text-xs">{booking.clientName} · {formatPhone(booking.clientPhone)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="space-y-1">
            <p className="font-medium">Pozycje</p>
            <ul className="space-y-0.5 text-muted-foreground">
              {transaction.services.map(service => (
                <li key={service.name} className="flex justify-between gap-4 tabular-nums">
                  <span>{service.name}{service.quantity > 1 && ` ×${service.quantity}`}</span>
                  <span>{formatMoney(service.unitPrice * service.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 sm:hidden"><PaymentIcon className="size-3.5" />{label}</span>
            <span>Obsługa: {transaction.sellerName}</span>
            <span className="font-mono">#{transaction.id}</span>
          </p>
        </div>
      )}
    </li>
  );
};

export default TransactionsView;
