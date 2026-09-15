import { describe, expect, it } from "vitest";
import { R_DATA, R_PROD } from "@/domain/rnc-tipos";
import { alternarBusca, alternarValor, estadoInicial, reduzirEstadoPagina } from "./estado-pagina";

describe("reduzirEstadoPagina", () => {
  it("ALTERNAR_MES liga e desliga o mesmo mês", () => {
    let estado = estadoInicial();
    estado = reduzirEstadoPagina(estado, { tipo: "ALTERNAR_MES", mes: 2 });
    expect([...estado.filtro.mes]).toEqual([2]);
    estado = reduzirEstadoPagina(estado, { tipo: "ALTERNAR_MES", mes: 2 });
    expect(estado.filtro.mes.size).toBe(0);
  });

  it("ALTERNAR_RESULTADO acumula múltiplos valores", () => {
    let estado = estadoInicial();
    estado = reduzirEstadoPagina(estado, { tipo: "ALTERNAR_RESULTADO", resultado: 0 });
    estado = reduzirEstadoPagina(estado, { tipo: "ALTERNAR_RESULTADO", resultado: 1 });
    expect([...estado.filtro.res].sort()).toEqual([0, 1]);
  });

  it("DEFINIR_FAMILIA/DEFINIR_PROBLEMA/DEFINIR_BUSCA sobrescrevem o campo", () => {
    let estado = estadoInicial();
    estado = reduzirEstadoPagina(estado, { tipo: "DEFINIR_FAMILIA", familia: "COLOR" });
    estado = reduzirEstadoPagina(estado, { tipo: "DEFINIR_PROBLEMA", codigoRnc: "15" });
    estado = reduzirEstadoPagina(estado, { tipo: "DEFINIR_BUSCA", busca: "azul" });
    expect(estado.filtro).toMatchObject({ fam: "COLOR", rnc: "15", busca: "azul" });
  });

  it("DEFINIR_METRICA não mexe no filtro", () => {
    const estado = reduzirEstadoPagina(estadoInicial(), { tipo: "DEFINIR_METRICA", metrica: "qtd" });
    expect(estado.metrica).toBe("qtd");
    expect(estado.filtro).toEqual(estadoInicial().filtro);
  });

  it("ORDENAR_DETALHAMENTO na mesma coluna inverte a direção", () => {
    let estado = estadoInicial();
    expect(estado.ordenacaoDetalhamento).toEqual({ coluna: R_DATA, direcao: -1 });
    estado = reduzirEstadoPagina(estado, { tipo: "ORDENAR_DETALHAMENTO", coluna: R_DATA });
    expect(estado.ordenacaoDetalhamento).toEqual({ coluna: R_DATA, direcao: 1 });
    estado = reduzirEstadoPagina(estado, { tipo: "ORDENAR_DETALHAMENTO", coluna: R_DATA });
    expect(estado.ordenacaoDetalhamento).toEqual({ coluna: R_DATA, direcao: -1 });
  });

  it("ORDENAR_DETALHAMENTO numa coluna nova começa em direção 1", () => {
    const estado = reduzirEstadoPagina(estadoInicial(), { tipo: "ORDENAR_DETALHAMENTO", coluna: R_PROD });
    expect(estado.ordenacaoDetalhamento).toEqual({ coluna: R_PROD, direcao: 1 });
  });

  it("FILTRAR_CELULA_HEATMAP liga mês+problema juntos e desliga se repetir a mesma célula", () => {
    let estado = estadoInicial();
    estado = reduzirEstadoPagina(estado, { tipo: "FILTRAR_CELULA_HEATMAP", mes: 3, codigoRnc: "15" });
    expect(estado.filtro.rnc).toBe("15");
    expect([...estado.filtro.mes]).toEqual([3]);

    estado = reduzirEstadoPagina(estado, { tipo: "FILTRAR_CELULA_HEATMAP", mes: 3, codigoRnc: "15" });
    expect(estado.filtro.rnc).toBe("");
    expect(estado.filtro.mes.size).toBe(0);
  });

  it("FILTRAR_CELULA_HEATMAP numa célula diferente troca em vez de desligar", () => {
    let estado = estadoInicial();
    estado = reduzirEstadoPagina(estado, { tipo: "FILTRAR_CELULA_HEATMAP", mes: 3, codigoRnc: "15" });
    estado = reduzirEstadoPagina(estado, { tipo: "FILTRAR_CELULA_HEATMAP", mes: 5, codigoRnc: "20" });
    expect(estado.filtro.rnc).toBe("20");
    expect([...estado.filtro.mes]).toEqual([5]);
  });

  it("LIMPAR_FILTROS reseta o filtro mas preserva métrica e ordenação", () => {
    let estado = estadoInicial();
    estado = reduzirEstadoPagina(estado, { tipo: "DEFINIR_METRICA", metrica: "qtd" });
    estado = reduzirEstadoPagina(estado, { tipo: "ORDENAR_DETALHAMENTO", coluna: R_PROD });
    estado = reduzirEstadoPagina(estado, { tipo: "ALTERNAR_MES", mes: 1 });
    estado = reduzirEstadoPagina(estado, { tipo: "DEFINIR_FAMILIA", familia: "COLOR" });

    estado = reduzirEstadoPagina(estado, { tipo: "LIMPAR_FILTROS" });

    expect(estado.filtro).toEqual({ mes: new Set(), res: new Set(), fam: "", rnc: "", busca: "" });
    expect(estado.metrica).toBe("qtd");
    expect(estado.ordenacaoDetalhamento).toEqual({ coluna: R_PROD, direcao: 1 });
  });
});

describe("alternarValor", () => {
  it("liga um valor novo", () => {
    expect(alternarValor("", "COLOR")).toBe("COLOR");
  });
  it("desliga se repetir o mesmo valor", () => {
    expect(alternarValor("COLOR", "COLOR")).toBe("");
  });
  it("troca pra outro valor sem desligar", () => {
    expect(alternarValor("COLOR", "OUTROS")).toBe("OUTROS");
  });
});

describe("alternarBusca", () => {
  it("ignora maiúsculas/minúsculas e espaços nas pontas ao comparar", () => {
    expect(alternarBusca("  color azul  ", "COLOR AZUL")).toBe("");
  });
  it("liga a busca por um produto novo", () => {
    expect(alternarBusca("", "COLOR AZUL")).toBe("COLOR AZUL");
  });
});
