import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authConfig } from './auth.config';

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
        if (!employee?.passwordHash) return null;
        if (!(await bcrypt.compare(password, employee.passwordHash))) return null;

        return { id: employee.id, name: employee.name, email: employee.email };
      },
    }),
  ],
});
