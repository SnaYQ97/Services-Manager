'use server'

import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/format';
import { salonDay } from '@/lib/time';
import { PaymentType, Prisma } from '../../generated/prisma';

const PAGE_SIZE = 20;

export interface TransactionFilters {
  from?: string;          // yyyy-MM-dd (włącznie)
  to?: string;            // yyyy-MM-dd (włącznie)
  payment?: PaymentType;
  query?: string;         // klient (imię lub telefon) albo id transakcji
  page?: number;
}

const buildWhere = ({ from, to, payment, query }: TransactionFilters): Prisma.TransactionWhereInput => {
  const createdAt: Prisma.DateTimeFilter = {};
  if (from && salonDay(from).isValid) createdAt.gte = salonDay(from).toJSDate();
  if (to && salonDay(to).isValid) createdAt.lt = salonDay(to).plus({ days: 1 }).toJSDate();

  const q = query?.trim();
  const phone = q ? normalizePhone(q) : null;
  const digits = q?.replace(/\D/g, '') ?? '';

  return {
    ...(createdAt.gte || createdAt.lt ? { createdAt } : {}),
    ...(payment ? { paymentType: payment } : {}),
    ...(q ? {
      OR: [
        { id: { contains: q } },
        { bookings: { some: { clientName: { contains: q, mode: 'insensitive' } } } },
        // fragment numeru (min. 3 cyfry) albo pełny numer w dowolnym zapisie
        ...(phone || digits.length >= 3 ? [{ bookings: { some: { clientPhone: { contains: phone ?? digits } } } }] : []),
      ],
    } : {}),
  };
};

export async function getTransactions(filters: TransactionFilters) {
  const where = buildWhere(filters);
  const [total, aggregate] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.aggregate({ where, _sum: { totalAmount: true } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page ?? 1), pageCount);

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      employee: { select: { name: true } },
      services: { include: { service: { select: { name: true } } } },
      bookings: {
        orderBy: { startAt: 'asc' },
        include: { service: { select: { name: true } }, employee: { select: { name: true } } },
      },
    },
  });

  // tylko proste typy – Decimal i Date nie przechodzą do komponentów klienta
  const items = transactions.map((t) => ({
    id: t.id,
    createdAt: t.createdAt.toISOString(),
    totalAmount: t.totalAmount.toNumber(),
    paymentType: t.paymentType,
    sellerName: t.employee.name,
    services: t.services.map((s) => ({ name: s.service.name, quantity: s.quantity, unitPrice: s.unitPrice.toNumber() })),
    bookings: t.bookings.map((b) => ({
      id: b.id,
      serviceName: b.service.name,
      specialistName: b.employee.name,
      clientName: b.clientName,
      clientPhone: b.clientPhone,
      startAt: b.startAt.toISOString(),
      endAt: b.endAt.toISOString(),
      status: b.status,
    })),
  }));

  return { items, total, sum: aggregate._sum.totalAmount?.toNumber() ?? 0, page, pageCount };
}

export type TransactionsPage = Awaited<ReturnType<typeof getTransactions>>;
export type TransactionRow = TransactionsPage['items'][number];
