import Link from "next/link";
import LoginForm from "@/components/Account/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; changed?: string }> }) {
  const { callbackUrl, changed } = await searchParams;
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-10">
      <p className="text-lg font-semibold tracking-tight">Service Manager</p>
      <LoginForm callbackUrl={callbackUrl ?? '/'} passwordChanged={changed === '1'} />
      <Link href="/guest" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        Przeglądaj usługi i wolne terminy jako gość
      </Link>
    </main>
  );
}
