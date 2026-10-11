import 'server-only';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '../../generated/prisma';

// Rola czytana z bazy przy każdym żądaniu – zmiana roli działa bez ponownego logowania.
// Token jest ważny tylko razem z wierszem AuthSession: wylogowanie, zmiana hasła lub wylogowanie
// przez kierownika usuwa wiersz i stary token (także skopiowany) przestaje działać od razu.
export async function getCurrentEmployee() {
  const user = (await auth())?.user;
  if (!user?.id || !user.sessionId) return null;
  const session = await prisma.authSession.findUnique({ where: { id: user.sessionId }, include: { employee: true } });
  if (!session || session.employeeId !== user.id || session.expiresAt <= new Date()) return null;
  return session.employee;
}

export async function isManager() {
  const employee = await getCurrentEmployee();
  return employee?.role === Role.MANAGER;
}

export async function requireManager() {
  if (!(await isManager())) throw new Error('Ta operacja wymaga roli kierownika.');
}

/** Dane klientów (kalendarz, transakcje) – tylko dla zalogowanych; gość widzi wyłącznie usługi i wolne terminy */
export async function requireEmployee() {
  const employee = await getCurrentEmployee();
  if (!employee) throw new Error('Zaloguj się, aby zobaczyć te dane.');
  return employee;
}
