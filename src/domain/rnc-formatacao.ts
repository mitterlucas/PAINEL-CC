// Formatação de números/rótulos herdada do HTML original — portado de
// nf0/nf1/mesLab/rncDesc/rncFull/rncCurto/fmtMet
// (Relatorio_de_Reclamacoes_RNC_jan_a_ago_2026_Alltak.html, linhas ~306-315).
import type { RncData } from "./rnc-tipos";

// "n" = nº de reclamações (contagem de linhas); "qtd" = Qtd. c/ problema
// (soma de metros lineares/unidades) — as duas métricas que o filtro do
// relatório alterna.
export type Metrica = "n" | "qtd";

const MESNOME = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export function nf0(n: number): string {
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

export function nf1(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

// "2026-01" -> "jan/26"
export function mesLab(chaveMes: string): string {
  const [ano, mes] = chaveMes.split("-");
  return `${MESNOME[Number(mes) - 1]}/${ano.slice(2)}`;
}

export function rncDesc(data: RncData, idx: number): string {
  return data.rncdesc[idx];
}

export function rncFull(data: RncData, idx: number): string {
  return `${data.rncdesc[idx]} (${data.rncs[idx]})`;
}

export function rncCurto(data: RncData, idx: number): string {
  const d = data.rncdesc[idx];
  return d.length > 26 ? `${d.slice(0, 25)}…` : d;
}

export function fmtMet(v: number, metrica: Metrica): string {
  return metrica === "n" ? nf0(v) : nf1(v);
}
