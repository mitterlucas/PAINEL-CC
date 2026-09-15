"use client";

import { agrupa } from "@/domain/rnc-filtros";
import { fmtMet, nf0, nf1, type Metrica } from "@/domain/rnc-formatacao";
import { R_RES } from "@/domain/rnc-tipos";
import type { RncData, RncRow } from "@/domain/rnc-tipos";
import { COR_RESULTADO } from "../paleta";
import { TooltipFlutuante } from "./TooltipFlutuante";
import { useTooltipFlutuante } from "./useTooltipFlutuante";

const W = 330;
const H = 210;
const CX = 105;
const CY = H / 2;
const RO = 78;
const RI = 50;
const GAP = 0.014;

// Portado de renderDonut() do HTML original (linhas 475-519): anel +
// legenda clicável + tabela acessível (o "canal acessível do donut" citado
// no original). `resAtivos`/`onClickRes` opcionais, mesmo esquema das
// outras — sem eles nada aparece esmaecido e nada é clicável (Fase 4).
export function GraficoDonutResultado({
  data,
  rows,
  metrica,
  resAtivos,
  onClickRes,
}: {
  data: RncData;
  rows: RncRow[];
  metrica: Metrica;
  resAtivos?: Set<number>;
  onClickRes?: (resIdx: number) => void;
}) {
  const { estado, ref, mostrar, esconder } = useTooltipFlutuante();

  const g = agrupa(rows, (r) => r[R_RES], metrica).sort((a, b) => b.v - a.v);
  const tot = g.reduce((a, x) => a + x.v, 0);

  if (!tot) {
    return <div className="empty">Sem dados no filtro atual</div>;
  }

  const p = (r: number, a: number): [number, number] => [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  let ang = -Math.PI / 2;
  const fatias = g.map((d) => {
    const frac = d.v / tot;
    const sweep = frac * Math.PI * 2;
    const a0 = ang + (g.length > 1 ? GAP : 0);
    const a1 = ang + sweep - (g.length > 1 ? GAP : 0);
    ang += sweep;
    return { d, frac, a0, a1 };
  });

  const ativo = (resIdx: number) => !resAtivos || resAtivos.size === 0 || resAtivos.has(resIdx);
  const fmtTot = fmtMet(tot, metrica);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ height: H, maxHeight: "100%" }}>
        {fatias.map(({ d, frac, a0, a1 }) => {
          if (a1 <= a0) return null;
          const [x0, y0] = p(RO, a0);
          const [x1, y1] = p(RO, a1);
          const [x2, y2] = p(RI, a1);
          const [x3, y3] = p(RI, a0);
          const large = a1 - a0 > Math.PI ? 1 : 0;
          return (
            <path
              key={d.chave}
              d={`M${x0} ${y0}A${RO} ${RO} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${RI} ${RI} 0 ${large} 0 ${x3} ${y3}Z`}
              fill={COR_RESULTADO[d.chave]}
              className={`mk${ativo(d.chave) ? "" : " dim"}`}
              style={{ cursor: onClickRes ? "pointer" : "default" }}
              onMouseMove={(e) =>
                mostrar(e, data.ress[d.chave], [
                  ["Nº de reclamações", nf0(d.n)],
                  ["Qtd. c/ problema", `${nf1(d.q)} m/un`],
                  ["Participação", `${nf1(frac * 100)}%`],
                ])
              }
              onMouseLeave={esconder}
              onClick={() => onClickRes?.(d.chave)}
            />
          );
        })}
        <text
          x={CX}
          y={CY - 4}
          textAnchor="middle"
          style={{
            fontSize: fmtTot.length > 7 ? 18 : 24,
            fontWeight: 800,
            fill: "var(--rnc-ink)",
            stroke: "none",
          }}
        >
          {fmtTot}
        </text>
        <text x={CX} y={CY + 14} className="tk" textAnchor="middle">
          {metrica === "n" ? "RNCs" : "m / un"}
        </text>

        {g.map((d, i) => {
          const y = 32 + i * 34;
          return (
            <g key={d.chave}>
              <rect x={200} y={y - 8} width={10} height={10} rx={3} fill={COR_RESULTADO[d.chave]} />
              <text x={217} y={y + 1} className="vl">
                {data.ress[d.chave]}
              </text>
              <text x={217} y={y + 15} className="tk">
                {fmtMet(d.v, metrica)} · {nf1((d.v / tot) * 100)}%
              </text>
              <rect
                x={196}
                y={y - 14}
                width={130}
                height={30}
                fill="transparent"
                className="mk"
                style={{ cursor: onClickRes ? "pointer" : "default" }}
                onMouseMove={(e) =>
                  mostrar(e, data.ress[d.chave], [
                    ["Nº de reclamações", nf0(d.n)],
                    ["Qtd. c/ problema", `${nf1(d.q)} m/un`],
                  ])
                }
                onMouseLeave={esconder}
                onClick={() => onClickRes?.(d.chave)}
              />
            </g>
          );
        })}
      </svg>

      <table style={{ marginTop: 6 }}>
        <thead>
          <tr>
            <th style={{ cursor: "default" }}>Resultado</th>
            <th style={{ cursor: "default", textAlign: "right" }}>RNCs</th>
            <th style={{ cursor: "default", textAlign: "right" }}>Qtd. total</th>
            <th style={{ cursor: "default", textAlign: "right" }}>Qtd. média</th>
          </tr>
        </thead>
        <tbody>
          {g.map((d) => (
            <tr key={d.chave}>
              <td>
                <span className="pill" style={{ color: "var(--rnc-ink)" }}>
                  <i style={{ background: COR_RESULTADO[d.chave] }} />
                  {data.ress[d.chave]}
                </span>
              </td>
              <td className="n">{nf0(d.n)}</td>
              <td className="n">{nf1(d.q)}</td>
              <td className="n">{nf1(d.q / d.n)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <TooltipFlutuante estado={estado} innerRef={ref} />
    </div>
  );
}
