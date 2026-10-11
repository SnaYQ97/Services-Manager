"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Jasny", icon: Sun },
  { value: "dark", label: "Ciemny", icon: Moon },
  { value: "system", label: "Systemowy", icon: Monitor },
] as const;

type ThemeValue = (typeof THEMES)[number]["value"];

const FADE_MS = 300;

/** Ustawia klasę motywu na <html> bez zapisywania wyboru – podgląd po najechaniu */
const applyTheme = (value: ThemeValue) => {
  const dark = value === "dark" || (value === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.classList.toggle("light", !dark);
  root.style.colorScheme = dark ? "dark" : "light";
};

/**
 * Aktualny motyw jako ikona. Po najechaniu (lub kliknięciu na ekranie dotykowym) wysuwają się dwie pozostałe opcje;
 * najechanie na opcję pokazuje podgląd motywu, kliknięcie go zapisuje, zjechanie myszą przywraca zapisany.
 */
const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const fadeTimer = useRef<number | undefined>(undefined);
  // zapisany motyw – ref, bo zamknięcie menu może nastąpić tuż po wyborze, zanim odświeży się stan
  const committed = useRef<ThemeValue>("system");
  useEffect(() => setMounted(true), []);
  useEffect(() => () => window.clearTimeout(fadeTimer.current), []);

  // motyw jest znany dopiero w przeglądarce – do tego czasu ikona systemowa, bez rozjazdu hydratacji
  const current = THEMES.find(t => t.value === (mounted ? theme : "system")) ?? THEMES[2];
  const options = THEMES.filter(t => t.value !== current.value);
  useEffect(() => { committed.current = current.value; }, [current.value]);

  const fadeTo = (value: ThemeValue) => {
    const root = document.documentElement;
    root.classList.add("theme-fade");
    applyTheme(value);
    window.clearTimeout(fadeTimer.current);
    fadeTimer.current = window.setTimeout(() => root.classList.remove("theme-fade"), FADE_MS);
  };

  const close = () => {
    setOpen(false);
    fadeTo(committed.current); // bez wyboru – wróć do zapisanego motywu
  };

  const choose = (value: ThemeValue) => {
    committed.current = value;
    setTheme(value);
    setOpen(false);
  };

  const CurrentIcon = current.icon;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => open && close()}
      onBlur={e => !e.currentTarget.contains(e.relatedTarget) && open && close()}
      onKeyDown={e => e.key === "Escape" && open && close()}
    >
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground"
        onClick={() => (open ? close() : setOpen(true))}
        onFocus={() => setOpen(true)}
        title={`Motyw: ${current.label.toLowerCase()}`}
        aria-label={`Motyw: ${current.label.toLowerCase()}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <CurrentIcon className={cn("transition-transform duration-300", open && "rotate-[30deg] scale-110")} />
      </Button>

      {/* pt zamiast marginesu: kursor przechodzi do opcji bez opuszczania obszaru */}
      <div className={cn("absolute right-0 top-full z-50 pt-1", !open && "pointer-events-none")}>
        <div
          role="menu"
          aria-label="Wybierz motyw"
          className="flex flex-col gap-1 rounded-full border bg-popover p-1 shadow-md transition-all duration-200 ease-out data-[open=false]:-translate-y-2 data-[open=false]:opacity-0 motion-reduce:transition-none"
          data-open={open}
        >
          {options.map(({ value, label, icon: Icon }, index) => (
            <button
              key={value}
              type="button"
              role="menuitem"
              tabIndex={open ? 0 : -1}
              onMouseEnter={() => fadeTo(value)}
              onFocus={() => fadeTo(value)}
              onClick={() => choose(value)}
              title={label}
              aria-label={`Motyw: ${label.toLowerCase()}`}
              style={{ transitionDelay: open ? `${index * 60}ms` : "0ms" }}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-all duration-200 ease-out",
                "hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                open ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0",
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeToggle;
