'use server'

import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { signIn, signOut } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentEmployee } from '@/lib/session';
import { hashPassword, MIN_PASSWORD_LENGTH } from '@/lib/password';

export async function login(_prev: string | null, formData: FormData): Promise<string | null> {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: String(formData.get('callbackUrl') || '/'),
    });
    return null;
  } catch (error) {
    // signIn rzuca przekierowaniem przy sukcesie – musi polecieć dalej
    if (error instanceof AuthError) return 'Nieprawidłowy e-mail lub hasło.';
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: '/login' });
}

export type PasswordResult = { ok: true } | { ok: false; error: string };

export async function changeOwnPassword(_prev: PasswordResult | null, formData: FormData): Promise<PasswordResult> {
  const employee = await getCurrentEmployee();
  if (!employee) return { ok: false, error: 'Zaloguj się ponownie.' };

  const current = String(formData.get('currentPassword') ?? '');
  const next = String(formData.get('newPassword') ?? '');
  const repeat = String(formData.get('repeatPassword') ?? '');

  if (!employee.passwordHash || !(await bcrypt.compare(current, employee.passwordHash))) {
    return { ok: false, error: 'Obecne hasło jest nieprawidłowe.' };
  }
  if (next.length < MIN_PASSWORD_LENGTH) return { ok: false, error: `Nowe hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.` };
  if (next !== repeat) return { ok: false, error: 'Nowe hasła nie są takie same.' };

  await prisma.employee.update({ where: { id: employee.id }, data: { passwordHash: await hashPassword(next) } });
  return { ok: true };
}
