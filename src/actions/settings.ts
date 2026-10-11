'use server'

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireManager } from '@/lib/session';
import { getSessionSettings } from '@/lib/sessionSettings';
import { IDLE_MINUTES_RANGE, MAX_HOURS_RANGE, type SessionSettings } from '@/lib/sessionLimits';
import type { SaveResult } from './management';

// Na razie kierownik; docelowo konto administratora
export async function getSettings() {
  await requireManager();
  return getSessionSettings();
}

const inRange = (value: unknown, range: { min: number; max: number }) =>
  Number.isInteger(value) && (value as number) >= range.min && (value as number) <= range.max;

/** Działa od razu dla wszystkich, także już zalogowanych */
export async function saveSessionSettings(input: SessionSettings): Promise<SaveResult> {
  await requireManager();
  const { idleMinutes, maxHours } = input;
  if (!inRange(idleMinutes, IDLE_MINUTES_RANGE)) {
    return { ok: false, error: `Czas bezczynności musi wynosić od ${IDLE_MINUTES_RANGE.min} do ${IDLE_MINUTES_RANGE.max} minut.` };
  }
  if (!inRange(maxHours, MAX_HOURS_RANGE)) {
    return { ok: false, error: `Maksymalny czas sesji musi wynosić od ${MAX_HOURS_RANGE.min} do ${MAX_HOURS_RANGE.max} godzin.` };
  }
  if (idleMinutes > maxHours * 60) {
    return { ok: false, error: 'Czas bezczynności nie może być dłuższy niż maksymalny czas sesji.' };
  }

  const data = { sessionIdleMinutes: idleMinutes, sessionMaxHours: maxHours };
  await prisma.appSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  // layout przekazuje czas bezczynności do licznika w przeglądarce
  revalidatePath('/', 'layout');
  return { ok: true };
}
