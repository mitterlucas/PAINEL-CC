// Estado da página inteira e seu reducer — porta do `st` mutável +
// `toggleSet()` do HTML original (linhas 298-300, 757), com dois campos que
// não pertencem ao `FiltroState` puro do domínio (Fase 2) porque não
// filtram linha nenhuma, só mudam como elas são exibidas/ordenadas:
// `metrica` (nº de reclamações vs. qtd.) e `ordenacaoDetalhamento` (coluna/
// direção da tabela de Detalhamento, `st.sortDet` no original).
import { filtroVazio } from "@/domain/rnc-filtros";
import type { FiltroState } from "@/domain/rnc-filtros";
import type { Metrica } from "@/domain/rnc-formatacao";
import { R_DATA } from "@/domain/rnc-tipos";

export interface OrdenacaoDetalhamento {
  // índice da coluna na tupla `RncRow` (R_DATA, R_NRO, R_PROD, R_RNC, R_QTD
  // ou R_RES — as únicas colunas que a tabela de Detalhamento mostra).
  coluna: number;
  direcao: 1 | -1;
}

export interface EstadoPagina {
  filtro: FiltroState;
  metrica: Metrica;
  ordenacaoDetalhamento: OrdenacaoDetalhamento;
}

export function estadoInicial(): EstadoPagina {
  return {
    filtro: filtroVazio(),
    metrica: "n",
    ordenacaoDetalhamento: { coluna: R_DATA, direcao: -1 },
  };
}

export type AcaoPagina =
  | { tipo: "ALTERNAR_MES"; mes: number }
  | { tipo: "ALTERNAR_RESULTADO"; resultado: number }
  | { tipo: "DEFINIR_FAMILIA"; familia: string }
  | { tipo: "DEFINIR_PROBLEMA"; codigoRnc: string }
  | { tipo: "DEFINIR_BUSCA"; busca: string }
  | { tipo: "DEFINIR_METRICA"; metrica: Metrica }
  | { tipo: "ORDENAR_DETALHAMENTO"; coluna: number }
  | { tipo: "FILTRAR_CELULA_HEATMAP"; mes: number; codigoRnc: string }
  | { tipo: "LIMPAR_FILTROS" };

export function reduzirEstadoPagina(estado: EstadoPagina, acao: AcaoPagina): EstadoPagina {
  switch (acao.tipo) {
    case "ALTERNAR_MES": {
      const mes = new Set(estado.filtro.mes);
      if (mes.has(acao.mes)) mes.delete(acao.mes);
      else mes.add(acao.mes);
      return { ...estado, filtro: { ...estado.filtro, mes } };
    }
    case "ALTERNAR_RESULTADO": {
      const res = new Set(estado.filtro.res);
      if (res.has(acao.resultado)) res.delete(acao.resultado);
      else res.add(acao.resultado);
      return { ...estado, filtro: { ...estado.filtro, res } };
    }
    case "DEFINIR_FAMILIA":
      return { ...estado, filtro: { ...estado.filtro, fam: acao.familia } };
    case "DEFINIR_PROBLEMA":
      return { ...estado, filtro: { ...estado.filtro, rnc: acao.codigoRnc } };
    case "DEFINIR_BUSCA":
      return { ...estado, filtro: { ...estado.filtro, busca: acao.busca } };
    case "DEFINIR_METRICA":
      return { ...estado, metrica: acao.metrica };
    case "ORDENAR_DETALHAMENTO": {
      const mesmaColuna = estado.ordenacaoDetalhamento.coluna === acao.coluna;
      return {
        ...estado,
        ordenacaoDetalhamento: mesmaColuna
          ? { coluna: acao.coluna, direcao: estado.ordenacaoDetalhamento.direcao === 1 ? -1 : 1 }
          : { coluna: acao.coluna, direcao: 1 },
      };
    }
    // Portado do clique de célula do heatmap original (linhas 665-669): liga
    // mês + problema juntos, e desliga os dois se clicar de novo na mesma
    // célula já ativa.
    case "FILTRAR_CELULA_HEATMAP": {
      const mesmaCelula =
        estado.filtro.rnc === acao.codigoRnc && estado.filtro.mes.size === 1 && estado.filtro.mes.has(acao.mes);
      const rnc = mesmaCelula ? "" : acao.codigoRnc;
      const mes = new Set<number>(rnc ? [acao.mes] : []);
      return { ...estado, filtro: { ...estado.filtro, rnc, mes } };
    }
    case "LIMPAR_FILTROS":
      return { ...estado, filtro: filtroVazio() };
    default:
      return estado;
  }
}

// Porta do padrão "clique de novo pra desligar" usado por vários gráficos
// no original (`st.fam=(st.fam===...)?'':...`, `st.rnc=(st.rnc===...)?'':...`)
// — igualdade exata, sem trim/case-fold (diferente da busca de produto).
export function alternarValor(atual: string, novo: string): string {
  return atual === novo ? "" : novo;
}

// Porta de `st.busca=(st.busca.trim().toUpperCase()===p)?'':p` (renderProd/
// renderRec originais) — comparação case-insensitive porque é assim que
// `filtra()` já compara a busca contra `DATA.prods` (`.toUpperCase()`).
export function alternarBusca(atual: string, produto: string): string {
  return atual.trim().toUpperCase() === produto.trim().toUpperCase() ? "" : produto;
}
