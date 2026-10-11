import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { DEFAULT_IDLE_MINUTES, DEFAULT_MAX_HOURS, type SessionSettings } from '@/lib/sessionLimits';
import type { Prisma } from '../../generated/prisma';

// Przeglądarka wylogowuje równo po czasie bezczynności; serwer daje zapas na zapis aktywności co minutę
const IDLE_GRACE_MS = 2 * 60_000;

/** Czas sesji z Zarządzanie → Ustawienia (jedno zapytanie na żądanie) */
export const getSessionSettings = cache(async (): Promise<SessionSettings> => {
  const row = await prisma.appSettings.findUnique({ where: { id: 1 } });
  return {
    idleMinutes: row?.sessionIdleMinutes ?? DEFAULT_IDLE_MINUTES,
    maxHours: row?.sessionMaxHours ?? DEFAULT_MAX_HOURS,
  };
});

/** Sesje wciąż ważne: aktywne w czasie bezczynności i przed twardym limitem od zalogowania */
export function activeSessionWhere(settings: SessionSettings, now = new Date()): Prisma.AuthSessionWhereInput {
  return {
    lastSeenAt: { gt: new Date(now.getTime() - settings.idleMinutes * 60_000 - IDLE_GRACE_MS) },
    createdAt: { gt: new Date(now.getTime() - settings.maxHours * 3_600_000) },
  };
}
