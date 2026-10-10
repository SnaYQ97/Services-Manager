import 'server-only';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '../../generated/prisma';

// Rola czytana z bazy przy każdym żądaniu – zmiana roli działa bez ponownego logowania.
// Sesja wydana przed zmianą hasła (inna sessionVersion) jest traktowana jak wylogowana.
export async function getCurrentEmployee() {
  const user = (await auth())?.user;
  if (!user?.id) return null;
  const employee = await prisma.employee.findUnique({ where: { id: user.id } });
  return employee && employee.sessionVersion === user.sessionVersion ? employee : null;
}

export async function isManager() {
  const employee = await getCurrentEmployee();
  return employee?.role === Role.MANAGER;
}

export async function requireManager() {
  if (!(await isManager())) throw new Error('Ta operacja wymaga roli kierownika.');
}
