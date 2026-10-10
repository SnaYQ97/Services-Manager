import type { BookableService } from "@/actions/booking";

export interface SelectedSlot {
  startAt: string;
  endAt: string;
  employeeId: string; // konkretny specjalista przypisany do wizyty
}

export interface CartItem {
  key: string;
  service: BookableService;
  employeeId: string | null; // wybór recepcji; null = dowolny wolny specjalista
  date: string;              // yyyy-MM-dd w strefie salonu
  slot: SelectedSlot | null;
}
