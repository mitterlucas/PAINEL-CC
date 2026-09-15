import { BarraFiltros } from "@/components/rnc/BarraFiltros";
import { Cabecalho } from "@/components/rnc/Cabecalho";
import { Card } from "@/components/rnc/Card";
import { Kpis } from "@/components/rnc/Kpis";
import { Rodape } from "@/components/rnc/Rodape";
import rncJson from "@/data/rnc.json";
import { filtra, filtroVazio } from "@/domain/rnc-filtros";
import { calcularKpis } from "@/domain/rnc-kpis";
import type { RncData } from "@/domain/rnc-tipos";

const data = rncJson as unknown as RncData;

// Estrutura de página portada da grid de cards do HTML original (linhas
// 178-292: idbar, header, filtros, kpis, grid de 12 colunas, footer). Os
// gráficos (Fase 4) e as tabelas (Fase 5) ainda são placeholders — o
// `FiltroState`/`useReducer` que os liga entra na Fase 5, por isso os KPIs
// abaixo usam sempre o dataset completo (`filtroVazio()`) por enquanto.
export default function Home() {
  const linhas = filtra(data, filtroVazio());
  const kpis = calcularKpis(data, linhas);

  return (
    <main className="wrap">
      <div id="tip" />
      <Cabecalho />
      <BarraFiltros />
      <Kpis kpis={kpis} data={data} />

      <div className="grid">
        <Card
          span={8}
          titulo="Evolução mensal das reclamações"
          dica="Barras = mês · linha = média móvel de 3 meses · clique numa barra para filtrar o mês"
        >
          <div className="empty">Gráfico — Fase 4</div>
        </Card>
        <Card span={4} titulo="Resultado da reclamação" dica="Clique num anel ou na legenda para filtrar">
          <div className="empty">Gráfico — Fase 4</div>
        </Card>

        <Card
          span={4}
          titulo="Composição mensal por resultado"
          dica="Participação % de cada resultado dentro do mês"
        >
          <div className="empty">Gráfico — Fase 4</div>
        </Card>
        <Card
          span={8}
          titulo="Itens com maior número de reclamações"
          dica="Top 12 produtos · clique numa barra para filtrar"
        >
          <div className="empty">Gráfico — Fase 4</div>
        </Card>

        <Card
          span={8}
          titulo="Problemas reclamados mais incidentes"
          dica="Top 12 motivos de RNC · o número entre parênteses é o código · clique numa barra para filtrar"
        >
          <div className="empty">Gráfico — Fase 4</div>
        </Card>
        <Card span={4} titulo="Família de produto" dica="Clique para filtrar">
          <div className="empty">Gráfico — Fase 4</div>
        </Card>
        <Card span={4} titulo="Reclamações por dia da semana" dica="Distribuição da abertura do chamado">
          <div className="empty">Gráfico — Fase 4</div>
        </Card>

        <Card
          span={8}
          titulo="Mapa de calor · mês × problema reclamado"
          dica="Top 10 motivos · a cor indica a intensidade · clique numa célula para filtrar mês + motivo"
        >
          <div className="empty">Gráfico — Fase 4</div>
        </Card>
        <Card
          span={12}
          titulo="Reclamações incidentes · reincidência por produto"
          dica="Produtos com 3+ reclamações no período, ordenados por reincidência"
        >
          <div className="empty">Tabela — Fase 5</div>
        </Card>

        <Card
          span={12}
          className="no-print"
          titulo="Detalhamento"
          dica="Clique num cabeçalho para ordenar. Esta tabela é a visão acessível de todos os gráficos acima."
        >
          <div className="empty">Tabela — Fase 5</div>
        </Card>
      </div>

      <Rodape />
    </main>
  );
}
