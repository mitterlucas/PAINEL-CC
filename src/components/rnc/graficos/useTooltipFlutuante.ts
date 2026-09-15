"use client";

import { useRef, useState } from "react";

export interface TooltipEstado {
  visivel: boolean;
  x: number;
  y: number;
  titulo: string;
  linhas: [string, string][];
}

const ESTADO_INICIAL: TooltipEstado = { visivel: false, x: 0, y: 0, titulo: "", linhas: [] };

// Portado de showTip()/hideTip()/bind()/tipRows() do HTML original (linhas
// 341-358). Diferença proposital: o original manipula 1 único `#tip` global
// via mousemove; aqui cada gráfico guarda seu próprio estado local (mesmo
// resultado visual, já que só um gráfico recebe hover por vez, e evita ids
// duplicados entre vários gráficos na mesma página). Simplificação
// assumida: sem o desvio de borda de tela do original (`x+r.width>innerWidth`
// etc.) — o tooltip sempre nasce deslocado 14px do cursor.
export function useTooltipFlutuante() {
  const [estado, setEstado] = useState<TooltipEstado>(ESTADO_INICIAL);
  const ref = useRef<HTMLDivElement>(null);

  function mostrar(e: { clientX: number; clientY: number }, titulo: string, linhas: [string, string][]) {
    setEstado({ visivel: true, x: e.clientX + 14, y: e.clientY + 14, titulo, linhas });
  }
  function esconder() {
    setEstado((s) => (s.visivel ? { ...s, visivel: false } : s));
  }

  return { estado, ref, mostrar, esconder };
}
