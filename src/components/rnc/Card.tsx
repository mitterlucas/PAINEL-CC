import type { ReactNode } from "react";

// Casca de `.card` do HTML original (linhas 220-274: `<div class="card cN">
// <h2>...</h2><div class="hint">...</div>...`), reaproveitada pelos 9 cartões
// de gráfico/tabela da grid.
export function Card({
  span,
  titulo,
  dica,
  children,
  className,
}: {
  span: 3 | 4 | 5 | 6 | 7 | 8 | 12;
  titulo: string;
  dica?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card c${span}${className ? ` ${className}` : ""}`}>
      <h2>{titulo}</h2>
      {dica ? <div className="hint">{dica}</div> : null}
      {children}
    </div>
  );
}
