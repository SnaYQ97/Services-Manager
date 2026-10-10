import 'server-only';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { Role } from '../../generated/prisma';

export const EMPLOYEE_COOKIE = 'employeeId';

// Brak prawdziwego logowania: zalogowanego pracownika wybiera się w TopBar (cookie).
// Bez cookie domyślnie pierwszy pracownik alfabetycznie.
export async function getCurrentEmployee() {
  const id = (await cookies()).get(EMPLOYEE_COOKIE)?.value;
  const employee = id ? await prisma.employee.findUnique({ where: { id } }) : null;
  return employee ?? prisma.employee.findFirst({ orderBy: { name: 'asc' } });
}

export async function isManager() {
  const employee = await getCurrentEmployee();
  return employee?.role === Role.MANAGER;
}

export async function requireManager() {
  if (!(await isManager())) throw new Error('Ta operacja wymaga roli kierownika.');
}
