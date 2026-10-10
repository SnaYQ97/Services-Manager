import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // wszystko poza endpointami Auth.js i plikami statycznymi wymaga zalogowania
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)'],
};
