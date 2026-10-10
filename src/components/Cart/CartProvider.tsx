"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CartItem } from "./types";

interface CartContextValue {
  items: CartItem[];
  hydrated: boolean; // koszyk wczytany z przeglądarki
  add: (item: Omit<CartItem, "key">) => void;
  update: (key: string, patch: Partial<CartItem>) => void;
  remove: (key: string) => void;
  removeLastOf: (serviceId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

// crypto.randomUUID działa tylko w bezpiecznym kontekście (https/localhost), a recepcja może wejść po http w sieci lokalnej
const newKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const readStoredItems = (storageKey: string): CartItem[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item?.serviceId === "string") : [];
  } catch {
    return [];
  }
};

/** Koszyk przeżywa przejścia między stronami i odświeżenie; każdy pracownik ma własny (localStorage). */
export function CartProvider({ employeeId, children }: { employeeId: string; children: React.ReactNode }) {
  const storageKey = `cart:${employeeId}`;
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredItems(storageKey));
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // brak dostępu do localStorage (tryb prywatny) – koszyk działa tylko do odświeżenia
    }
  }, [items, hydrated, storageKey]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    hydrated,
    add: (item) => setItems((prev) => [...prev, { ...item, key: newKey() }]),
    update: (key, patch) => setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item))),
    remove: (key) => setItems((prev) => prev.filter((item) => item.key !== key)),
    removeLastOf: (serviceId) =>
      setItems((prev) => {
        const index = prev.findLastIndex((item) => item.serviceId === serviceId);
        return index === -1 ? prev : prev.filter((_, i) => i !== index);
      }),
    clear: () => setItems([]),
  }), [items, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart musi być użyte wewnątrz CartProvider");
  return context;
}
