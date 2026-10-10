import type { NextAuthConfig } from 'next-auth';

// Część konfiguracji bez Prismy/bcrypt – używana też w middleware (edge runtime)
export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      if (nextUrl.pathname.startsWith('/login')) {
        return isLoggedIn ? Response.redirect(new URL('/', nextUrl)) : true;
      }
      return isLoggedIn; // false = przekierowanie na /login
    },
    jwt({ token, user }) {
      if (user?.id) token.employeeId = user.id;
      return token;
    },
    session({ session, token }) {
      if (typeof token.employeeId === 'string') session.user.id = token.employeeId;
      return session;
    },
  },
} satisfies NextAuthConfig;
