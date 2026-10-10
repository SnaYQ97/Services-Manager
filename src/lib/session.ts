import 'server-only';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '../../generated/prisma';

// Rola czytana z bazy przy każdym żądaniu – zmiana roli działa bez ponownego logowania
export async function getCurrentEmployee() {
  const id = (await auth())?.user?.id;
  return id ? prisma.employee.findUnique({ where: { id } }) : null;
}

export async function isManager() {
  const employee = await getCurrentEmployee();
  return employee?.role === Role.MANAGER;
}

export async function requireManager() {
  if (!(await isManager())) throw new Error('Ta operacja wymaga roli kierownika.');
}
