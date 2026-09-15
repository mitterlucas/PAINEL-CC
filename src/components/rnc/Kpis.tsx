import { mesLab, nf0, nf1 } from "@/domain/rnc-formatacao";
import type { KpisRnc } from "@/domain/rnc-kpis";
import type { RncData } from "@/domain/rnc-tipos";

// Portado de renderKpis() do HTML original (linhas 401-426) — só o HTML dos
// 5 cartões; o cálculo já mora em `calcularKpis` (rnc-kpis.ts, Fase 2). Puro
// o bastante pra já funcionar hoje com o dataset completo e ser reaproveitado
// sem mudança quando a Fase 5 passar `rows` filtradas.
export function Kpis({ kpis, data }: { kpis: KpisRnc; data: RncData }) {
  const {
    total,
    qtdTotal,
    procedentes,
    percentualProcedentes,
    porMes,
    mediaPorMes,
    ultimoMes,
    mesAnterior,
    variacaoPercentualUltimoMes,
    produtosDistintos,
    produtosReincidentes,
  } = kpis;

  return (
    <div className="kpis">
      <div className="kpi">
        <div className="k">Reclamações no período</div>
        <div className="v">{nf0(total)}</div>
        <div className="d">
          {porMes.length} meses · média de {nf1(mediaPorMes)}/mês
        </div>
      </div>

      <div className="kpi">
        <div className="k">Qtd. c/ problema</div>
        <div className="v">
          {nf1(qtdTotal)} <small>m / un</small>
        </div>
        <div className="d">
          média de {nf1(total ? qtdTotal / total : 0)} por reclamação
        </div>
      </div>

      <div className="kpi">
        <div className="k">Procedentes</div>
        <div className="v">
          {percentualProcedentes !== null ? (
            <>
              {percentualProcedentes.toFixed(1).replace(".", ",")}
              <small>%</small>
            </>
          ) : (
            "–"
          )}
        </div>
        <div className="d">
          {nf0(procedentes)} de {nf0(total)} reclamações
        </div>
      </div>

      <div className="kpi">
        <div className="k">Último mês vs. anterior</div>
        <div className="v">{ultimoMes ? nf0(ultimoMes.n) : "–"}</div>
        <div className="d">
          {variacaoPercentualUltimoMes === null ? (
            "sem base de comparação"
          ) : (
            <span className={variacaoPercentualUltimoMes >= 0 ? "up" : "dn"}>
              {variacaoPercentualUltimoMes >= 0 ? "▲" : "▼"}{" "}
              {nf1(Math.abs(variacaoPercentualUltimoMes))}%
            </span>
          )}
          {mesAnterior ? ` vs. ${mesLab(data.meses[mesAnterior.mesIdx])}` : ""}
        </div>
      </div>

      <div className="kpi">
        <div className="k">Produtos reincidentes</div>
        <div className="v">{nf0(produtosReincidentes)}</div>
        <div className="d">
          de {nf0(produtosDistintos)} produtos distintos (3+ RNCs)
        </div>
      </div>
    </div>
  );
}
