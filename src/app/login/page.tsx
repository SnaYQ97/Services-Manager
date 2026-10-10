import LoginForm from "@/components/Account/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  return (
    <div className="container mx-auto p-2 flex justify-center">
      <LoginForm callbackUrl={callbackUrl ?? '/'} />
    </div>
  );
}
