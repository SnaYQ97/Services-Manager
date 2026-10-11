"use client";

import { useState, useTransition } from "react";
import { login } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Pola kontrolowane – po błędnym haśle e-mail zostaje w formularzu
// notice – komunikat po wylogowaniu (zmiana hasła, bezczynność)
const LoginForm = ({ callbackUrl, notice }: { callbackUrl: string; notice: string | null }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const message = await login({ email, password, callbackUrl });
      if (message) {
        setError(message);
        setPassword('');
      }
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Logowanie</CardTitle>
        <CardDescription>Panel recepcji i kierownika.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {notice && !error && (
            <p className="rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-soft-foreground">{notice}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="login-email">E-mail</Label>
            <Input id="login-email" type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-password">Hasło</Label>
            <Input id="login-password" type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Logowanie…' : 'Zaloguj'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
