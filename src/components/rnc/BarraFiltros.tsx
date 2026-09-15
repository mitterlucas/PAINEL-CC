import rncJson from "@/data/rnc.json";
import { mesLab, nf0, rncFull } from "@/domain/rnc-formatacao";
import type { RncData } from "@/domain/rnc-tipos";

const data = rncJson as unknown as RncData;

// Mesma ordem usada pelo <select id="fRnc"> do init() original (linhas
// 810-812): opções ordenadas pela descrição, não pelo código.
const indicesRncPorDescricao = data.rncs
  .map((_, i) => i)
  .sort((a, b) => data.rncdesc[a].localeCompare(data.rncdesc[b], "pt-BR"));

// Portado de `.filters` do HTML original (linhas 200-216) — só a casca
// visual por enquanto. Os controles usam as opções reais de
// `src/data/rnc.json`, mas ainda não disparam filtro: isso depende do
// `FiltroState`/`useReducer` da Fase 5 (ver mapa de migração no CLAUDE.md).
export function BarraFiltros() {
  return (
    <div className="filters">
      <div className="frow">
        <div className="fgroup">
          <span className="flab">Mês</span>
          {data.meses.map((m, i) => (
            <button type="button" className="chip" aria-pressed="false" key={i}>
              {mesLab(m)}
            </button>
          ))}
        </div>
        <div className="fgroup">
          <span className="flab">Resultado</span>
          {data.ress.map((r) => (
            <button type="button" className="chip" aria-pressed="false" key={r}>
              {r}
            </button>
          ))}
        </div>
        <div className="fgroup">
          <span className="flab">Métrica</span>
          <button type="button" className="chip" aria-pressed="true">
            Nº de reclamações
          </button>
          <button type="button" className="chip" aria-pressed="false">
            Qtd. c/ problema
          </button>
        </div>
        <div className="fgroup">
          <span className="flab">Família</span>
          <select defaultValue="">
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
          <select defaultValue="">
            <option value="">Todos</option>
            {indicesRncPorDescricao.map((i) => (
              <option value={data.rncs[i]} key={data.rncs[i]}>
                {rncFull(data, i)}
              </option>
            ))}
          </select>
        </div>
        <div className="fgroup">
          <span className="flab">Produto</span>
          <input type="search" placeholder="buscar…" style={{ width: 170 }} />
        </div>
      </div>
      <div className="active-note">
        {/* Nenhum filtro é aplicável ainda (Fase 5) — por ora sempre reflete
            o dataset inteiro, igual ao estado inicial (`tags.length===0`) de
            renderNote() no HTML original, linha 779. */}
        <span style={{ color: "var(--rnc-muted)" }}>
          Nenhum filtro ativo · {nf0(data.rows.length)} registros
        </span>
      </div>
    </div>
  );
}
