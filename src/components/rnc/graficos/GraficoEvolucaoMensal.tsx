"use client";

import { agrupa } from "@/domain/rnc-filtros";
import { fmtMet, mesLab, nf0, nf1, type Metrica } from "@/domain/rnc-formatacao";
import { R_MES } from "@/domain/rnc-tipos";
import type { RncData, RncRow } from "@/domain/rnc-tipos";
import { caminhoBarraArredondada, ticksEixo } from "./svg-math";
import { TooltipFlutuante } from "./TooltipFlutuante";
import { useTooltipFlutuante } from "./useTooltipFlutuante";

const W = 880;
const H = 300;
const L = 52;
const RR = 14;
const T = 30;
const B = 34;

// Portado de renderEvol() do HTML original (linhas 428-472): barras por mês
// + média móvel de 3 meses. `mesesAtivos`/`onClickMes` ficam opcionais —
// sem eles (Fase 4) toda barra aparece "ativa"/não clicável; a Fase 5 passa
// o `FiltroState.mes` real e o dispatch do reducer.
export function GraficoEvolucaoMensal({
  data,
  rows,
  metrica,
  mesesAtivos,
  onClickMes,
}: {
  data: RncData;
  rows: RncRow[];
  metrica: Metrica;
  mesesAtivos?: Set<number>;
  onClickMes?: (mesIdx: number) => void;
}) {
  const { estado, ref, mostrar, esconder } = useTooltipFlutuante();

  const g = agrupa(rows, (r) => r[R_MES], metrica);
  const all = data.meses.map((_, i) => {
    const f = g.find((x) => x.chave === i);
    return { i, v: f ? f.v : 0, n: f ? f.n : 0, q: f ? f.q : 0 };
  });

  const iw = W - L - RR;
  const ih = H - T - B;
  const max = Math.max(...all.map((d) => d.v), 1);
  const tk = ticksEixo(max, 4);
  const top = tk.at(-1) || max;

  const bw = iw / all.length;
  const pad = Math.max(bw * 0.42, bw - 58);

  const mm = all.map((_, i) => {
    const sl = all.slice(Math.max(0, i - 2), i + 1);
    return sl.reduce((a, x) => a + x.v, 0) / sl.length;
  });
  const pts = mm.map((v, i) => [L + i * bw + bw / 2, T + ih - (v / top) * ih] as const);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ height: H, maxHeight: "100%" }}>
        {tk.map((t) => {
          const y = T + ih - (t / top) * ih;
          return (
            <g key={t}>
              <line x1={L} x2={W - RR} y1={y} y2={y} className={t === 0 ? "bl" : "gl"} />
              <text x={L - 9} y={y + 3.5} className="tk" textAnchor="end">
                {fmtMet(t, metrica)}
              </text>
            </g>
          );
        })}

        {all.map((d) => {
          const x = L + d.i * bw + pad / 2;
          const w = bw - pad;
          const h = (d.v / top) * ih;
          const y = T + ih - h;
          const ativo = !mesesAtivos || mesesAtivos.size === 0 || mesesAtivos.has(d.i);
          return (
            <g key={d.i}>
              <path
                d={caminhoBarraArredondada(x, y, w, h, true)}
                fill="var(--rnc-seq-4)"
                className={`mk${ativo ? "" : " dim"}`}
                style={{ cursor: onClickMes ? "pointer" : "default" }}
                onMouseMove={(e) =>
                  mostrar(e, mesLab(data.meses[d.i]), [
                    ["Nº de reclamações", nf0(d.n)],
                    ["Qtd. c/ problema", `${nf1(d.q)} m/un`],
                    ["Participação", `${nf1(rows.length ? (d.n / rows.length) * 100 : 0)}%`],
                  ])
                }
                onMouseLeave={esconder}
                onClick={() => onClickMes?.(d.i)}
              />
              {d.v > 0 && (
                <text x={x + w / 2} y={y - 6} className="vl" textAnchor="middle">
                  {fmtMet(d.v, metrica)}
                </text>
              )}
              <text x={x + w / 2} y={H - B + 18} className="tk" textAnchor="middle">
                {mesLab(data.meses[d.i])}
              </text>
            </g>
          );
        })}

        <path
          d={pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ")}
          fill="none"
          stroke="var(--rnc-s2)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r={5} fill="var(--rnc-surface)" stroke="var(--rnc-s2)" strokeWidth={2} />
            <circle
              cx={p[0]}
              cy={p[1]}
              r={11}
              fill="transparent"
              className="mk"
              onMouseMove={(e) =>
                mostrar(e, `Média móvel 3 meses · ${mesLab(data.meses[i])}`, [
                  ["Valor", fmtMet(mm[i], metrica)],
                ])
              }
              onMouseLeave={esconder}
            />
          </g>
        ))}
      </svg>

      <div className="legend-top" style={{ marginTop: 8 }}>
        <span className="lg">
          <span className="sw" style={{ background: "var(--rnc-seq-4)" }} />
          {metrica === "n" ? "Nº de reclamações" : "Qtd. c/ problema"}
        </span>
        <span className="lg">
          <span className="sw" style={{ background: "var(--rnc-s2)", borderRadius: 999 }} />
          Média móvel 3 meses
        </span>
      </div>

      <TooltipFlutuante estado={estado} innerRef={ref} />
    </div>
  );
}
