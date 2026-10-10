'use server'

import { revalidatePath } from 'next/cache';
import { DateTime } from 'luxon';
import { prisma } from '@/lib/prisma';
import { findNextFreeDate, getFreeSlots, Interval } from '@/lib/availability';
import { getCurrentEmployee } from '@/lib/session';
import { SALON_TZ } from '@/lib/time';
import { PaymentType, Prisma } from '../../generated/prisma';

export async function getBookableServices() {
  return prisma.service.findMany({
    orderBy: { name: 'asc' },
    include: {
      employees: { include: { employee: { select: { id: true, name: true } } } },
    },
  });
}

export type BookableService = Awaited<ReturnType<typeof getBookableServices>>[number];

export async function getSlots(params: { serviceId: string; date: string; employeeId: string | null; busy: Interval[] }) {
  return getFreeSlots(prisma, params);
}

export async function getNextFreeDate(params: { serviceId: string; fromDate: string; employeeId: string | null; busy: Interval[] }) {
  return findNextFreeDate(prisma, params);
}

export interface ReservationInput {
  clientName: string;
  clientPhone: string;
  note?: string;
  paymentType: PaymentType;
  items: { serviceId: string; employeeId: string; startAt: string }[];
}

export type ReservationResult = { ok: true; transactionId: string } | { ok: false; error: string };

class ReservationError extends Error {}

/** Płatność + rezerwacje w jednej transakcji bazy; każdy termin jest weryfikowany ponownie po stronie serwera. */
export async function createReservation(input: ReservationInput): Promise<ReservationResult> {
  const clientName = input.clientName.trim();
  const clientPhone = input.clientPhone.trim();
  if (!clientName || !clientPhone) return { ok: false, error: 'Podaj imię i telefon klienta.' };
  if (input.items.length === 0) return { ok: false, error: 'Koszyk jest pusty.' };
  if (!Object.values(PaymentType).includes(input.paymentType)) return { ok: false, error: 'Wybierz formę płatności.' };

  const seller = await getCurrentEmployee();
  if (!seller) return { ok: false, error: 'Brak zalogowanego pracownika.' };

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const services = await tx.service.findMany({ where: { id: { in: input.items.map((i) => i.serviceId) } } });
      const serviceById = new Map(services.map((s) => [s.id, s]));

      const bookings = input.items.map((item) => {
        const service = serviceById.get(item.serviceId);
        if (!service) throw new ReservationError('Jedna z usług już nie istnieje.');
        const start = DateTime.fromISO(item.startAt, { zone: SALON_TZ });
        if (!start.isValid) throw new ReservationError(`Nie wybrano terminu dla: ${service.name}.`);
        return { item, service, start, end: start.plus({ minutes: service.durationMin }) };
      });

      for (const [index, booking] of bookings.entries()) {
        // pozostałe pozycje koszyka – klient nie może być w dwóch miejscach naraz
        const busy = bookings
          .filter((_, i) => i !== index)
          .map((b) => ({ startAt: b.start.toUTC().toISO()!, endAt: b.end.toUTC().toISO()! }));
        const slots = await getFreeSlots(tx, {
          serviceId: booking.service.id,
          date: booking.start.toISODate()!,
          employeeId: booking.item.employeeId,
          busy,
        });
        if (!slots.some((s) => Date.parse(s.startAt) === booking.start.toMillis())) {
          throw new ReservationError(
            `Termin ${booking.start.toFormat('dd.MM HH:mm')} dla „${booking.service.name}” jest już niedostępny. Wybierz inny.`,
          );
        }
      }

      const quantities = new Map<string, number>();
      for (const { service } of bookings) quantities.set(service.id, (quantities.get(service.id) ?? 0) + 1);

      return tx.transaction.create({
        data: {
          totalAmount: bookings.reduce((sum, b) => sum + b.service.price, 0),
          paymentType: input.paymentType,
          employeeId: seller.id,
          services: {
            create: [...quantities].map(([serviceId, quantity]) => ({
              serviceId,
              quantity,
              unitPrice: serviceById.get(serviceId)!.price,
            })),
          },
          bookings: {
            create: bookings.map(({ item, start, end }) => ({
              serviceId: item.serviceId,
              employeeId: item.employeeId,
              startAt: start.toJSDate(),
              endAt: end.toJSDate(),
              clientName,
              clientPhone,
              note: input.note?.trim() || null,
            })),
          },
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    revalidatePath('/transactions');
    revalidatePath('/calendar');
    return { ok: true, transactionId: transaction.id };
  } catch (error) {
    if (error instanceof ReservationError) return { ok: false, error: error.message };
    // konflikt serializacji lub naruszenie Booking_no_overlap = ktoś właśnie zajął termin
    console.error('Reservation failed:', error);
    return { ok: false, error: 'Ktoś właśnie zarezerwował jeden z wybranych terminów. Odśwież sloty i spróbuj ponownie.' };
  }
}
