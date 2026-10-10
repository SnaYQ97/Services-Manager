'use server'

import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { AccountLockedError, LOCK_MINUTES, signIn, signOut } from '@/auth';
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
    // signIn rzuca przekierowaniem przy sukcesie – musi polecieć dalej
    if (error instanceof AccountLockedError) {
      return `Zbyt wiele nieudanych prób. Spróbuj ponownie za ${LOCK_MINUTES} minut.`;
    }
    if (error instanceof AuthError) return 'Nieprawidłowy e-mail lub hasło.';
    throw error;
  }
}

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

  // nowa wersja sesji wylogowuje wszystkie urządzenia, także to
  await prisma.employee.update({
    where: { id: employee.id },
    data: { passwordHash: await hashPassword(input.newPassword), sessionVersion: { increment: 1 } },
  });
  await signOut({ redirectTo: '/login?changed=1' });
  return null;
}
