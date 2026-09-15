import { RelatorioRncClient } from "@/components/rnc/RelatorioRncClient";
import { Rodape } from "@/components/rnc/Rodape";
import rncJson from "@/data/rnc.json";
import type { RncData } from "@/domain/rnc-tipos";

const data = rncJson as unknown as RncData;

// Casca de página portada de `.wrap` do HTML original (linha 179) — só
// abre a fronteira Server->Client Component e entrega os dados estáticos.
// Tudo que é interativo (filtros, gráficos, tabelas, useReducer) mora em
// `RelatorioRncClient` (Fase 5); `Rodape` fica de fora porque não depende
// de filtro nenhum.
export default function Home() {
  return (
    <main className="wrap">
      <RelatorioRncClient data={data} />
      <Rodape />
    </main>
  );
}
