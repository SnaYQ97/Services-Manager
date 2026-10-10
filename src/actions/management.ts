'use server'

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireManager } from '@/lib/session';
import { timeToMinutes } from '@/lib/time';
import { Prisma, Role } from '../../generated/prisma';

export async function getManagementData() {
  await requireManager();
  const [employees, services] = await Promise.all([
    prisma.employee.findMany({
      orderBy: { name: 'asc' },
      include: { services: true, workingHours: { orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }] } },
    }),
    prisma.service.findMany({ orderBy: { name: 'asc' }, include: { employees: true } }),
  ]);

  return {
    employees: employees.map((e) => ({
      id: e.id,
      name: e.name,
      email: e.email,
      role: e.role,
      serviceIds: e.services.map((s) => s.serviceId),
      workingHours: e.workingHours.map(({ weekday, startMinute, endMinute }) => ({ weekday, startMinute, endMinute })),
    })),
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      durationMin: s.durationMin,
      employeeIds: s.employees.map((e) => e.employeeId),
    })),
  };
}

export type ManagementData = Awaited<ReturnType<typeof getManagementData>>;
export type SaveResult = { ok: true } | { ok: false; error: string };

export interface EmployeeInput {
  id?: string;
  name: string;
  email: string;
  role: Role;
  serviceIds: string[];
  workingHours: { weekday: number; start: string; end: string }[];
}

export async function saveEmployee(input: EmployeeInput): Promise<SaveResult> {
  await requireManager();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name || !email) return { ok: false, error: 'Podaj imię i e-mail.' };

  const workingHours = input.workingHours.map(({ weekday, start, end }) => ({
    weekday,
    startMinute: timeToMinutes(start),
    endMinute: timeToMinutes(end),
  }));
  if (workingHours.some((w) => !(w.startMinute < w.endMinute))) {
    return { ok: false, error: 'W grafiku godzina „od” musi być wcześniejsza niż „do”.' };
  }

  if (input.id && input.role !== Role.MANAGER) {
    const otherManagers = await prisma.employee.count({ where: { role: Role.MANAGER, id: { not: input.id } } });
    if (otherManagers === 0) return { ok: false, error: 'Musi zostać przynajmniej jeden kierownik.' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const data = { name, email, role: input.role };
      const employee = input.id
        ? await tx.employee.update({ where: { id: input.id }, data })
        : await tx.employee.create({ data });

      await tx.employeeService.deleteMany({ where: { employeeId: employee.id } });
      await tx.employeeService.createMany({
        data: input.serviceIds.map((serviceId) => ({ employeeId: employee.id, serviceId })),
      });
      await tx.workingHours.deleteMany({ where: { employeeId: employee.id } });
      await tx.workingHours.createMany({ data: workingHours.map((w) => ({ ...w, employeeId: employee.id })) });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, error: 'Pracownik z tym adresem e-mail już istnieje.' };
    }
    throw error;
  }

  revalidatePath('/', 'layout');
  return { ok: true };
}

export interface ServiceInput {
  id?: string;
  name: string;
  price: number;
  durationMin: number;
  employeeIds: string[];
}

export async function saveService(input: ServiceInput): Promise<SaveResult> {
  await requireManager();
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Podaj nazwę usługi.' };
  if (!(input.price >= 0)) return { ok: false, error: 'Cena musi być liczbą nieujemną.' };
  if (!Number.isInteger(input.durationMin) || input.durationMin < 15 || input.durationMin % 15 !== 0) {
    return { ok: false, error: 'Czas trwania musi być wielokrotnością 15 minut.' };
  }

  await prisma.$transaction(async (tx) => {
    const data = { name, price: input.price, durationMin: input.durationMin };
    const service = input.id
      ? await tx.service.update({ where: { id: input.id }, data })
      : await tx.service.create({ data });

    await tx.employeeService.deleteMany({ where: { serviceId: service.id } });
    await tx.employeeService.createMany({
      data: input.employeeIds.map((employeeId) => ({ employeeId, serviceId: service.id })),
    });
  });

  revalidatePath('/', 'layout');
  return { ok: true };
}
