import rncJson from "@/data/rnc.json";
import { nf0 } from "@/domain/rnc-formatacao";
import { R_DATA } from "@/domain/rnc-tipos";
import type { RncData } from "@/domain/rnc-tipos";

const data = rncJson as unknown as RncData;

// Portado de <footer> do HTML original (linhas 277-291). Os números
// dataset-específicos do original ("31 registros sem resultado", "38 sem
// código", "códigos 42/54/57") ficaram fora de propósito — eram um
// retrato de um export específico e ficariam desatualizados a cada novo
// `pnpm importar-rnc`; o texto abaixo descreve a REGRA (sempre verdadeira),
// não a contagem de um momento específico.
export function Rodape() {
  const primeira = data.rows[0];
  const ultima = data.rows.at(-1);

  return (
    <footer>
      <div>
        <b>Fonte:</b> export de reclamações do Sankhya ·{" "}
        {nf0(data.rows.length)} registros de RNC
        {primeira && ultima ? ` · período ${primeira[R_DATA]} a ${ultima[R_DATA]}` : ""}.
      </div>
      <div>
        <b>Notas metodológicas:</b> a linha de total da planilha é excluída da
        apuração para não duplicar valores; registros sem resultado aparecem
        como “Não classificado” e sem código como “Sem classificação”; as
        descrições dos problemas seguem o glossário <em>Cód. de reclamação</em>{" "}
        e o código original é mantido entre parênteses para rastreabilidade —
        um código não coberto pelo glossário aparece como “Código NN — sem
        descrição”; a coluna Qtd. c/ problema combina metros lineares
        (maioria) e unidades, por isso a métrica principal do relatório é a
        contagem de reclamações, com a quantidade como visão secundária.
      </div>
      <div className="fmeta">
        Elaborado por Gustavo de Oliveira · Desenvolvimento Alltak · dados
        atualizados a partir do export do Sankhya (<code>pnpm importar-rnc</code>) ·{" "}
        <b>documento interno — uso restrito</b>
      </div>
    </footer>
  );
}
