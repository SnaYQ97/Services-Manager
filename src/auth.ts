import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authConfig } from './auth.config';

export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

export class AccountLockedError extends CredentialsSignin {
  code = 'locked';
}

// Porównanie z atrapą, gdy konto nie istnieje – podobny czas odpowiedzi nie zdradza, które e-maile są w bazie
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hash('dummy-password', 12));

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '').trim().toLowerCase();
        const password = String(credentials?.password ?? '');
        if (!email || !password) return null;

        const employee = await prisma.employee.findUnique({ where: { email } });
        if (!employee?.passwordHash) {
          await bcrypt.compare(password, await getDummyHash());
          return null;
        }
        if (employee.lockedUntil && employee.lockedUntil > new Date()) throw new AccountLockedError();

        if (!(await bcrypt.compare(password, employee.passwordHash))) {
          const { failedLogins } = await prisma.employee.update({
            where: { id: employee.id },
            data: { failedLogins: { increment: 1 } },
          });
          if (failedLogins >= MAX_FAILED_LOGINS) {
            await prisma.employee.update({
              where: { id: employee.id },
              data: { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000) },
            });
            throw new AccountLockedError();
          }
          return null;
        }

        if (employee.failedLogins > 0 || employee.lockedUntil) {
          await prisma.employee.update({ where: { id: employee.id }, data: { failedLogins: 0, lockedUntil: null } });
        }
        return { id: employee.id, name: employee.name, email: employee.email, sessionVersion: employee.sessionVersion };
      },
    }),
  ],
});
