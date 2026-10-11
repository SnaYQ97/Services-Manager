// Czas sesji ustawia kierownik w Zarządzanie → Ustawienia; te wartości obowiązują, dopóki nic nie zapisano.
// Granice pilnuje też baza (CHECK w migracji 20261011150000_session_settings).
export const DEFAULT_IDLE_MINUTES = 30;
export const DEFAULT_MAX_HOURS = 8;
export const IDLE_MINUTES_RANGE = { min: 5, max: 240 } as const;
export const MAX_HOURS_RANGE = { min: 1, max: 24 } as const;

export interface SessionSettings {
  idleMinutes: number; // wylogowanie po bezczynności
  maxHours: number; // twardy limit od zalogowania
}
