import { signOut } from '@/auth';

// Wylogowanie po stronie serwera, gdy sesja jest nieaktualna (np. po zmianie hasła).
// Celowo bez linków w UI – przycisk „Wyloguj” używa akcji serwerowej.
export async function GET() {
  await signOut({ redirectTo: '/login' });
}
