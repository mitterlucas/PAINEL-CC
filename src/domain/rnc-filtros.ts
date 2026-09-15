// Filtro e agregação puros, portados de filtra()/val()/agrupa() do HTML
// original (Relatorio_de_Reclamacoes_RNC_jan_a_ago_2026_Alltak.html, linhas
// ~318-338). Sem estado mutável: o `st` do HTML vira um FiltroState explícito
// passado por parâmetro — quem chama (Fase 5, useReducer) é dono do estado.
import type { Metrica } from "./rnc-formatacao";
import { R_FAM, R_MES, R_PROD, R_QTD, R_RES, R_RNC } from "./rnc-tipos";
import type { RncData, RncRow } from "./rnc-tipos";

export interface FiltroState {
  mes: Set<number>;
  res: Set<number>;
  fam: string; // "" = sem filtro
  rnc: string; // "" = sem filtro; senão o código (DATA.rncs[idx])
  busca: string;
}

export function filtroVazio(): FiltroState {
  return { mes: new Set(), res: new Set(), fam: "", rnc: "", busca: "" };
}

export type CampoFiltro = "mes" | "res" | "fam" | "rnc";

// `ignorar`: mesmo papel do parâmetro `ignore` do filtra() original — permite
// calcular "quantas linhas passariam se este filtro não existisse", usado
// pelos gráficos pra desenhar esmaecidas as opções não selecionadas dentro da
// própria dimensão que elas representam.
export function filtra(data: RncData, filtro: FiltroState, ignorar?: CampoFiltro): RncRow[] {
  const busca = filtro.busca.trim().toUpperCase();
  return data.rows.filter((r) => {
    if (ignorar !== "mes" && filtro.mes.size && !filtro.mes.has(r[R_MES])) return false;
    if (ignorar !== "res" && filtro.res.size && !filtro.res.has(r[R_RES])) return false;
    if (ignorar !== "fam" && filtro.fam !== "" && data.fams[r[R_FAM]] !== filtro.fam) return false;
    if (ignorar !== "rnc" && filtro.rnc !== "" && data.rncs[r[R_RNC]] !== filtro.rnc) return false;
    if (busca && !data.prods[r[R_PROD]].includes(busca)) return false;
    return true;
  });
}

export function val(row: RncRow, metrica: Metrica): number {
  return metrica === "n" ? 1 : row[R_QTD];
}

export interface GrupoAgregado<K> {
  chave: K;
  n: number; // nº de linhas (reclamações) no grupo
  q: number; // soma de Qtd. c/ problema no grupo
  v: number; // valor conforme a métrica ativa (n ou q) — o que os gráficos plotam
}

export function agrupa<K>(
  rows: RncRow[],
  keyfn: (r: RncRow) => K,
  metrica: Metrica,
): GrupoAgregado<K>[] {
  const mapa = new Map<K, GrupoAgregado<K>>();
  for (const r of rows) {
    const chave = keyfn(r);
    const grupo = mapa.get(chave) ?? { chave, n: 0, q: 0, v: 0 };
    grupo.n++;
    grupo.q += r[R_QTD];
    mapa.set(chave, grupo);
  }
  return [...mapa.values()].map((g) => ({ ...g, v: metrica === "n" ? g.n : g.q }));
}
