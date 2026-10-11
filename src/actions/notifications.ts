'use server'

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireManager } from '@/lib/session';

const RECENT_LIMIT = 20;

/** Ostatnie powiadomienia dla dzwonka kierownika (wspólne dla wszystkich kierowników) */
export async function getNotifications() {
  await requireManager();
  const now = new Date();
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: RECENT_LIMIT,
      include: { employee: { select: { id: true, name: true, lockedUntil: true } } },
    }),
    prisma.notification.count({ where: { readAt: null } }),
  ]);

  return {
    unread,
    items: items.map((n) => ({
      id: n.id,
      type: n.type,
      createdAt: n.createdAt.toISOString(),
      read: n.readAt !== null,
      ipAddress: n.ipAddress,
      employeeId: n.employee.id,
      employeeName: n.employee.name,
      // przycisk „Odblokuj” tylko, gdy blokada nadal trwa
      stillLocked: !!n.employee.lockedUntil && n.employee.lockedUntil > now,
    })),
  };
}

export type NotificationsData = Awaited<ReturnType<typeof getNotifications>>;

/** Bez listy id – oznacza wszystkie nieprzeczytane */
export async function markNotificationsRead(ids?: string[]) {
  await requireManager();
  await prisma.notification.updateMany({
    where: { readAt: null, ...(ids ? { id: { in: ids.map(String) } } : {}) },
    data: { readAt: new Date() },
  });
  revalidatePath('/', 'layout');
}
