"use client";

import { fmtMet, nf0, nf1, type Metrica } from "@/domain/rnc-formatacao";
import type { GrupoAgregado } from "@/domain/rnc-filtros";
import { caminhoBarraArredondada } from "./svg-math";
import { TooltipFlutuante } from "./TooltipFlutuante";
import { useTooltipFlutuante } from "./useTooltipFlutuante";

// `rotulo` é pré-calculado por quem monta `dados` (page.tsx hoje, o
// RelatorioRncClient da Fase 5 depois) em vez de uma função `rotulo(d)`
// (como no hbar() original, linha 559): funções não atravessam a fronteira
// Server->Client Component do Next — só dados serializáveis.
export interface ItemBarraHorizontal<K> extends GrupoAgregado<K> {
  rotulo: string;
}

// Barra horizontal genérica, portada de hbar() do HTML original (linhas
// 559-582) — reaproveitada pelos gráficos de produto, problema (RNC) e
// família (renderProd/renderRnc/renderFam originais só chamavam hbar com
// parâmetros diferentes; aqui viram só chamadas deste componente).
export function BarraHorizontal<K>({
  dados,
  metrica,
  ativo,
  aoClicar,
  largura,
  alturaLinha,
}: {
  dados: ItemBarraHorizontal<K>[];
  metrica: Metrica;
  ativo?: (d: ItemBarraHorizontal<K>) => boolean;
  aoClicar?: (d: ItemBarraHorizontal<K>) => void;
  largura: number;
  alturaLinha: number;
}) {
  const { estado, ref, mostrar, esconder } = useTooltipFlutuante();

  if (!dados.length) {
    return <div className="empty">Sem dados no filtro atual</div>;
  }

  const LB = Math.min(300, Math.max(...dados.map((d) => d.rotulo.length)) * 6.0 + 8);
  const H = dados.length * alturaLinha + 22;
  const RR = 64;
  const iw = largura - LB - RR;
  const max = Math.max(...dados.map((d) => d.v), 1);

  return (
    <div>
      <svg viewBox={`0 0 ${largura} ${H}`} style={{ height: H, maxHeight: "100%" }}>
        {dados.map((d, i) => {
          const y = i * alturaLinha + 4;
          const h = alturaLinha - 8;
          const w = (d.v / max) * iw;
          const dimmed = ativo ? !ativo(d) : false;
          const tooltipLinhas: [string, string][] = [
            ["Nº de reclamações", nf0(d.n)],
            ["Qtd. c/ problema", `${nf1(d.q)} m/un`],
          ];
          return (
            <g key={String(d.chave)}>
              <text x={LB - 10} y={y + h / 2 + 3.5} className="vl" textAnchor="end">
                {d.rotulo}
              </text>
              <rect x={LB} y={y} width={iw} height={h} rx={4} fill="var(--rnc-grid)" opacity={0.55} />
              <path
                d={caminhoBarraArredondada(LB, y, Math.max(w, 1), h, false)}
                fill="var(--rnc-seq-4)"
                className={`mk${dimmed ? " dim" : ""}`}
                style={{ cursor: aoClicar ? "pointer" : "default" }}
                onMouseMove={(e) => mostrar(e, d.rotulo, tooltipLinhas)}
                onMouseLeave={esconder}
                onClick={() => aoClicar?.(d)}
              />
              <text x={LB + Math.max(w, 1) + 8} y={y + h / 2 + 3.5} className="vl">
                {fmtMet(d.v, metrica)}
              </text>
              <rect
                x={0}
                y={y}
                width={LB - 4}
                height={h}
                fill="transparent"
                className="mk"
                style={{ cursor: aoClicar ? "pointer" : "default" }}
                onMouseMove={(e) => mostrar(e, d.rotulo, tooltipLinhas)}
                onMouseLeave={esconder}
                onClick={() => aoClicar?.(d)}
              />
            </g>
          );
        })}
      </svg>

      <TooltipFlutuante estado={estado} innerRef={ref} />
    </div>
  );
}
