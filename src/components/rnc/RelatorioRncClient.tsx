"use client";

import { useReducer } from "react";
import { agrupa, filtra } from "@/domain/rnc-filtros";
import { nf0 } from "@/domain/rnc-formatacao";
import { calcularKpis } from "@/domain/rnc-kpis";
import { R_DATA, R_FAM, R_NRO, R_PROD, R_QTD, R_RES, R_RNC } from "@/domain/rnc-tipos";
import type { RncData } from "@/domain/rnc-tipos";
import { BarraFiltros } from "./BarraFiltros";
import { Cabecalho } from "./Cabecalho";
import { Card } from "./Card";
import { alternarBusca, alternarValor, estadoInicial, reduzirEstadoPagina } from "./estado-pagina";
import { BarraHorizontal } from "./graficos/BarraHorizontal";
import { GraficoDiaSemana } from "./graficos/GraficoDiaSemana";
import { GraficoDonutResultado } from "./graficos/GraficoDonutResultado";
import { GraficoEvolucaoMensal } from "./graficos/GraficoEvolucaoMensal";
import { GraficoStackMensal } from "./graficos/GraficoStackMensal";
import { HeatmapMesProblema } from "./graficos/HeatmapMesProblema";
import { Kpis } from "./Kpis";
import { TabelaDetalhamento } from "./TabelaDetalhamento";
import { TabelaReincidencia } from "./TabelaReincidencia";

const CABECALHOS_CSV = [
  "Resultado",
  "Data",
  "Nro Unico",
  "Produto",
  "Cod RNC",
  "Problema reclamado",
  "Qtd c/ problema",
];

// Portado de `render()` + `toggleSet()` + `csvBtn.onclick` do HTML original
// (linhas 757, 791-798, 823-832): o único componente com estado (`useReducer`
// substituindo o `st` mutável) que liga tudo — BarraFiltros, os gráficos, as
// duas tabelas e a exportação CSV — ao mesmo `FiltroState`/`filtra()` reais.
export function RelatorioRncClient({ data }: { data: RncData }) {
  const [estado, dispatch] = useReducer(reduzirEstadoPagina, estadoInicial());
  const { filtro, metrica, ordenacaoDetalhamento } = estado;

  const linhas = filtra(data, filtro);
  // Único gráfico que precisa recalcular sua própria base ignorando o
  // filtro de "problema" (ver HeatmapMesProblema.tsx) — igual ao
  // `filtra('rnc')` do renderHeat() original.
  const linhasHeat = filtra(data, filtro, "rnc");
  const kpis = calcularKpis(data, linhas);

  const gProdutos = agrupa(linhas, (r) => r[R_PROD], metrica)
    .sort((a, b) => b.v - a.v)
    .slice(0, 12)
    .map((d) => ({ ...d, rotulo: data.prods[d.chave] }));
  const gProblemas = agrupa(linhas, (r) => r[R_RNC], metrica)
    .sort((a, b) => b.v - a.v)
    .slice(0, 12)
    .map((d) => ({ ...d, rotulo: `${data.rncdesc[d.chave]} (${data.rncs[d.chave]})` }));
  const gFamilias = agrupa(linhas, (r) => r[R_FAM], metrica)
    .sort((a, b) => b.v - a.v)
    .slice(0, 9)
    .map((d) => ({ ...d, rotulo: data.fams[d.chave] }));

  function exportarCsv() {
    const linhasCsv = linhas.map((r) =>
      [
        data.ress[r[R_RES]],
        r[R_DATA],
        r[R_NRO],
        data.prods[r[R_PROD]],
        data.rncs[r[R_RNC]],
        data.rncdesc[r[R_RNC]],
        String(r[R_QTD]).replace(".", ","),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";"),
    );
    const conteudo = [CABECALHOS_CSV.join(";"), ...linhasCsv].join("\r\n");
    const blob = new Blob([`﻿${conteudo}`], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "reclamacoes-filtrado.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <Cabecalho onExportarCsv={exportarCsv} />
      <BarraFiltros
        data={data}
        estado={estado}
        totalRegistros={data.rows.length}
        registrosFiltrados={linhas.length}
        dispatch={dispatch}
      />
      <Kpis kpis={kpis} data={data} />

      <div className="grid">
        <Card
          span={8}
          titulo="Evolução mensal das reclamações"
          dica="Barras = mês · linha = média móvel de 3 meses · clique numa barra para filtrar o mês"
        >
          <GraficoEvolucaoMensal
            data={data}
            rows={linhas}
            metrica={metrica}
            mesesAtivos={filtro.mes}
            onClickMes={(mes) => dispatch({ tipo: "ALTERNAR_MES", mes })}
          />
        </Card>
        <Card span={4} titulo="Resultado da reclamação" dica="Clique num anel ou na legenda para filtrar">
          <GraficoDonutResultado
            data={data}
            rows={linhas}
            metrica={metrica}
            resAtivos={filtro.res}
            onClickRes={(resultado) => dispatch({ tipo: "ALTERNAR_RESULTADO", resultado })}
          />
        </Card>

        <Card
          span={4}
          titulo="Composição mensal por resultado"
          dica="Participação % de cada resultado dentro do mês"
        >
          <GraficoStackMensal
            data={data}
            rows={linhas}
            resAtivos={filtro.res}
            onClickRes={(resultado) => dispatch({ tipo: "ALTERNAR_RESULTADO", resultado })}
          />
        </Card>
        <Card
          span={8}
          titulo="Itens com maior número de reclamações"
          dica="Top 12 produtos · clique numa barra para filtrar"
        >
          <BarraHorizontal
            dados={gProdutos}
            metrica={metrica}
            ativo={(d) => filtro.busca === "" || d.rotulo.includes(filtro.busca.trim().toUpperCase())}
            aoClicar={(d) => dispatch({ tipo: "DEFINIR_BUSCA", busca: alternarBusca(filtro.busca, d.rotulo) })}
            largura={880}
            alturaLinha={27}
          />
        </Card>

        <Card
          span={8}
          titulo="Problemas reclamados mais incidentes"
          dica="Top 12 motivos de RNC · o número entre parênteses é o código · clique numa barra para filtrar"
        >
          <BarraHorizontal
            dados={gProblemas}
            metrica={metrica}
            ativo={(d) => filtro.rnc === "" || filtro.rnc === data.rncs[d.chave]}
            aoClicar={(d) =>
              dispatch({ tipo: "DEFINIR_PROBLEMA", codigoRnc: alternarValor(filtro.rnc, data.rncs[d.chave]) })
            }
            largura={880}
            alturaLinha={27}
          />
        </Card>
        <Card span={4} titulo="Família de produto" dica="Clique para filtrar">
          <BarraHorizontal
            dados={gFamilias}
            metrica={metrica}
            ativo={(d) => filtro.fam === "" || filtro.fam === d.rotulo}
            aoClicar={(d) => dispatch({ tipo: "DEFINIR_FAMILIA", familia: alternarValor(filtro.fam, d.rotulo) })}
            largura={420}
            alturaLinha={26}
          />
        </Card>
        <Card span={4} titulo="Reclamações por dia da semana" dica="Distribuição da abertura do chamado">
          <GraficoDiaSemana rows={linhas} metrica={metrica} />
        </Card>

        <Card
          span={8}
          titulo="Mapa de calor · mês × problema reclamado"
          dica="Top 10 motivos · a cor indica a intensidade · clique numa célula para filtrar mês + motivo"
        >
          <HeatmapMesProblema
            data={data}
            rows={linhasHeat}
            metrica={metrica}
            onClickCelula={(mesIdx, codigoRnc) => dispatch({ tipo: "FILTRAR_CELULA_HEATMAP", mes: mesIdx, codigoRnc })}
          />
        </Card>
        <Card
          span={12}
          titulo="Reclamações incidentes · reincidência por produto"
          dica="Produtos com 3+ reclamações no período, ordenados por reincidência"
        >
          <TabelaReincidencia
            data={data}
            rows={linhas}
            onClickProduto={(produto) => dispatch({ tipo: "DEFINIR_BUSCA", busca: alternarBusca(filtro.busca, produto) })}
          />
        </Card>

        <Card
          span={12}
          className="no-print"
          titulo={`Detalhamento · ${nf0(linhas.length)} registros`}
          dica="Clique num cabeçalho para ordenar. Esta tabela é a visão acessível de todos os gráficos acima."
        >
          <TabelaDetalhamento
            data={data}
            rows={linhas}
            ordenacao={ordenacaoDetalhamento}
            onOrdenar={(coluna) => dispatch({ tipo: "ORDENAR_DETALHAMENTO", coluna })}
          />
        </Card>
      </div>
    </>
  );
}
