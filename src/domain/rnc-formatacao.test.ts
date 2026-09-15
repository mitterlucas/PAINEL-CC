import { describe, expect, it } from "vitest";
import { fmtMet, mesLab, nf0, nf1, rncCurto, rncDesc, rncFull } from "./rnc-formatacao";
import type { RncData } from "./rnc-tipos";

describe("nf0/nf1", () => {
  it("nf0 arredonda pra inteiro com separador de milhar pt-BR", () => {
    expect(nf0(1234.6)).toBe("1.235");
  });

  it("nf1 mantém até 1 casa decimal com vírgula pt-BR", () => {
    expect(nf1(1234.56)).toBe("1.234,6");
    expect(nf1(10)).toBe("10");
  });
});

describe("mesLab", () => {
  it("converte 'aaaa-mm' pra 'mmm/aa'", () => {
    expect(mesLab("2026-01")).toBe("jan/26");
    expect(mesLab("2026-12")).toBe("dez/26");
  });
});

describe("rncDesc/rncFull/rncCurto", () => {
  const DATA: RncData = {
    prods: [],
    fams: [],
    rncs: ["15", "48"],
    // a 2ª descrição tem 27 caracteres — só pra exercitar o corte do rncCurto
    rncdesc: ["Medida errada", "Descrição de teste com vinte e sete"],
    ress: [],
    meses: [],
    rows: [],
  };

  it("rncDesc retorna a descrição pura", () => {
    expect(rncDesc(DATA, 0)).toBe("Medida errada");
  });

  it("rncFull junta descrição + código entre parênteses", () => {
    expect(rncFull(DATA, 0)).toBe("Medida errada (15)");
  });

  it("rncCurto não corta descrição com 26 caracteres ou menos", () => {
    expect(rncDesc(DATA, 0).length).toBeLessThanOrEqual(26);
    expect(rncCurto(DATA, 0)).toBe("Medida errada");
  });

  it("rncCurto corta descrição com mais de 26 caracteres em 25 + reticências", () => {
    expect(DATA.rncdesc[1].length).toBeGreaterThan(26);
    const curto = rncCurto(DATA, 1);
    expect(curto).toBe(`${DATA.rncdesc[1].slice(0, 25)}…`);
    expect(curto.endsWith("…")).toBe(true);
  });
});

describe("fmtMet", () => {
  it("usa nf0 pra métrica 'n' (contagem)", () => {
    expect(fmtMet(1234.6, "n")).toBe(nf0(1234.6));
  });

  it("usa nf1 pra métrica 'qtd'", () => {
    expect(fmtMet(1234.56, "qtd")).toBe(nf1(1234.56));
  });
});
