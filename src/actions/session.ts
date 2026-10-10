'use server'

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { EMPLOYEE_COOKIE } from '@/lib/session';

export async function setCurrentEmployee(employeeId: string) {
  (await cookies()).set(EMPLOYEE_COOKIE, employeeId, { httpOnly: true, sameSite: 'lax', path: '/' });
  revalidatePath('/', 'layout');
}
