"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { idleLogout, keepAlive } from "@/actions/account";

const ACTIVITY_KEY = "lastActivity"; // wspólne dla kart – praca w jednej nie wylogowuje drugiej
const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "scroll", "touchstart"] as const;
const WRITE_THROTTLE_MS = 1_000;
const HEARTBEAT_MS = 60_000; // serwer zapisuje aktywność najwyżej raz na minutę
const WARNING_MS = 60_000;
const CHECK_MS = 5_000;
const WARNING_TOAST_ID = "idle-logout";

/**
 * Wylogowuje po czasie bezczynności z Zarządzanie → Ustawienia, minutę wcześniej ostrzega.
 * Na wspólnym komputerze w recepcji dane klientów nie zostają na ekranie. Serwer i tak odrzuca
 * sesję po tym czasie – licznik tylko przenosi na ekran logowania, zanim ktoś zobaczy stare dane.
 */
const IdleLogout = ({ idleMinutes }: { idleMinutes: number }) => {
  useEffect(() => {
    const idleMs = idleMinutes * 60_000;
    let lastActivity = 0; // kopia w pamięci, gdy localStorage niedostępny
    let lastBeat = Date.now(); // wyrenderowanie strony już odświeżyło sesję na serwerze
    let warned = false;
    let loggingOut = false;

    const readActivity = () => {
      try {
        return Math.max(lastActivity, Number(localStorage.getItem(ACTIVITY_KEY)) || 0);
      } catch {
        return lastActivity;
      }
    };

    const onActivity = () => {
      const now = Date.now();
      if (now - lastActivity < WRITE_THROTTLE_MS) return;
      lastActivity = now;
      try {
        localStorage.setItem(ACTIVITY_KEY, String(now));
      } catch { /* tryb prywatny – wystarczy pamięć tej karty */ }
      if (now - lastBeat >= HEARTBEAT_MS) {
        lastBeat = now;
        keepAlive().catch(() => { /* sesja wygasła – następne przejście trafi na logowanie */ });
      }
    };

    const check = () => {
      if (loggingOut) return;
      const idle = Date.now() - readActivity();
      if (idle >= idleMs) {
        loggingOut = true;
        toast.dismiss(WARNING_TOAST_ID);
        idleLogout().catch(() => { loggingOut = false; /* np. brak sieci – spróbuj przy następnym sprawdzeniu */ });
      } else if (idle >= idleMs - WARNING_MS) {
        if (!warned) {
          warned = true;
          toast.warning("Brak aktywności", {
            id: WARNING_TOAST_ID,
            description: "Za minutę nastąpi wylogowanie. Porusz myszą lub naciśnij klawisz, aby zostać.",
            duration: Infinity,
          });
        }
      } else if (warned) {
        warned = false;
        toast.dismiss(WARNING_TOAST_ID);
      }
    };

    onActivity();
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true, capture: true }));
    const timer = window.setInterval(check, CHECK_MS);
    // po uśpieniu komputera interwał stoi – sprawdź od razu po powrocie do karty
    document.addEventListener("visibilitychange", check);
    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, onActivity, { capture: true }));
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      toast.dismiss(WARNING_TOAST_ID);
    };
  }, [idleMinutes]);

  return null;
};

export default IdleLogout;
