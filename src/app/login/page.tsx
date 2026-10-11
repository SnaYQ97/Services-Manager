import Link from "next/link";
import LoginForm from "@/components/Account/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; changed?: string; idle?: string }> }) {
  const { callbackUrl, changed, idle } = await searchParams;
  const notice = changed === "1" ? "Hasło zmienione. Zaloguj się nowym hasłem."
    : idle === "1" ? "Wylogowano z powodu braku aktywności. Zaloguj się ponownie."
    : null;
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-10">
      <p className="text-lg font-semibold tracking-tight">Service Manager</p>
      <LoginForm callbackUrl={callbackUrl ?? '/'} notice={notice} />
      <Link href="/guest" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        Przeglądaj usługi i wolne terminy jako gość
      </Link>
    </main>
  );
}
