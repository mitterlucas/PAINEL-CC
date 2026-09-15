// Matemática pura de desenho, sem DOM — portada de rbar()/ticks() do HTML
// original (Relatorio_de_Reclamacoes_RNC_jan_a_ago_2026_Alltak.html, linhas
// 379-398). Cada gráfico usa isso pra montar o `d` de um `<path>` React ou
// os valores de tick do eixo — o desenho em si (JSX) fica no componente.

// Caminho de uma barra com topo (vertical) ou canto (horizontal) arredondado
// em 4px, igual ao rbar() original.
export function caminhoBarraArredondada(
  x: number,
  y: number,
  w: number,
  h: number,
  vertical: boolean,
): string {
  const r = Math.min(4, vertical ? Math.max(0, h) : Math.max(0, w));
  if (vertical) {
    if (h <= 0.5) return `M${x} ${y + h}h${w}`;
    return `M${x} ${y + h}V${y + r}a${r} ${r} 0 0 1 ${r} ${-r}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}V${y + h}Z`;
  }
  if (w <= 0.5) return `M${x} ${y}v${h}`;
  return `M${x} ${y}h${w - r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}H${x}Z`;
}

// Valores de tick "redondos" (1/2/2.5/5/10 × potência de 10) cobrindo até o
// máximo, igual ao ticks() original — usado nos eixos Y das barras.
export function ticksEixo(max: number, n: number): number[] {
  if (max <= 0) return [0];
  const raw = max / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const out: number[] = [];
  for (let v = 0; v < max * 0.9999; v += step) out.push(v);
  out.push(out.length ? out[out.length - 1] + step : step);
  return out;
}
