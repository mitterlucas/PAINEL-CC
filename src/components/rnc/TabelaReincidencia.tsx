"use client";

import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { nf1, rncDesc } from "@/domain/rnc-formatacao";
import { R_MES, R_PROD, R_QTD, R_RES, R_RNC } from "@/domain/rnc-tipos";
import type { RncData, RncRow } from "@/domain/rnc-tipos";

interface LinhaReincidencia {
  produtoIdx: number;
  produto: string;
  n: number;
  meses: number;
  totalMeses: number;
  motivos: number;
  problemaPredominanteDesc: string;
  problemaPredominanteQtd: number;
  percentualProcedente: number;
  larguraBarraPct: number;
}

const features = tableFeatures({});
const colunas = createColumnHelper<typeof features, LinhaReincidencia>().columns([
  {
    id: "produto",
    header: "Produto",
    cell: (info) => {
      const linha = info.row.original;
      return (
        <>
          <div style={{ fontWeight: 600, color: "var(--rnc-ink)" }}>{linha.produto}</div>
          <div className="mini" style={{ width: `${linha.larguraBarraPct.toFixed(1)}%`, marginTop: 4 }} />
        </>
      );
    },
  },
  {
    id: "problema",
    header: "Problema predominante",
    cell: (info) => {
      const linha = info.row.original;
      return (
        <>
          {linha.problemaPredominanteDesc}{" "}
          <span style={{ color: "var(--rnc-muted)" }}>({linha.problemaPredominanteQtd}×)</span>
        </>
      );
    },
  },
  {
    id: "rncs",
    header: "RNCs",
    cell: (info) => <span style={{ fontWeight: 700, color: "var(--rnc-ink)" }}>{info.row.original.n}</span>,
  },
  {
    id: "meses",
    header: "Meses",
    cell: (info) => `${info.row.original.meses}/${info.row.original.totalMeses}`,
  },
  {
    id: "motivos",
    header: "Motivos",
    cell: (info) => info.row.original.motivos,
  },
  {
    id: "percProc",
    header: "% proc.",
    cell: (info) => `${nf1(info.row.original.percentualProcedente)}%`,
  },
]);

// Portado de renderRec() do HTML original (linhas 679-715): produtos com 3+
// reclamações no período, ordenados por reincidência (nº de RNCs desc, nº de
// meses desc), top 14. Clique numa linha alterna a busca de produto (mesmo
// comportamento de clicar numa barra em `GraficoProdutos`).
export function TabelaReincidencia({
  data,
  rows,
  onClickProduto,
}: {
  data: RncData;
  rows: RncRow[];
  onClickProduto?: (produto: string) => void;
}) {
  const porProduto = new Map<
    number,
    { n: number; q: number; meses: Set<number>; proc: number; rncs: Set<number>; contagem: Map<number, number> }
  >();
  for (const r of rows) {
    const o = porProduto.get(r[R_PROD]) ?? {
      n: 0,
      q: 0,
      meses: new Set<number>(),
      proc: 0,
      rncs: new Set<number>(),
      contagem: new Map<number, number>(),
    };
    o.n++;
    o.q += r[R_QTD];
    o.meses.add(r[R_MES]);
    o.rncs.add(r[R_RNC]);
    o.contagem.set(r[R_RNC], (o.contagem.get(r[R_RNC]) ?? 0) + 1);
    if (data.ress[r[R_RES]] === "Procedente") o.proc++;
    porProduto.set(r[R_PROD], o);
  }

  const lista = [...porProduto.entries()]
    .filter(([, o]) => o.n >= 3)
    .map(([produtoIdx, o]) => {
      const [topRnc, topN] = [...o.contagem.entries()].sort((a, b) => b[1] - a[1])[0];
      return {
        produtoIdx,
        produto: data.prods[produtoIdx],
        n: o.n,
        meses: o.meses.size,
        totalMeses: data.meses.length,
        motivos: o.rncs.size,
        problemaPredominanteDesc: rncDesc(data, topRnc),
        problemaPredominanteQtd: topN,
        percentualProcedente: (o.proc / o.n) * 100,
        larguraBarraPct: 0,
      };
    })
    .sort((a, b) => b.n - a.n || b.meses - a.meses)
    .slice(0, 14);

  const max = Math.max(...lista.map((o) => o.n), 1);
  const linhas: LinhaReincidencia[] = lista.map((o) => ({ ...o, larguraBarraPct: (o.n / max) * 100 }));

  // `useTable` precisa rodar em toda renderização, na mesma ordem — não dá
  // pra ter um `return` condicional (estado vazio) antes dele.
  const table = useTable({ features, columns: colunas, data: linhas });

  if (!lista.length) {
    return <div className="empty">Nenhum produto com 3+ reclamações no filtro atual</div>;
  }

  return (
    <div className="tblwrap" style={{ maxHeight: 392 }}>
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Problema predominante</th>
            <th style={{ textAlign: "right" }}>RNCs</th>
            <th style={{ textAlign: "right" }}>Meses</th>
            <th style={{ textAlign: "right" }}>Motivos</th>
            <th style={{ textAlign: "right" }}>% proc.</th>
          </tr>
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              style={{ cursor: onClickProduto ? "pointer" : "default" }}
              onClick={() => onClickProduto?.(row.original.produto)}
            >
              {row.getAllCells().map((cell, i) => (
                <td key={cell.id} className={i >= 2 ? "n" : undefined}>
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
