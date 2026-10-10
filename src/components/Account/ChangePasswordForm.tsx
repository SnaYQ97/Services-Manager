"use client";

import { useState, useTransition } from "react";
import { changeOwnPassword } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Pola kontrolowane – po błędzie formularz nie czyści wpisanych wartości
const ChangePasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // przy sukcesie akcja wylogowuje i przekierowuje na logowanie
    startTransition(async () => setError(await changeOwnPassword({ currentPassword, newPassword, repeatPassword })));
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Zmiana hasła</CardTitle>
        <CardDescription>Po zmianie hasła wszystkie sesje zostaną wylogowane, także ta.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Obecne hasło</Label>
            <Input id="current-password" type="password" required autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Nowe hasło</Label>
            <Input id="new-password" type="password" required minLength={8} autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="repeat-password">Powtórz nowe hasło</Label>
            <Input id="repeat-password" type="password" required autoComplete="new-password" value={repeatPassword} onChange={e => setRepeatPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button type="submit" disabled={isPending}>{isPending ? 'Zapisywanie…' : 'Zmień hasło'}</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChangePasswordForm;
