"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// Portado de themeBtn do HTML original (linhas 817-822 e 833-836): alterna
// claro/escuro e troca o rótulo. A diferença é que aqui quem decide o tema
// (inclusive o `prefers-color-scheme` inicial) é o `ThemeProvider`
// (next-themes), não este botão.
export function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  // Evita mismatch de hidratação: no servidor não sabemos o tema do
  // sistema do visitante, então o rótulo só reflete o tema real depois de
  // montar no cliente.
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  const escuro = montado && resolvedTheme === "dark";
  return (
    <button
      type="button"
      className="tbtn"
      onClick={() => setTheme(escuro ? "light" : "dark")}
    >
      ◐ {escuro ? "Tema claro" : "Tema escuro"}
    </button>
  );
}
