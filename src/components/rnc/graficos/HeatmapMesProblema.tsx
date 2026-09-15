"use client";

import { agrupa } from "@/domain/rnc-filtros";
import { fmtMet, mesLab, nf0, nf1, rncCurto, rncFull, type Metrica } from "@/domain/rnc-formatacao";
import { R_MES, R_QTD, R_RNC } from "@/domain/rnc-tipos";
import type { RncData, RncRow } from "@/domain/rnc-tipos";
import { COR_SEQ } from "../paleta";
import { TooltipFlutuante } from "./TooltipFlutuante";
import { useTooltipFlutuante } from "./useTooltipFlutuante";

const CW = 78;
const CH = 32;
const L = 178;
const T = 26;

// Portado de renderHeat() do HTML original (linhas 634-676) — mês × top 10
// motivos de RNC. `base` no original é `filtra('rnc')` (o próprio filtro de
// RNC é ignorado, já que esta é a visão que também filtra por RNC); aqui
// isso é responsabilidade de quem chama (a Fase 5 passa `filtra(data,
// filtro, 'rnc')` como `rows`).
export function HeatmapMesProblema({
  data,
  rows,
  metrica,
  onClickCelula,
}: {
  data: RncData;
  rows: RncRow[];
  metrica: Metrica;
  onClickCelula?: (mesIdx: number, codigoRnc: string) => void;
}) {
  const { estado, ref, mostrar, esconder } = useTooltipFlutuante();

  const topR = agrupa(rows, (r) => r[R_RNC], metrica)
    .sort((a, b) => b.n - a.n)
    .slice(0, 10)
    .map((d) => d.chave);

  if (!topR.length) {
    return <div className="empty">Sem dados no filtro atual</div>;
  }

  const cell = new Map<string, { n: number; q: number }>();
  for (const r of rows) {
    if (!topR.includes(r[R_RNC])) continue;
    const k = `${r[R_MES]}|${r[R_RNC]}`;
    const o = cell.get(k) ?? { n: 0, q: 0 };
    o.n++;
    o.q += r[R_QTD];
    cell.set(k, o);
  }
  const vals = [...cell.values()].map((o) => (metrica === "n" ? o.n : o.q));
  const max = Math.max(...vals, 1);

  const W = L + data.meses.length * CW + 8;
  const H = T + topR.length * CH + 34;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ height: H, maxHeight: "100%" }}>
        {data.meses.map((m, i) => (
          <text key={m} x={L + i * CW + CW / 2} y={T - 9} className="tk" textAnchor="middle">
            {mesLab(m)}
          </text>
        ))}

        {topR.map((rk, ri2) => (
          <g key={rk}>
            <text x={L - 10} y={T + ri2 * CH + CH / 2 + 3.5} className="vl" textAnchor="end">
              {rncCurto(data, rk)}
            </text>
            {data.meses.map((m, mi2) => {
              const o = cell.get(`${mi2}|${rk}`);
              const v = o ? (metrica === "n" ? o.n : o.q) : 0;
              const lvl = v === 0 ? -1 : Math.min(5, Math.floor((v / max) * 5.999));
              const x = L + mi2 * CW + 1;
              const y = T + ri2 * CH + 1;
              return (
                <g key={mi2}>
                  <rect
                    x={x}
                    y={y}
                    width={CW - 3}
                    height={CH - 3}
                    rx={5}
                    fill={lvl < 0 ? "var(--rnc-surface-2)" : COR_SEQ[lvl]}
                    className="mk"
                    stroke="var(--rnc-surface)"
                    strokeWidth={1}
                    style={{ cursor: onClickCelula ? "pointer" : "default" }}
                    onMouseMove={(e) =>
                      mostrar(
                        e,
                        `${mesLab(m)} · ${rncFull(data, rk)}`,
                        o
                          ? [
                              ["Nº de reclamações", nf0(o.n)],
                              ["Qtd. c/ problema", `${nf1(o.q)} m/un`],
                            ]
                          : [["Sem ocorrências", "—"]],
                      )
                    }
                    onMouseLeave={esconder}
                    onClick={() => onClickCelula?.(mi2, data.rncs[rk])}
                  />
                  {v > 0 && (
                    <text
                      x={x + (CW - 3) / 2}
                      y={y + (CH - 3) / 2 + 3.5}
                      className={`vl ${lvl >= 3 ? "hc-hi" : "hc-lo"}`}
                      textAnchor="middle"
                      style={{ pointerEvents: "none", stroke: "none", fontSize: 10 }}
                    >
                      {fmtMet(v, metrica)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        ))}

        {(() => {
          const lx = L;
          const ly = H - 16;
          return (
            <g>
              <text x={lx} y={ly + 4} className="tk">
                menos
              </text>
              {COR_SEQ.map((c, i) => (
                <rect key={c} x={lx + 38 + i * 16} y={ly - 6} width={13} height={11} rx={3} fill={c} />
              ))}
              <text x={lx + 38 + COR_SEQ.length * 16 + 6} y={ly + 4} className="tk">
                mais
              </text>
            </g>
          );
        })()}
      </svg>

      <TooltipFlutuante estado={estado} innerRef={ref} />
    </div>
  );
}
