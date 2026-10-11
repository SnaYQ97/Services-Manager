"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// klasa .dark na <html>; domyślnie motyw systemu, wybór zapamiętany w przeglądarce
const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    {children}
  </NextThemesProvider>
);

export default ThemeProvider;
