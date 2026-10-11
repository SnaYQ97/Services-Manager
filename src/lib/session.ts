import 'server-only';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { activeSessionWhere, getSessionSettings } from '@/lib/sessionSettings';
import { Role } from '../../generated/prisma';

// Aktywność zapisywana najwyżej raz na minutę – bez zapisu do bazy przy każdym żądaniu
const TOUCH_INTERVAL_MS = 60_000;

// Rola czytana z bazy przy każdym żądaniu – zmiana roli działa bez ponownego logowania.
// Token jest ważny tylko razem z wierszem AuthSession: wylogowanie, zmiana hasła lub wylogowanie
// przez kierownika usuwa wiersz i stary token (także skopiowany) przestaje działać od razu.
// touch: false – żądanie w tle (np. odpytywanie dzwonka) nie przedłuża sesji
export async function getCurrentEmployee({ touch = true } = {}) {
  const [user, settings] = await Promise.all([auth().then((s) => s?.user), getSessionSettings()]);
  if (!user?.id || !user.sessionId) return null;
  const now = new Date();
  const session = await prisma.authSession.findFirst({
    where: { id: user.sessionId, employeeId: user.id, ...activeSessionWhere(settings, now) },
    include: { employee: true },
  });
  if (!session) return null;
  if (touch && now.getTime() - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await prisma.authSession.updateMany({ where: { id: session.id }, data: { lastSeenAt: now } });
  }
  return session.employee;
}

export async function isManager(options?: { touch?: boolean }) {
  const employee = await getCurrentEmployee(options);
  return employee?.role === Role.MANAGER;
}

export async function requireManager(options?: { touch?: boolean }) {
  if (!(await isManager(options))) throw new Error('Ta operacja wymaga roli kierownika.');
}

/** Dane klientów (kalendarz, transakcje) – tylko dla zalogowanych; gość widzi wyłącznie usługi i wolne terminy */
export async function requireEmployee() {
  const employee = await getCurrentEmployee();
  if (!employee) throw new Error('Zaloguj się, aby zobaczyć te dane.');
  return employee;
}
