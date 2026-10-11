'use server'

import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { LOCK_MINUTES, MAX_FAILED_LOGINS, signIn, signOut } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentEmployee } from '@/lib/session';
import { hashPassword, MIN_PASSWORD_LENGTH } from '@/lib/password';

export async function login(input: { email: string; password: string; callbackUrl: string }): Promise<string | null> {
  try {
    await signIn('credentials', {
      email: input.email,
      password: input.password,
      redirectTo: input.callbackUrl || '/',
    });
    return null;
  } catch (error) {
    // signIn rzuca przekierowaniem przy sukcesie – musi polecieć dalej.
    // Jeden komunikat dla każdej porażki – nie zdradza, czy konto istnieje lub jest zablokowane.
    if (error instanceof AuthError) {
      return `Nieprawidłowy e-mail lub hasło. Po ${MAX_FAILED_LOGINS} nieudanych próbach logowanie jest blokowane na ${LOCK_MINUTES} minut.`;
    }
    throw error;
  }
}

/** Kończy tylko tę sesję (to urządzenie) – wiersz sesji usuwa zdarzenie signOut w auth.ts */
export async function logout() {
  await signOut({ redirectTo: '/login' });
}

export async function changeOwnPassword(input: {
  currentPassword: string;
  newPassword: string;
  repeatPassword: string;
}): Promise<string | null> {
  const employee = await getCurrentEmployee();
  if (!employee) return 'Zaloguj się ponownie.';

  if (!employee.passwordHash || !(await bcrypt.compare(input.currentPassword, employee.passwordHash))) {
    return 'Obecne hasło jest nieprawidłowe.';
  }
  if (input.newPassword.length < MIN_PASSWORD_LENGTH) return `Nowe hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`;
  if (input.newPassword !== input.repeatPassword) return 'Nowe hasła nie są takie same.';

  // nowe hasło wylogowuje wszystkie urządzenia, także to
  await prisma.$transaction([
    prisma.employee.update({ where: { id: employee.id }, data: { passwordHash: await hashPassword(input.newPassword) } }),
    prisma.authSession.deleteMany({ where: { employeeId: employee.id } }),
  ]);
  await signOut({ redirectTo: '/login?changed=1' });
  return null;
}
