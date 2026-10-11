import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { MAX_EMAIL_LENGTH } from '@/lib/password';
import { authConfig, SESSION_MAX_AGE } from './auth.config';
import { NotificationType } from '../generated/prisma';

export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

// Porównanie z atrapą, gdy konto nie istnieje – podobny czas odpowiedzi nie zdradza, które e-maile są w bazie
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hash('dummy-password', 12));

// Adres klienta z nagłówków (proxy / serwer Next) – tylko informacyjnie w powiadomieniu, klient może go podać sam
const clientIp = (request: Request) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip')?.trim();
  return ip ? ip.slice(0, 45) : null;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      // Każda porażka (złe hasło, brak konta, blokada) daje ten sam błąd i podobny czas odpowiedzi,
      // więc z logowania nie da się wyczytać, które konta istnieją albo są zablokowane.
      async authorize(credentials, request) {
        const email = String(credentials?.email ?? '').trim().toLowerCase();
        const password = String(credentials?.password ?? '');
        if (!email || !password || email.length > MAX_EMAIL_LENGTH) return null;

        const employee = await prisma.employee.findUnique({ where: { email } });
        if (!employee?.passwordHash) {
          await bcrypt.compare(password, await getDummyHash());
          return null;
        }

        const valid = await bcrypt.compare(password, employee.passwordHash);
        // zablokowane konto: odmowa nawet przy poprawnym haśle; kierownik może odblokować w Zarządzaniu
        if (employee.lockedUntil && employee.lockedUntil > new Date()) return null;

        if (!valid) {
          const { failedLogins } = await prisma.employee.update({
            where: { id: employee.id },
            data: { failedLogins: { increment: 1 } },
          });
          if (failedLogins >= MAX_FAILED_LOGINS) {
            await prisma.$transaction([
              prisma.employee.update({
                where: { id: employee.id },
                data: { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000) },
              }),
              // kierownik widzi to w dzwonku na górnym pasku
              prisma.notification.create({
                data: { type: NotificationType.ACCOUNT_LOCKED, employeeId: employee.id, ipAddress: clientIp(request) },
              }),
            ]);
          }
          return null;
        }

        const now = new Date();
        const [, session] = await prisma.$transaction([
          prisma.employee.update({ where: { id: employee.id }, data: { failedLogins: 0, lockedUntil: null } }),
          // jedna sesja na urządzenie, ważna stałe 12 h; przy okazji sprzątanie wygasłych sesji tej osoby
          prisma.authSession.create({
            data: { employeeId: employee.id, expiresAt: new Date(now.getTime() + SESSION_MAX_AGE * 1000) },
          }),
          prisma.authSession.deleteMany({ where: { employeeId: employee.id, expiresAt: { lte: now } } }),
        ]);
        return { id: employee.id, name: employee.name, email: employee.email, sessionId: session.id };
      },
    }),
  ],
  events: {
    // Każde wylogowanie – przycisk „Wyloguj”, /logout i wbudowane /api/auth/signout – usuwa wiersz sesji,
    // więc skopiowany wcześniej token przestaje działać
    async signOut(message) {
      const sessionId = 'token' in message ? message.token?.sessionId : undefined;
      if (typeof sessionId === 'string') await prisma.authSession.deleteMany({ where: { id: sessionId } });
    },
  },
});
