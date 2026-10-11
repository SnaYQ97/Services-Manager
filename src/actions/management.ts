'use server'

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireManager } from '@/lib/session';
import { activeSessionWhere, getSessionSettings } from '@/lib/sessionSettings';
import { plural } from '@/lib/format';
import { hashPassword, MAX_EMAIL_LENGTH, MIN_PASSWORD_LENGTH } from '@/lib/password';
import { timeToMinutes } from '@/lib/time';
import { BookingStatus, Prisma, Role } from '../../generated/prisma';

const MAX_PRICE = 99_999_999.99; // DECIMAL(10,2)

export async function getManagementData() {
  await requireManager();
  const settings = await getSessionSettings();
  const [employees, services] = await Promise.all([
    prisma.employee.findMany({
      orderBy: { name: 'asc' },
      include: {
        services: true,
        workingHours: { orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }] },
        _count: { select: { sessions: { where: activeSessionWhere(settings) } } },
      },
    }),
    prisma.service.findMany({ orderBy: { name: 'asc' }, include: { employees: true } }),
  ]);
  const now = new Date();

  // tylko proste typy – Decimal nie przechodzi do komponentów klienta
  return {
    employees: employees.map((e) => ({
      id: e.id,
      name: e.name,
      email: e.email,
      role: e.role,
      hasPassword: e.passwordHash !== null,
      lockedUntil: e.lockedUntil && e.lockedUntil > now ? e.lockedUntil.toISOString() : null,
      activeSessions: e._count.sessions, // zalogowane urządzenia
      serviceIds: e.services.map((s) => s.serviceId),
      workingHours: e.workingHours.map(({ weekday, startMinute, endMinute }) => ({ weekday, startMinute, endMinute })),
    })),
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price.toNumber(),
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
  password?: string; // puste = bez zmiany
  serviceIds: string[];
  workingHours: { weekday: number; start: string; end: string }[];
}

export async function saveEmployee(input: EmployeeInput): Promise<SaveResult> {
  await requireManager();
  if (!Object.values(Role).includes(input.role)) return { ok: false, error: 'Wybierz rolę.' };
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name || !email) return { ok: false, error: 'Podaj imię i e-mail.' };
  if (email.length > MAX_EMAIL_LENGTH) return { ok: false, error: `E-mail może mieć najwyżej ${MAX_EMAIL_LENGTH} znaków.` };
  const password = input.password ?? '';
  if (password && password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.` };
  }

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

  const passwordHash = password ? await hashPassword(password) : undefined;

  try {
    await prisma.$transaction(async (tx) => {
      const data = { name, email, role: input.role };
      const employee = input.id
        ? await tx.employee.update({
            where: { id: input.id },
            // nowe hasło: wyloguj stare sesje i zdejmij blokadę logowania
            data: passwordHash
              ? { ...data, passwordHash, failedLogins: 0, lockedUntil: null }
              : data,
          })
        : await tx.employee.create({ data: { ...data, passwordHash } });
      if (input.id && passwordHash) await tx.authSession.deleteMany({ where: { employeeId: employee.id } });

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

export type ServiceSaveResult = { ok: true; id: string; warning: string | null } | { ok: false; error: string };

export async function saveService(input: ServiceInput): Promise<ServiceSaveResult> {
  await requireManager();
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Podaj nazwę usługi.' };
  if (!(input.price >= 0 && input.price <= MAX_PRICE)) return { ok: false, error: 'Podaj poprawną cenę.' };
  if (!Number.isInteger(input.durationMin) || input.durationMin < 15 || input.durationMin % 15 !== 0) {
    return { ok: false, error: 'Czas trwania musi być wielokrotnością 15 minut.' };
  }

  const { serviceId, removedIds } = await prisma.$transaction(async (tx) => {
    const data = { name, price: new Prisma.Decimal(input.price.toFixed(2)), durationMin: input.durationMin };
    const previous = input.id ? await tx.employeeService.findMany({ where: { serviceId: input.id } }) : [];
    const service = input.id
      ? await tx.service.update({ where: { id: input.id }, data })
      : await tx.service.create({ data });

    await tx.employeeService.deleteMany({ where: { serviceId: service.id } });
    await tx.employeeService.createMany({
      data: input.employeeIds.map((employeeId) => ({ employeeId, serviceId: service.id })),
    });
    return {
      serviceId: service.id,
      removedIds: previous.map((p) => p.employeeId).filter((id) => !input.employeeIds.includes(id)),
    };
  });

  // odpięty specjalista zostaje przy już umówionych wizytach – kierownik powinien o tym wiedzieć
  const futureBookings = removedIds.length
    ? await prisma.booking.count({
        where: { serviceId, employeeId: { in: removedIds }, status: BookingStatus.CONFIRMED, startAt: { gt: new Date() } },
      })
    : 0;
  const warnings = [
    input.employeeIds.length === 0 ? 'Usługa nie ma żadnego specjalisty – nie da się jej zarezerwować.' : null,
    futureBookings > 0
      ? `${futureBookings} ${plural(futureBookings, ['przyszła wizyta', 'przyszłe wizyty', 'przyszłych wizyt'])} u odpiętych specjalistów zostaje w kalendarzu.`
      : null,
  ].filter(Boolean);

  revalidatePath('/', 'layout');
  return { ok: true, id: serviceId, warning: warnings.length ? warnings.join(' ') : null };
}

/** Zdjęcie blokady logowania (po zbyt wielu błędnych hasłach) bez zmiany hasła */
export async function unlockEmployee(employeeId: string): Promise<SaveResult> {
  await requireManager();
  await prisma.employee.update({ where: { id: employeeId }, data: { failedLogins: 0, lockedUntil: null } });
  revalidatePath('/management/employees');
  return { ok: true };
}

/** Wylogowanie pracownika ze wszystkich urządzeń (np. zgubiony telefon, odejście z pracy) */
export async function endEmployeeSessions(employeeId: string): Promise<SaveResult> {
  await requireManager();
  await prisma.authSession.deleteMany({ where: { employeeId } });
  revalidatePath('/management/employees');
  return { ok: true };
}
