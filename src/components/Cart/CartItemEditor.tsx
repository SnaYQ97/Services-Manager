"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { getNextFreeDate, getSlots } from "@/actions/booking";
import type { Interval, Slot } from "@/lib/availability";
import { formatTime, salonDay, salonToday } from "@/lib/time";
import { CartItem } from "./types";

interface Props {
  item: CartItem;
  busy: Interval[];        // terminy pozostałych pozycji koszyka
  refreshToken: number;    // zmiana wymusza ponowne pobranie slotów
  onChange: (patch: Partial<CartItem>) => void;
  onRemove: () => void;
}

const CartItemEditor = ({ item, busy, refreshToken, onChange, onRemove }: Props) => {
  const { service } = item;
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [noFreeDate, setNoFreeDate] = useState(false);
  const busyKey = JSON.stringify(busy);
  const employeeName = (id: string) => service.employees.find(({ employee }) => employee.id === id)?.employee.name ?? '';

  useEffect(() => {
    let cancelled = false;
    setSlots(null);
    getSlots({ serviceId: service.id, date: item.date, employeeId: item.employeeId, busy: JSON.parse(busyKey) })
      .then((result) => {
        if (cancelled) return;
        setSlots(result);
        // wybrany termin przestał być dostępny (zmiana dnia, specjalisty lub koliduje z inną pozycją)
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

  // nowa pozycja: od razu przejdź do najbliższego dnia z wolnym terminem
  useEffect(() => {
    if (!item.slot) jumpToNextFree(item.date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.employeeId]);

  const shiftDate = (days: number) => {
    const date = salonDay(item.date).plus({ days }).toISODate()!;
    if (date >= salonToday()) onChange({ date });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="font-semibold text-gray-800">{service.name}</p>
          <p className="text-sm text-gray-500">${service.price.toFixed(2)} · {service.durationMin} min</p>
        </div>
        <button onClick={onRemove} className="text-sm text-red-600 hover:text-red-800">Usuń</button>
      </div>

      <div className="flex flex-wrap gap-3 items-center text-sm">
        <label className="flex items-center gap-2">
          Specjalista:
          <select
            className="border border-gray-200 rounded-md px-2 py-1"
            value={item.employeeId ?? ''}
            onChange={(e) => onChange({ employeeId: e.target.value || null, slot: null })}
          >
            <option value="">Dowolny wolny</option>
            {service.employees.map(({ employee }) => (
              <option key={employee.id} value={employee.id}>{employee.name}</option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <button onClick={() => shiftDate(-1)} disabled={item.date <= salonToday()} className="px-2 py-1 rounded-md border border-gray-200 disabled:opacity-40">‹</button>
          <input
            type="date"
            className="border border-gray-200 rounded-md px-2 py-1"
            min={salonToday()}
            value={item.date}
            onChange={(e) => e.target.value && onChange({ date: e.target.value })}
          />
          <button onClick={() => shiftDate(1)} className="px-2 py-1 rounded-md border border-gray-200">›</button>
        </div>

        <button
          onClick={() => jumpToNextFree(salonDay(item.date).plus({ days: 1 }).toISODate()!)}
          disabled={searching}
          className="px-2 py-1 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
        >
          {searching ? 'Szukam…' : 'Następny wolny dzień'}
        </button>
      </div>

      <p className="text-sm text-gray-600">
        {DateTime.fromISO(item.date).setLocale('pl').toFormat('cccc, d LLLL yyyy')}
      </p>

      {slots === null ? (
        <p className="text-sm text-gray-400">Ładowanie terminów…</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-gray-500">
          {noFreeDate ? 'Brak wolnych terminów u wybranego specjalisty.' : 'Brak wolnych terminów tego dnia.'}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => {
            const selected = item.slot?.startAt === slot.startAt;
            return (
              <button
                key={slot.startAt}
                title={slot.employeeIds.map(employeeName).join(', ')}
                onClick={() => onChange({
                  slot: {
                    startAt: slot.startAt,
                    endAt: slot.endAt,
                    // zostaw wcześniej przypisanego specjalistę, jeśli nadal jest wolny
                    employeeId: selected && slot.employeeIds.includes(item.slot!.employeeId) ? item.slot!.employeeId : slot.employeeIds[0],
                  },
                })}
                className={`text-sm px-2.5 py-1 rounded-md border ${
                  selected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 hover:border-blue-400'
                }`}
              >
                {formatTime(slot.startAt)}
              </button>
            );
          })}
        </div>
      )}

      {item.slot && (
        <p className="text-sm text-green-700">
          Wybrano: {formatTime(item.slot.startAt)}–{formatTime(item.slot.endAt)}, {employeeName(item.slot.employeeId)}
        </p>
      )}
    </div>
  );
};

export default CartItemEditor;
