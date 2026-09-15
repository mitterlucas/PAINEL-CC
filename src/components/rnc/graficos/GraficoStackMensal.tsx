"use client";

import { nf0, nf1, mesLab } from "@/domain/rnc-formatacao";
import { R_MES, R_RES } from "@/domain/rnc-tipos";
import type { RncData, RncRow } from "@/domain/rnc-tipos";
import { COR_RESULTADO } from "../paleta";
import { TooltipFlutuante } from "./TooltipFlutuante";
import { useTooltipFlutuante } from "./useTooltipFlutuante";

const W = 400;
const H = 250;
const L = 40;
const T = 10;
const B = 30;
const RR = 8;

// Portado de renderStack() do HTML original (linhas 521-556) — barras 100%
// empilhadas por resultado dentro de cada mês. Sempre usa CONTAGEM de linhas
// pra calcular a proporção de cada fatia (não depende da métrica ativa),
// igual ao original.
export function GraficoStackMensal({
  data,
  rows,
  resAtivos,
  onClickRes,
}: {
  data: RncData;
  rows: RncRow[];
  resAtivos?: Set<number>;
  onClickRes?: (resIdx: number) => void;
}) {
  const { estado, ref, mostrar, esconder } = useTooltipFlutuante();

  const iw = W - L - RR;
  const ih = H - T - B;
  const bw = iw / data.meses.length;
  const pad = Math.min(14, bw * 0.32);
  const ativo = (resIdx: number) => !resAtivos || resAtivos.size === 0 || resAtivos.has(resIdx);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ height: H, maxHeight: "100%" }}>
        {[0, 25, 50, 75, 100].map((t) => {
          const y = T + ih - (t / 100) * ih;
          return (
            <g key={t}>
              <line x1={L} x2={W - RR} y1={y} y2={y} className={t === 0 ? "bl" : "gl"} />
              <text x={L - 8} y={y + 3.5} className="tk" textAnchor="end">
                {t}%
              </text>
            </g>
          );
        })}

        {data.meses.map((mm, i) => {
          const sub = rows.filter((r) => r[R_MES] === i);
          const x = L + i * bw + pad / 2;
          const w = bw - pad;
          let acc = 0;
          const segmentos = sub.length
            ? data.ress
                .map((rn, ridx) => {
                  const c = sub.filter((r) => r[R_RES] === ridx).length;
                  if (!c) return null;
                  const frac = c / sub.length;
                  const h = frac * ih;
                  const y = T + ih - acc - h;
                  acc += h;
                  return { ridx, rn, c, frac, y, h };
                })
                .filter((s): s is NonNullable<typeof s> => s !== null)
            : [];

          return (
            <g key={i}>
              {segmentos.map((s) => (
                <rect
                  key={s.ridx}
                  x={x}
                  y={s.y + 1}
                  width={w}
                  height={Math.max(0, s.h - 2)}
                  rx={2}
                  fill={COR_RESULTADO[s.ridx]}
                  className={`mk${ativo(s.ridx) ? "" : " dim"}`}
                  style={{ cursor: onClickRes ? "pointer" : "default" }}
                  onMouseMove={(e) =>
                    mostrar(e, `${mesLab(mm)} · ${s.rn}`, [
                      ["Reclamações", nf0(s.c)],
                      ["Participação no mês", `${nf1(s.frac * 100)}%`],
                    ])
                  }
                  onMouseLeave={esconder}
                  onClick={() => onClickRes?.(s.ridx)}
                />
              ))}
              <text x={x + w / 2} y={H - B + 16} className="tk" textAnchor="middle">
                {mesLab(mm)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="legend-top" style={{ marginTop: 8 }}>
        {data.ress.map((r, i) => (
          <span className="lg" key={r}>
            <span className="sw" style={{ background: COR_RESULTADO[i] }} />
            {r}
          </span>
        ))}
      </div>

      <TooltipFlutuante estado={estado} innerRef={ref} />
    </div>
  );
}
