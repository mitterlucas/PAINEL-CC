"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

// `attribute="class"` casa com `@custom-variant dark (&:is(.dark *))` de
// globals.css — next-themes aplica/remove a classe `dark` no `<html>`.
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
