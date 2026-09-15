// Formato colunar herdado do HTML original (Relatorio_de_Reclamacoes_RNC):
// listas de valores únicos (prods/fams/rncs/rncdesc/ress/meses) + `rows`
// referenciando cada uma por índice, para não repetir texto em cada uma das
// 1.160+ linhas.
export type RncRow = [
  resultadoIdx: number,
  mesIdx: number,
  data: string, // "dd/mm/aaaa"
  nroUnico: number,
  produtoIdx: number,
  rncIdx: number,
  qtd: number,
  familiaIdx: number,
];

export interface RncData {
  prods: string[];
  fams: string[];
  rncs: string[];
  rncdesc: string[];
  ress: string[];
  meses: string[]; // "aaaa-mm", em ordem cronológica
  rows: RncRow[];
}

export const R_RES = 0;
export const R_MES = 1;
export const R_DATA = 2;
export const R_NRO = 3;
export const R_PROD = 4;
export const R_RNC = 5;
export const R_QTD = 6;
export const R_FAM = 7;
