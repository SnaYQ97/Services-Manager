"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveSessionSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IDLE_MINUTES_RANGE, MAX_HOURS_RANGE, type SessionSettings } from "@/lib/sessionLimits";

// Pola jako tekst – puste pole nie zamienia się od razu w 0
const SessionSettingsForm = ({ initial }: { initial: SessionSettings }) => {
  const router = useRouter();
  const [idleMinutes, setIdleMinutes] = useState(String(initial.idleMinutes));
  const [maxHours, setMaxHours] = useState(String(initial.maxHours));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveSessionSettings({ idleMinutes: Number(idleMinutes), maxHours: Number(maxHours) });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Zapisano ustawienia sesji", { description: "Obowiązują od razu, także dla zalogowanych." });
      router.refresh();
    });
  };

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Sesja logowania</CardTitle>
        <CardDescription>Dotyczy wszystkich pracowników. Zmiana działa od razu, także dla osób już zalogowanych.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="idle-minutes">Wylogowanie po bezczynności</Label>
            <div className="flex items-center gap-2">
              <Input
                id="idle-minutes"
                type="number"
                inputMode="numeric"
                required
                min={IDLE_MINUTES_RANGE.min}
                max={IDLE_MINUTES_RANGE.max}
                step={1}
                className="w-24"
                value={idleMinutes}
                onChange={e => setIdleMinutes(e.target.value)}
                aria-describedby="idle-minutes-help"
              />
              <span className="text-sm text-muted-foreground">min</span>
            </div>
            <p id="idle-minutes-help" className="text-sm text-muted-foreground">
              Bez kliknięć i pisania przez ten czas aplikacja wraca do ekranu logowania. Minutę wcześniej pojawia się ostrzeżenie.
              Od {IDLE_MINUTES_RANGE.min} do {IDLE_MINUTES_RANGE.max} minut.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max-hours">Maksymalny czas sesji</Label>
            <div className="flex items-center gap-2">
              <Input
                id="max-hours"
                type="number"
                inputMode="numeric"
                required
                min={MAX_HOURS_RANGE.min}
                max={MAX_HOURS_RANGE.max}
                step={1}
                className="w-24"
                value={maxHours}
                onChange={e => setMaxHours(e.target.value)}
                aria-describedby="max-hours-help"
              />
              <span className="text-sm text-muted-foreground">godz.</span>
            </div>
            <p id="max-hours-help" className="text-sm text-muted-foreground">
              Po tym czasie od zalogowania trzeba zalogować się ponownie, nawet przy ciągłej pracy.
              Od {MAX_HOURS_RANGE.min} do {MAX_HOURS_RANGE.max} godzin.
            </p>
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button type="submit" disabled={isPending}>{isPending ? "Zapisywanie…" : "Zapisz"}</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SessionSettingsForm;
