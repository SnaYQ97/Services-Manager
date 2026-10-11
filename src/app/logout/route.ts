import { redirect } from 'next/navigation';
import { signOut } from '@/auth';
import { getCurrentEmployee } from '@/lib/session';

// Czyści nieaktualną sesję (np. po zmianie hasła) – layout przekierowuje tu zwykłym GET.
// Ważnej sesji GET nie kończy, więc obcy link lub obrazek nie wyloguje pracownika (CSRF);
// przycisk „Wyloguj” używa akcji serwerowej (POST).
export async function GET() {
  if (await getCurrentEmployee()) redirect('/');
  await signOut({ redirectTo: '/login' });
}
