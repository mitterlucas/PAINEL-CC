"use client";

import { fmtMet, nf0, nf1, type Metrica } from "@/domain/rnc-formatacao";
import { R_DATA, R_QTD } from "@/domain/rnc-tipos";
import type { RncRow } from "@/domain/rnc-tipos";
import { caminhoBarraArredondada, ticksEixo } from "./svg-math";
import { TooltipFlutuante } from "./TooltipFlutuante";
import { useTooltipFlutuante } from "./useTooltipFlutuante";

const DOWNOME = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const ORDEM = [1, 2, 3, 4, 5, 6, 0]; // seg..dom, igual ao original

const W = 420;
const H = 248;
const L = 40;
const RR = 10;
const T = 28;
const B = 30;

// Portado de renderDow() do HTML original (linhas 607-631) — distribuição
// por dia da semana da data de abertura. Sem filtro/clique no original
// (só tooltip), então não recebe `ativo`/`aoClicar`.
export function GraficoDiaSemana({ rows, metrica }: { rows: RncRow[]; metrica: Metrica }) {
  const { estado, ref, mostrar, esconder } = useTooltipFlutuante();

  const cnt = Array.from({ length: 7 }, () => ({ n: 0, q: 0 }));
  for (const r of rows) {
    const [d, m, y] = r[R_DATA].split("/").map(Number);
    const w = new Date(y, m - 1, d).getDay();
    cnt[w].n++;
    cnt[w].q += r[R_QTD];
  }
  const dados = ORDEM.map((i) => ({
    i,
    ...cnt[i],
    v: metrica === "n" ? cnt[i].n : cnt[i].q,
  }));

  const iw = W - L - RR;
  const ih = H - T - B;
  const max = Math.max(...dados.map((d) => d.v), 1);
  const tk = ticksEixo(max, 3);
  const top = tk.at(-1) || max;
  const bw = iw / 7;
  const pad = Math.max(bw * 0.42, bw - 30);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ height: H, maxHeight: "100%" }}>
        {tk.map((t) => {
          const y = T + ih - (t / top) * ih;
          return (
            <g key={t}>
              <line x1={L} x2={W - RR} y1={y} y2={y} className={t === 0 ? "bl" : "gl"} />
              <text x={L - 8} y={y + 3.5} className="tk" textAnchor="end">
                {fmtMet(t, metrica)}
              </text>
            </g>
          );
        })}

        {dados.map((d, idx) => {
          const x = L + idx * bw + pad / 2;
          const w = bw - pad;
          const h = (d.v / top) * ih;
          const y = T + ih - h;
          return (
            <g key={d.i}>
              <path
                d={caminhoBarraArredondada(x, y, w, Math.max(h, 0), true)}
                fill="var(--rnc-seq-3)"
                className="mk"
                onMouseMove={(e) =>
                  mostrar(e, DOWNOME[d.i], [
                    ["Nº de reclamações", nf0(d.n)],
                    ["Qtd. c/ problema", `${nf1(d.q)} m/un`],
                  ])
                }
                onMouseLeave={esconder}
              />
              {d.v > 0 && (
                <text x={x + w / 2} y={y - 5} className="vl" textAnchor="middle">
                  {fmtMet(d.v, metrica)}
                </text>
              )}
              <text x={x + w / 2} y={H - B + 16} className="tk" textAnchor="middle">
                {DOWNOME[d.i]}
              </text>
            </g>
          );
        })}
      </svg>

      <TooltipFlutuante estado={estado} innerRef={ref} />
    </div>
  );
}
