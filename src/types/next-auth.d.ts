import 'next-auth';

declare module 'next-auth' {
  interface User {
    sessionId?: string; // id wiersza AuthSession – sesja ważna, dopóki wiersz istnieje
  }
}
