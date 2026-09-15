import { describe, expect, it } from "vitest";
import { agrupa, filtra, filtroVazio, val } from "./rnc-filtros";
import type { RncData, RncRow } from "./rnc-tipos";

// Fixture pequena e sintética (não vem do .xlsx real) — só o suficiente pra
// exercitar cada dimensão do filtro isoladamente e em combinação.
// ress: 0=Procedente, 1=Improcedente
// meses: 0=2026-01, 1=2026-02
// fams: 0=COLOR, 1=OUTROS
// rncs: 0="15", 1="S/C"
// prods: 0="COLOR AZUL", 1="TECIDO VERDE"
const DATA: RncData = {
  prods: ["COLOR AZUL", "TECIDO VERDE"],
  fams: ["COLOR", "OUTROS"],
  rncs: ["15", "S/C"],
  rncdesc: ["Medida errada", "Sem classificação"],
  ress: ["Procedente", "Improcedente"],
  meses: ["2026-01", "2026-02"],
  rows: [
    // [res, mes, data, nro, prod, rnc, qtd, fam]
    [0, 0, "05/01/2026", 1, 0, 0, 10, 0], // COLOR AZUL, jan, procedente, rnc 15
    [1, 0, "10/01/2026", 2, 1, 1, 5, 1], // TECIDO VERDE, jan, improcedente, S/C
    [0, 1, "02/02/2026", 3, 1, 0, 7, 1], // TECIDO VERDE, fev, procedente, rnc 15
  ],
};

describe("filtra", () => {
  it("sem filtro nenhum retorna todas as linhas", () => {
    expect(filtra(DATA, filtroVazio())).toHaveLength(3);
  });

  it("filtra por mês", () => {
    const filtro = { ...filtroVazio(), mes: new Set([0]) };
    expect(filtra(DATA, filtro)).toEqual([DATA.rows[0], DATA.rows[1]]);
  });

  it("filtra por resultado", () => {
    const filtro = { ...filtroVazio(), res: new Set([1]) };
    expect(filtra(DATA, filtro)).toEqual([DATA.rows[1]]);
  });

  it("filtra por família", () => {
    const filtro = { ...filtroVazio(), fam: "COLOR" };
    expect(filtra(DATA, filtro)).toEqual([DATA.rows[0]]);
  });

  it("filtra por código RNC", () => {
    const filtro = { ...filtroVazio(), rnc: "15" };
    expect(filtra(DATA, filtro)).toEqual([DATA.rows[0], DATA.rows[2]]);
  });

  it("filtra por busca de produto (case-insensitive via toUpperCase)", () => {
    const filtro = { ...filtroVazio(), busca: "tecido" };
    expect(filtra(DATA, filtro)).toEqual([DATA.rows[1], DATA.rows[2]]);
  });

  it("combina múltiplos filtros (AND entre dimensões)", () => {
    const filtro = { ...filtroVazio(), mes: new Set([1]), res: new Set([0]) };
    expect(filtra(DATA, filtro)).toEqual([DATA.rows[2]]);
  });

  it("`ignorar` exclui só a dimensão indicada do cálculo", () => {
    // com mes=[0] e res=[0], ignorando "mes" deve manter o filtro de
    // resultado mas soltar o de mês — igual ao uso original nos gráficos
    // pra desenhar as opções não selecionadas esmaecidas.
    const filtro = { ...filtroVazio(), mes: new Set([0]), res: new Set([0]) };
    expect(filtra(DATA, filtro, "mes")).toEqual([DATA.rows[0], DATA.rows[2]]);
  });

  it("filtro vazio em um campo (fam/rnc = '') não filtra nada", () => {
    expect(filtra(DATA, filtroVazio())).toHaveLength(3);
  });
});

describe("val", () => {
  const row: RncRow = DATA.rows[0];

  it("métrica 'n' sempre vale 1", () => {
    expect(val(row, "n")).toBe(1);
  });

  it("métrica 'qtd' vale o campo Qtd. c/ problema da linha", () => {
    expect(val(row, "qtd")).toBe(10);
  });
});

describe("agrupa", () => {
  it("agrupa por chave, somando contagem e quantidade", () => {
    const g = agrupa(DATA.rows, (r) => r[1], "n").sort((a, b) => a.chave - b.chave);
    expect(g).toEqual([
      { chave: 0, n: 2, q: 15, v: 2 },
      { chave: 1, n: 1, q: 7, v: 1 },
    ]);
  });

  it("`v` acompanha a métrica ativa (n vs. q)", () => {
    const porN = agrupa(DATA.rows, (r) => r[1], "n").sort((a, b) => a.chave - b.chave);
    const porQtd = agrupa(DATA.rows, (r) => r[1], "qtd").sort((a, b) => a.chave - b.chave);
    expect(porN.map((g) => g.v)).toEqual([2, 1]);
    expect(porQtd.map((g) => g.v)).toEqual([15, 7]);
  });

  it("aceita chave não numérica (ex.: nome de família)", () => {
    const g = agrupa(DATA.rows, (r) => DATA.fams[r[7]], "n");
    const porFam = Object.fromEntries(g.map((x) => [x.chave, x.n]));
    expect(porFam).toEqual({ COLOR: 1, OUTROS: 2 });
  });

  it("lista vazia produz agregação vazia", () => {
    expect(agrupa([], (r) => r[1], "n")).toEqual([]);
  });
});
