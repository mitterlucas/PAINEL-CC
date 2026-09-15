"use client";

import type { Dispatch } from "react";
import { mesLab, nf0, rncFull } from "@/domain/rnc-formatacao";
import type { RncData } from "@/domain/rnc-tipos";
import type { AcaoPagina, EstadoPagina } from "./estado-pagina";

// Mesma ordem usada pelo <select id="fRnc"> do init() original (linhas
// 810-812): opções ordenadas pela descrição, não pelo código.
function indicesRncPorDescricao(data: RncData) {
  return data.rncs.map((_, i) => i).sort((a, b) => data.rncdesc[a].localeCompare(data.rncdesc[b], "pt-BR"));
}

interface TagFiltro {
  rotulo: string;
  remover: () => void;
}

// Portado de `.filters` + `renderChips()`/`renderNote()` do HTML original
// (linhas 200-216, 759-789): a casca visual agora liga em `estado`/
// `dispatch` (Fase 5) em vez de ficar sempre no estado "sem filtro".
export function BarraFiltros({
  data,
  estado,
  totalRegistros,
  registrosFiltrados,
  dispatch,
}: {
  data: RncData;
  estado: EstadoPagina;
  totalRegistros: number;
  registrosFiltrados: number;
  dispatch: Dispatch<AcaoPagina>;
}) {
  const { filtro, metrica } = estado;

  const tags: TagFiltro[] = [
    ...[...filtro.mes]
      .sort((a, b) => a - b)
      .map((i) => ({
        rotulo: `mês ${mesLab(data.meses[i])}`,
        remover: () => dispatch({ tipo: "ALTERNAR_MES", mes: i }),
      })),
    ...[...filtro.res].map((i) => ({
      rotulo: data.ress[i],
      remover: () => dispatch({ tipo: "ALTERNAR_RESULTADO", resultado: i }),
    })),
    ...(filtro.fam
      ? [{ rotulo: `família ${filtro.fam}`, remover: () => dispatch({ tipo: "DEFINIR_FAMILIA", familia: "" }) }]
      : []),
    ...(filtro.rnc
      ? [
          {
            rotulo: rncFull(data, data.rncs.indexOf(filtro.rnc)),
            remover: () => dispatch({ tipo: "DEFINIR_PROBLEMA", codigoRnc: "" }),
          },
        ]
      : []),
    ...(filtro.busca.trim()
      ? [
          {
            rotulo: `produto "${filtro.busca.trim()}"`,
            remover: () => dispatch({ tipo: "DEFINIR_BUSCA", busca: "" }),
          },
        ]
      : []),
  ];

  return (
    <div className="filters">
      <div className="frow">
        <div className="fgroup">
          <span className="flab">Mês</span>
          {data.meses.map((m, i) => (
            <button
              type="button"
              className="chip"
              aria-pressed={filtro.mes.has(i)}
              onClick={() => dispatch({ tipo: "ALTERNAR_MES", mes: i })}
              key={i}
            >
              {mesLab(m)}
            </button>
          ))}
        </div>
        <div className="fgroup">
          <span className="flab">Resultado</span>
          {data.ress.map((r, i) => (
            <button
              type="button"
              className="chip"
              aria-pressed={filtro.res.has(i)}
              onClick={() => dispatch({ tipo: "ALTERNAR_RESULTADO", resultado: i })}
              key={r}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="fgroup">
          <span className="flab">Métrica</span>
          <button
            type="button"
            className="chip"
            aria-pressed={metrica === "n"}
            onClick={() => dispatch({ tipo: "DEFINIR_METRICA", metrica: "n" })}
          >
            Nº de reclamações
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={metrica === "qtd"}
            onClick={() => dispatch({ tipo: "DEFINIR_METRICA", metrica: "qtd" })}
          >
            Qtd. c/ problema
          </button>
        </div>
        <div className="fgroup">
          <span className="flab">Família</span>
          <select
            value={filtro.fam}
            onChange={(e) => dispatch({ tipo: "DEFINIR_FAMILIA", familia: e.target.value })}
          >
            <option value="">Todas</option>
            {data.fams.map((f) => (
              <option value={f} key={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div className="fgroup">
          <span className="flab">Problema</span>
          <select
            value={filtro.rnc}
            onChange={(e) => dispatch({ tipo: "DEFINIR_PROBLEMA", codigoRnc: e.target.value })}
          >
            <option value="">Todos</option>
            {indicesRncPorDescricao(data).map((i) => (
              <option value={data.rncs[i]} key={data.rncs[i]}>
                {rncFull(data, i)}
              </option>
            ))}
          </select>
        </div>
        <div className="fgroup">
          <span className="flab">Produto</span>
          <input
            type="search"
            placeholder="buscar…"
            style={{ width: 170 }}
            value={filtro.busca}
            onChange={(e) => dispatch({ tipo: "DEFINIR_BUSCA", busca: e.target.value })}
          />
        </div>
      </div>
      <div className="active-note">
        {tags.length === 0 ? (
          <span style={{ color: "var(--rnc-muted)" }}>
            Nenhum filtro ativo · {nf0(registrosFiltrados)} registros · clique nos gráficos para filtrar
          </span>
        ) : (
          <>
            <span style={{ color: "var(--rnc-muted)" }}>Filtros:</span>
            {tags.map((tag) => (
              <span className="tag" key={tag.rotulo}>
                {tag.rotulo}
                <button type="button" title="remover" onClick={tag.remover}>
                  ×
                </button>
              </span>
            ))}
            <span style={{ color: "var(--rnc-muted)" }}>
              → {nf0(registrosFiltrados)} de {nf0(totalRegistros)} registros
            </span>
            <button type="button" className="chip" onClick={() => dispatch({ tipo: "LIMPAR_FILTROS" })}>
              Limpar tudo
            </button>
          </>
        )}
      </div>
    </div>
  );
}
