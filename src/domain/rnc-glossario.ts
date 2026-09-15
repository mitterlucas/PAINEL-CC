// Conhecimento de domínio que NÃO vem do .xlsx exportado do Sankhya (a
// planilha só traz o código do problema RNC e o nome do produto) — extraído
// do HTML original (Relatorio_de_Reclamacoes_RNC_jan_a_ago_2026_Alltak.html),
// que já tinha essa resolução aplicada aos 1.160 registros de jan-ago/2026.
// Validado 1160/1160 contra o HTML original em 2026-09-15.

// Ordem fixa de apresentação (não é alfabética nem derivada do dado — é a
// mesma ordem/paleta de cor do relatório original: Procedente é a mais
// grave, por isso vem primeiro).
export const RESULTADOS_ORDEM = [
  "Procedente",
  "Improcedente",
  "Acordo Comercial",
  "Não classificado",
] as const;

// Código → descrição (glossário "Cód. de reclamação"). Códigos que
// aparecerem no .xlsx mas não estiverem aqui (ex.: novo código criado no
// Sankhya) caem no fallback de `descricaoDoCodigo` — mesmo comportamento que
// os códigos 42/54/57 já tinham no relatório original ("sem descrição").
const GLOSSARIO_RNC: Record<string, string> = {
  "13": "Acordo comercial",
  "14": "Cancelada",
  "15": "Medida errada",
  "16": "Problema de cola",
  "17": "Pedido errado",
  "18": "Realise",
  "19": "Adesividade",
  "20": "Falha no vinil",
  "21": "Rugas / amassados / marcas",
  "22": "Encolhimento",
  "25": "Dificuldade de aplicação",
  "26": "Baixa resistência",
  "27": "Emenda",
  "28": "Opaco",
  "29": "Material trocado",
  "33": "Dorso do papel soltando",
  "34": "Mancha na impressão",
  "35": "Encanoando",
  "37": "Sujeira",
  "48": "Falha acoplamento",
  "S/C": "Sem classificação",
};

export function descricaoDoCodigo(codigo: string): string {
  return GLOSSARIO_RNC[codigo] ?? `Código ${codigo} — sem descrição`;
}

// Compara códigos numericamente quando possível (o glossário atual só tem
// códigos numéricos de 2 dígitos + "S/C", onde um sort de texto simples já
// dá a ordem certa — mas um código novo de 1 ou 3 dígitos quebraria um sort
// de texto puro; isso deixa robusto pra esse caso sem mudar o resultado
// atual).
export function compararCodigosRnc(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  const aNum = !Number.isNaN(na);
  const bNum = !Number.isNaN(nb);
  if (aNum && bNum) return na - nb;
  if (aNum) return -1;
  if (bNum) return 1;
  return a.localeCompare(b, "pt-BR");
}

// Família = 1ª palavra da descrição do produto, se ela for uma família
// conhecida; senão "OUTROS". Regra reverse-engineered a partir do HTML
// original (não vem de nenhuma coluna da planilha) — validada 1160/1160.
// Um nome de família genuinamente novo (que ainda não exista aqui) cai em
// "OUTROS" silenciosamente, igual ao comportamento já existente hoje pra
// prefixos raros — limitação conhecida, não uma regressão desta reescrita.
const FAMILIAS_CONHECIDAS = new Set([
  "BRUSHED",
  "CARBON",
  "COLOR",
  "DECOR",
  "FPP",
  "KLEAR",
  "KROMA",
  "KRUSHER",
  "LAKA",
  "PREMIUM",
  "PRINT",
  "SATIN",
  "TEC",
  "ULTRA",
]);
export const FAMILIA_OUTROS = "OUTROS";

export function familiaDoProduto(produto: string): string {
  const primeiraPalavra = produto.trim().split(/\s+/)[0]?.toUpperCase() ?? "";
  return FAMILIAS_CONHECIDAS.has(primeiraPalavra) ? primeiraPalavra : FAMILIA_OUTROS;
}
