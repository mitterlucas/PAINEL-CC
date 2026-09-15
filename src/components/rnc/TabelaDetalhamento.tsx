"use client";

import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { nf0, nf1 } from "@/domain/rnc-formatacao";
import { R_DATA, R_NRO, R_PROD, R_QTD, R_RES, R_RNC } from "@/domain/rnc-tipos";
import type { RncData, RncRow } from "@/domain/rnc-tipos";
import type { OrdenacaoDetalhamento } from "./estado-pagina";
import { COR_RESULTADO } from "./paleta";

const LIMITE_LINHAS = 400;

interface LinhaDetalhamento {
  id: string;
  dataTexto: string;
  nro: number;
  produto: string;
  problemaDesc: string;
  problemaCodigo: string;
  qtd: number;
  resultado: string;
  resultadoIdx: number;
}

function paraLinha(data: RncData, r: RncRow): LinhaDetalhamento {
  return {
    id: String(r[R_NRO]),
    dataTexto: r[R_DATA],
    nro: r[R_NRO],
    produto: data.prods[r[R_PROD]],
    problemaDesc: data.rncdesc[r[R_RNC]],
    problemaCodigo: data.rncs[r[R_RNC]],
    qtd: r[R_QTD],
    resultado: data.ress[r[R_RES]],
    resultadoIdx: r[R_RES],
  };
}

// Porta de `keyOf` em renderDet() do HTML original (linhas 722-728): data
// vira um inteiro aaaammdd (comparável numericamente), texto/resultado/
// problema comparam pela descrição já resolvida, nro/qtd comparam o número
// puro.
function chaveOrdenacao(linha: LinhaDetalhamento, coluna: number): string | number {
  switch (coluna) {
    case R_DATA: {
      const [d, m, y] = linha.dataTexto.split("/");
      return Number(`${y}${m}${d}`);
    }
    case R_PROD:
      return linha.produto;
    case R_RES:
      return linha.resultado;
    case R_RNC:
      return linha.problemaDesc;
    case R_NRO:
      return linha.nro;
    case R_QTD:
      return linha.qtd;
    default:
      return 0;
  }
}

export function compararLinhasDetalhamento(
  a: LinhaDetalhamento,
  b: LinhaDetalhamento,
  ordenacao: OrdenacaoDetalhamento,
): number {
  const x = chaveOrdenacao(a, ordenacao.coluna);
  const y = chaveOrdenacao(b, ordenacao.coluna);
  const cmp = x > y ? 1 : x < y ? -1 : 0;
  return cmp * ordenacao.direcao;
}

const COLUNAS_CABECALHO: Array<{ coluna: number; rotulo: string; alinharDireita: boolean }> = [
  { coluna: R_DATA, rotulo: "Data", alinharDireita: false },
  { coluna: R_NRO, rotulo: "Nro. único", alinharDireita: true },
  { coluna: R_PROD, rotulo: "Descrição (produto)", alinharDireita: false },
  { coluna: R_RNC, rotulo: "Problema reclamado", alinharDireita: false },
  { coluna: R_QTD, rotulo: "Qtd. c/ problema", alinharDireita: true },
  { coluna: R_RES, rotulo: "Resultado", alinharDireita: false },
];

const features = tableFeatures({});
const colunas = createColumnHelper<typeof features, LinhaDetalhamento>().columns([
  { id: "data", header: "Data", cell: (info) => info.row.original.dataTexto },
  { id: "nro", header: "Nro. único", cell: (info) => info.row.original.nro },
  {
    id: "produto",
    header: "Descrição (produto)",
    cell: (info) => <span style={{ color: "var(--rnc-ink)" }}>{info.row.original.produto}</span>,
  },
  {
    id: "problema",
    header: "Problema reclamado",
    cell: (info) => {
      const linha = info.row.original;
      return (
        <>
          {linha.problemaDesc} <span style={{ color: "var(--rnc-muted)" }}>({linha.problemaCodigo})</span>
        </>
      );
    },
  },
  { id: "qtd", header: "Qtd. c/ problema", cell: (info) => nf1(info.row.original.qtd) },
  {
    id: "resultado",
    header: "Resultado",
    cell: (info) => {
      const linha = info.row.original;
      return (
        <span className="pill" style={{ color: "var(--rnc-ink)" }}>
          <i style={{ background: COR_RESULTADO[linha.resultadoIdx] }} />
          {linha.resultado}
        </span>
      );
    },
  },
]);

// Portado de renderDet() do HTML original (linhas 718-754): lista completa
// (limitada a 400 linhas exibidas, igual ao original) com ordenação por
// clique de cabeçalho — a ordenação em si é `estado.ordenacaoDetalhamento`
// (Fase 5, `RelatorioRncClient`), não um estado interno do TanStack Table.
export function TabelaDetalhamento({
  data,
  rows,
  ordenacao,
  onOrdenar,
}: {
  data: RncData;
  rows: RncRow[];
  ordenacao: OrdenacaoDetalhamento;
  onOrdenar: (coluna: number) => void;
}) {
  const linhas = rows.map((r) => paraLinha(data, r));
  const ordenadas = [...linhas].sort((a, b) => compararLinhasDetalhamento(a, b, ordenacao));
  const exibidas = ordenadas.slice(0, LIMITE_LINHAS);

  const table = useTable({ features, columns: colunas, data: exibidas });

  return (
    <div>
      <div className="tblwrap">
        <table>
          <thead>
            <tr>
              {COLUNAS_CABECALHO.map((c) => (
                <th
                  key={c.coluna}
                  style={c.alinharDireita ? { textAlign: "right" } : undefined}
                  onClick={() => onOrdenar(c.coluna)}
                >
                  {c.rotulo}
                  {ordenacao.coluna === c.coluna ? (ordenacao.direcao > 0 ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exibidas.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getAllCells().map((cell, i) => (
                    <td
                      key={cell.id}
                      className={i === 0 || i === 1 || i === 4 ? "n" : undefined}
                      style={i === 0 ? { textAlign: "left" } : undefined}
                    >
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="empty">
                  Sem registros no filtro atual
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.length > LIMITE_LINHAS ? (
        <div className="hint" style={{ marginTop: 6 }}>
          Exibindo os 400 primeiros de {nf0(rows.length)} registros — refine os filtros ou use &quot;Exportar
          CSV&quot; para a lista completa.
        </div>
      ) : null}
    </div>
  );
}
