// Cores por índice — não é domínio (não descreve regra de negócio), é
// identidade visual do relatório original, usada tanto na legenda do
// cabeçalho quanto nos gráficos (donut/stack na Fase 4). Índices casam com a
// ordem de `RESULTADOS_ORDEM`/`data.ress` (rnc-glossario.ts) e com
// `data.meses`/heatmap por intensidade — ver `COR`/`SEQ` no HTML original,
// linhas 301-302.
export const COR_RESULTADO = [
  "var(--rnc-s1)",
  "var(--rnc-s2)",
  "var(--rnc-s3)",
  "var(--rnc-muted)",
] as const;

export const COR_SEQ = [
  "var(--rnc-seq-1)",
  "var(--rnc-seq-2)",
  "var(--rnc-seq-3)",
  "var(--rnc-seq-4)",
  "var(--rnc-seq-5)",
  "var(--rnc-seq-6)",
] as const;
