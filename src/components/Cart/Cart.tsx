"use client";

import { Dispatch, SetStateAction, useState, useTransition } from "react";
import Link from "next/link";
import { createReservation } from "@/actions/booking";
import { PaymentType } from "../../../generated/prisma";
import { formatDate, formatTime } from "@/lib/time";
import CartItemEditor from "./CartItemEditor";
import { CartItem } from "./types";

interface Props {
  items: CartItem[];
  setItems: Dispatch<SetStateAction<CartItem[]>>;
}

interface Confirmation {
  transactionId: string;
  clientName: string;
  lines: string[];
}

const Cart = ({ items, setItems }: Props) => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [note, setNote] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.CARD);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [isPending, startTransition] = useTransition();

  const updateItem = (key: string, patch: Partial<CartItem>) =>
    setItems(prev => prev.map(item => item.key === key ? { ...item, ...patch } : item));

  const total = items.reduce((sum, item) => sum + item.service.price, 0);
  const allScheduled = items.length > 0 && items.every(item => item.slot);
  const canSubmit = allScheduled && clientName.trim() !== '' && clientPhone.trim() !== '' && !isPending;

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createReservation({
        clientName,
        clientPhone,
        note,
        paymentType,
        items: items.map(item => ({
          serviceId: item.service.id,
          employeeId: item.slot!.employeeId,
          startAt: item.slot!.startAt,
        })),
      });

      if (!result.ok) {
        setError(result.error);
        setRefreshToken(t => t + 1);
        return;
      }

      setConfirmation({
        transactionId: result.transactionId,
        clientName,
        lines: items.map(item => `${item.service.name} – ${formatDate(item.slot!.startAt)}, ${formatTime(item.slot!.startAt)}`),
      });
      setItems([]);
      setClientName('');
      setClientPhone('');
      setNote('');
    });
  };

  return (
    <section className="flex flex-col gap-4 flex-auto w-full">
      <h1 className="text-3xl font-bold text-gray-900">Koszyk</h1>

      {confirmation && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
          <p className="font-semibold">Rezerwacja opłacona – {confirmation.clientName}</p>
          <ul className="list-disc ml-5 my-2">
            {confirmation.lines.map(line => <li key={line}>{line}</li>)}
          </ul>
          <Link href="/calendar" className="underline">Zobacz w kalendarzu</Link>
          {' · '}
          <Link href="/transactions" className="underline">Transakcja #{confirmation.transactionId}</Link>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-gray-500">Koszyk jest pusty. Dodaj usługę z listy.</p>
      ) : (
        <>
          {items.map(item => (
            <CartItemEditor
              key={item.key}
              item={item}
              busy={items
                .filter(other => other.key !== item.key && other.slot)
                .map(other => ({ startAt: other.slot!.startAt, endAt: other.slot!.endAt }))}
              refreshToken={refreshToken}
              onChange={patch => updateItem(item.key, patch)}
              onRemove={() => setItems(prev => prev.filter(other => other.key !== item.key))}
            />
          ))}

          <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col gap-3">
            <h2 className="font-semibold text-gray-800">Klient i płatność</h2>
            <div className="flex flex-wrap gap-3">
              <input
                className="border border-gray-200 rounded-md px-3 py-2 flex-auto"
                placeholder="Imię i nazwisko"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
              />
              <input
                className="border border-gray-200 rounded-md px-3 py-2 flex-auto"
                placeholder="Telefon"
                type="tel"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
              />
            </div>
            <textarea
              className="border border-gray-200 rounded-md px-3 py-2"
              placeholder="Notatka (opcjonalnie)"
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <div className="flex gap-4 text-sm">
              {[{ value: PaymentType.CARD, label: 'Karta' }, { value: PaymentType.CASH, label: 'Gotówka' }].map(option => (
                <label key={option.value} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="paymentType"
                    checked={paymentType === option.value}
                    onChange={() => setPaymentType(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {!allScheduled && <p className="text-sm text-gray-500">Wybierz termin dla każdej usługi.</p>}

            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="font-semibold">Razem: ${total.toFixed(2)}</span>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? 'Zapisywanie…' : 'Zarezerwuj i zapłać'}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default Cart;
