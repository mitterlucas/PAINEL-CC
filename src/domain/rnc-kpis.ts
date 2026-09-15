// Cálculo puro dos 5 KPIs do topo do relatório — portado de renderKpis() do
// HTML original (Relatorio_de_Reclamacoes_RNC_jan_a_ago_2026_Alltak.html,
// linhas ~401-426), só a parte de CÁLCULO (o HTML dos cartões fica pra
// Fase 4/5). `metrica` não entra aqui: as 5 métricas do renderKpis original
// usam sempre contagem de linhas (nunca a soma de Qtd.), independente da
// métrica ativa no filtro.
import { agrupa } from "./rnc-filtros";
import { R_MES, R_PROD, R_QTD, R_RES } from "./rnc-tipos";
import type { RncData, RncRow } from "./rnc-tipos";

export interface KpiPorMes {
  mesIdx: number;
  n: number;
}

export interface KpisRnc {
  total: number;
  qtdTotal: number;
  procedentes: number;
  // null quando total===0 (sem dado no filtro atual) — mesmo caso do "–" do HTML original
  percentualProcedentes: number | null;
  porMes: KpiPorMes[]; // ordenado por mesIdx crescente
  mediaPorMes: number;
  ultimoMes: KpiPorMes | null;
  mesAnterior: KpiPorMes | null;
  // null quando não há mês anterior, ou o mês anterior teve n=0 (sem base de comparação)
  variacaoPercentualUltimoMes: number | null;
  produtosDistintos: number;
  produtosReincidentes: number; // produtos com 3+ reclamações no período filtrado
}

export function calcularKpis(data: RncData, rows: RncRow[]): KpisRnc {
  const total = rows.length;
  const qtdTotal = rows.reduce((acc, r) => acc + r[R_QTD], 0);
  const procedentes = rows.filter((r) => data.ress[r[R_RES]] === "Procedente").length;

  const porMes: KpiPorMes[] = agrupa(rows, (r) => r[R_MES], "n")
    .sort((a, b) => a.chave - b.chave)
    .map((g) => ({ mesIdx: g.chave, n: g.n }));
  const mediaPorMes = porMes.length ? total / porMes.length : 0;
  const ultimoMes = porMes.at(-1) ?? null;
  const mesAnterior = porMes.length > 1 ? (porMes.at(-2) ?? null) : null;
  const variacaoPercentualUltimoMes =
    mesAnterior && mesAnterior.n && ultimoMes
      ? ((ultimoMes.n - mesAnterior.n) / mesAnterior.n) * 100
      : null;

  const produtosDistintos = new Set(rows.map((r) => r[R_PROD])).size;
  const contagemPorProduto = new Map<number, number>();
  for (const r of rows) {
    contagemPorProduto.set(r[R_PROD], (contagemPorProduto.get(r[R_PROD]) ?? 0) + 1);
  }
  const produtosReincidentes = [...contagemPorProduto.values()].filter((v) => v >= 3).length;

  return {
    total,
    qtdTotal,
    procedentes,
    percentualProcedentes: total ? (procedentes / total) * 100 : null,
    porMes,
    mediaPorMes,
    ultimoMes,
    mesAnterior,
    variacaoPercentualUltimoMes,
    produtosDistintos,
    produtosReincidentes,
  };
}
