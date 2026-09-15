"use client";

import type { RefObject } from "react";
import type { TooltipEstado } from "./useTooltipFlutuante";

// Portado de `#tip` do HTML original (linhas 109-114, 178) — virou classe
// (`.tip-flutuante`, ver globals.css) em vez de id porque agora cada
// gráfico tem sua própria instância.
export function TooltipFlutuante({
  estado,
  innerRef,
}: {
  estado: TooltipEstado;
  innerRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={innerRef}
      className="tip-flutuante"
      style={{ left: estado.x, top: estado.y, opacity: estado.visivel ? 1 : 0 }}
    >
      <div className="tt">{estado.titulo}</div>
      {estado.linhas.map(([a, b]) => (
        <div className="tr" key={a}>
          <span>{a}</span>
          <b>{b}</b>
        </div>
      ))}
    </div>
  );
}
