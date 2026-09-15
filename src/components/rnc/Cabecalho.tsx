import rncJson from "@/data/rnc.json";
import { nf0 } from "@/domain/rnc-formatacao";
import { R_DATA } from "@/domain/rnc-tipos";
import type { RncData } from "@/domain/rnc-tipos";
import { COR_RESULTADO } from "./paleta";
import { ThemeToggleButton } from "./ThemeToggleButton";

const data = rncJson as unknown as RncData;

// Portado de `.idbar` + `header.top` do HTML original (linhas 181-198),
// incluindo o texto do período e a legenda de resultado montados em
// `document.getElementById('periodo')`/`'legTop'` (linhas 802-807).
export function Cabecalho() {
  const primeira = data.rows[0];
  const ultima = data.rows.at(-1);

  return (
    <>
      <div className="idbar">
        <span className="org">
          <b>ALLTAK</b> · Desenvolvimento
        </span>
        <span className="sep">·</span>
        <span>Qualidade / RNC</span>
        <span className="conf">Documento interno — uso restrito</span>
      </div>

      <header className="top">
        <div>
          <h1>Relatório de Reclamações</h1>
          <div className="sub">
            {primeira && ultima
              ? `Período de ${primeira[R_DATA]} a ${ultima[R_DATA]} · ${nf0(data.rows.length)} registros de RNC · ${data.prods.length} produtos · ${data.rncs.length} motivos de reclamação`
              : "Sem dados"}
          </div>
        </div>
        <div className="brandbox">
          <div className="legend-top">
            {data.ress.map((r, i) => (
              <span className="lg" key={r}>
                <span className="sw" style={{ background: COR_RESULTADO[i] }} />
                {r}
              </span>
            ))}
          </div>
          <ThemeToggleButton />
          <button
            type="button"
            className="tbtn"
            disabled
            title="Exportação liberada quando os filtros forem ligados (Fase 5)"
          >
            ↓ Exportar CSV
          </button>
        </div>
      </header>
    </>
  );
}
