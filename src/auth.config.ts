import type { NextAuthConfig } from 'next-auth';

// Wspólny komputer w recepcji – sesja wygasa po 12 godzinach
export const SESSION_MAX_AGE = 12 * 60 * 60;

// Część konfiguracji bez Prismy/bcrypt – używana też w middleware (edge runtime)
export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      // gość bez logowania: tylko usługi i wolne terminy
      if (nextUrl.pathname === '/guest') return true;
      if (nextUrl.pathname.startsWith('/login')) {
        return isLoggedIn ? Response.redirect(new URL('/', nextUrl)) : true;
      }
      return isLoggedIn; // false = przekierowanie na /login
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.employeeId = user.id;
        token.sessionVersion = user.sessionVersion;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.employeeId === 'string') session.user.id = token.employeeId;
      // wersja sesji porównywana z bazą w getCurrentEmployee – zmiana hasła unieważnia stare sesje
      session.user.sessionVersion = typeof token.sessionVersion === 'number' ? token.sessionVersion : -1;
      return session;
    },
  },
} satisfies NextAuthConfig;
