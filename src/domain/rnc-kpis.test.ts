import { describe, expect, it } from "vitest";
import rncReal from "../data/rnc.json";
import { filtra, filtroVazio } from "./rnc-filtros";
import { calcularKpis } from "./rnc-kpis";
import type { RncData } from "./rnc-tipos";

// Fixture sintética com 3 meses (pra exercitar "último mês vs. anterior" e a
// distinção entre reincidente e não-reincidente) — valores calculados à mão.
// ress: 0=Procedente, 1=Improcedente · meses: 0=jan, 1=fev, 2=mar
const DATA: RncData = {
  prods: ["A", "B"],
  fams: ["X"],
  rncs: ["15"],
  rncdesc: ["Medida errada"],
  ress: ["Procedente", "Improcedente"],
  meses: ["2026-01", "2026-02", "2026-03"],
  rows: [
    // [res, mes, data, nro, prod, rnc, qtd, fam]
    [0, 0, "05/01/2026", 1, 0, 0, 10, 0], // jan, produto A, procedente
    [0, 0, "06/01/2026", 2, 0, 0, 5, 0], // jan, produto A, procedente
    [1, 1, "05/02/2026", 3, 0, 0, 3, 0], // fev, produto A, improcedente
    [0, 1, "06/02/2026", 4, 1, 0, 4, 0], // fev, produto B, procedente
    [0, 2, "05/03/2026", 5, 0, 0, 1, 0], // mar, produto A, procedente
    [0, 2, "06/03/2026", 6, 1, 0, 1, 0], // mar, produto B, procedente
    [0, 2, "07/03/2026", 7, 1, 0, 1, 0], // mar, produto B, procedente
    [0, 2, "08/03/2026", 8, 1, 0, 1, 0], // mar, produto B, procedente
  ],
};

describe("calcularKpis (fixture sintética)", () => {
  const k = calcularKpis(DATA, DATA.rows);

  it("total e qtdTotal", () => {
    expect(k.total).toBe(8);
    expect(k.qtdTotal).toBe(10 + 5 + 3 + 4 + 1 + 1 + 1 + 1);
  });

  it("procedentes e percentual", () => {
    expect(k.procedentes).toBe(7);
    expect(k.percentualProcedentes).toBeCloseTo((7 / 8) * 100, 10);
  });

  it("porMes ordenado por mesIdx, com média por mês", () => {
    expect(k.porMes).toEqual([
      { mesIdx: 0, n: 2 },
      { mesIdx: 1, n: 2 },
      { mesIdx: 2, n: 4 },
    ]);
    expect(k.mediaPorMes).toBeCloseTo(8 / 3, 10);
  });

  it("último mês vs. anterior", () => {
    expect(k.ultimoMes).toEqual({ mesIdx: 2, n: 4 });
    expect(k.mesAnterior).toEqual({ mesIdx: 1, n: 2 });
    // (4-2)/2*100 = 100%
    expect(k.variacaoPercentualUltimoMes).toBeCloseTo(100, 10);
  });

  it("produtos distintos e reincidentes (3+ reclamações no período)", () => {
    // produto A: linhas 1,2,3,5 = 4 ocorrências · produto B: linhas 4,6,7,8 = 4 ocorrências
    expect(k.produtosDistintos).toBe(2);
    expect(k.produtosReincidentes).toBe(2);
  });
});

describe("calcularKpis — casos-limite", () => {
  it("sem linhas: percentual e variação ficam null, média zero", () => {
    const k = calcularKpis(DATA, []);
    expect(k.total).toBe(0);
    expect(k.percentualProcedentes).toBeNull();
    expect(k.porMes).toEqual([]);
    expect(k.mediaPorMes).toBe(0);
    expect(k.ultimoMes).toBeNull();
    expect(k.mesAnterior).toBeNull();
    expect(k.variacaoPercentualUltimoMes).toBeNull();
  });

  it("um único mês: sem mês anterior, variação null", () => {
    const umMes = DATA.rows.filter((r) => r[1] === 0);
    const k = calcularKpis(DATA, umMes);
    expect(k.porMes).toEqual([{ mesIdx: 0, n: 2 }]);
    expect(k.mesAnterior).toBeNull();
    expect(k.variacaoPercentualUltimoMes).toBeNull();
  });

  it("variação negativa quando o último mês tem menos reclamações que o anterior", () => {
    // fev (2) -> mar (4) é alta; recorta só jan (2) e fev (2)... precisa de
    // uma queda real: usa só as linhas de jan (2) e uma única linha de fev.
    const janEUmaDeFev = [DATA.rows[0], DATA.rows[1], DATA.rows[2]]; // jan:2, fev:1
    const k = calcularKpis(DATA, janEUmaDeFev);
    expect(k.porMes).toEqual([
      { mesIdx: 0, n: 2 },
      { mesIdx: 1, n: 1 },
    ]);
    // (1-2)/2*100 = -50%
    expect(k.variacaoPercentualUltimoMes).toBeCloseTo(-50, 10);
  });
});

describe("calcularKpis — dado real (src/data/rnc.json)", () => {
  const data = rncReal as unknown as RncData;
  const todasAsLinhas = filtra(data, filtroVazio());
  const k = calcularKpis(data, todasAsLinhas);

  it("total bate com os 1.160 registros validados na Fase 1", () => {
    expect(k.total).toBe(1160);
  });

  it("qtdTotal bate com a soma da planilha original (72.769,15)", () => {
    expect(k.qtdTotal).toBeCloseTo(72769.15, 2);
  });

  it("procedentes bate com contagem independente por DATA.ress", () => {
    const procedentesIndependente = todasAsLinhas.filter(
      (r) => data.ress[r[0]] === "Procedente",
    ).length;
    expect(procedentesIndependente).toBe(873); // conferido manualmente contra rnc.json
    expect(k.procedentes).toBe(procedentesIndependente);
  });

  it("porMes cobre os 8 meses do período e soma de volta o total", () => {
    expect(k.porMes).toHaveLength(8);
    expect(k.porMes.reduce((acc, m) => acc + m.n, 0)).toBe(k.total);
  });

  it("produtosReincidentes é menor ou igual a produtosDistintos", () => {
    expect(k.produtosReincidentes).toBeLessThanOrEqual(k.produtosDistintos);
    expect(k.produtosDistintos).toBeGreaterThan(0);
  });
});
