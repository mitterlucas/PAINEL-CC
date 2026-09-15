# Painel CC (RNC) — regras, stack e estado

Reescrita, em Next.js, do relatório HTML autocontido
`PAINEL CC/Relatorio_de_Reclamacoes_RNC_jan_a_ago_2026_Alltak.html` (fora
deste repositório — projeto irmão em `Desktop/Python/PAINEL CC/`, só o HTML
fica lá agora; o `.xlsx` de origem já foi movido pra dentro deste projeto,
ver "Dados" abaixo). Repositório próprio:
`https://github.com/mitterlucas/PAINEL-CC.git` (mesma conta do
`PAINEL 5S NEXT`, branch `master`).

**Antes de continuar o trabalho, releia este arquivo inteiro** — ele existe
pra permitir retomar em outra conversa sem reprocessar a análise do HTML
original.

## Decisões de arquitetura (validadas com o usuário, não reabrir sem motivo)

- **Sem login.** O HTML original não tem autenticação — "documento interno"
  é só uma marcação visual. O painel fixo mantém o mesmo comportamento.
- **Sem banco de dados.** Dados estáticos, gerados a partir de um `.xlsx` —
  nada de Postgres/Drizzle/Neon (diferente do `PAINEL 5S NEXT`/`PAINEL SVD`).
- **Ingestão via arquivo solto na pasta**, não ETL agendado. O `.xlsx`/`.xls`
  é exportado manualmente do Sankhya, colocado em `data/source/`, e
  `pnpm importar-rnc` (`scripts/importar-rnc.ts`) gera `src/data/rnc.json`
  (commitado — é o dado do relatório, não segredo). Fluxo de atualização
  documentado no `README.md`.
- **Formato de dado colunar preservado**, igual ao `DATA` do HTML original:
  `prods/fams/rncs/rncdesc/ress/meses` (dicionários de valor único) + `rows`
  (cada linha referencia os dicionários por índice — ver
  `src/domain/rnc-tipos.ts`).
- **Gráficos em SVG feito à mão via React, não Plotly.** O HTML original tem
  visuais bem específicos (donut com tabela acessível embutida, heatmap com
  paleta sequencial própria, barras horizontais genéricas reaproveitadas por
  3 dimensões) — portar a matemática existente é mais fiel e mais barato do
  que reconstruir em Plotly. Diferente do `PAINEL 5S NEXT`.
- **Estado do filtro via `useReducer`** num Client Component único
  (substitui o objeto mutável `st` + `render()` manual do HTML original).
- **Tabelas via TanStack Table**, substituindo o sort manual + corte em 400
  linhas do HTML original.
- **Export CSV** client-side (Blob), igual ao original. **Export PDF**
  continua sendo `window.print()` do navegador (`@media print` em
  `globals.css`) — sem gerar PDF no servidor.
- **Commit só com autorização explícita do usuário**, mesmo dentro de uma
  fase/tarefa já autorizada de forma ampla — pedir antes de cada
  `git commit` (e antes de cada `git push`, separadamente).

## Gotchas de ambiente (válidos nesta máquina)

- **Node fora do PATH** — instalação portátil em
  `C:\Users\Gustavo.Oliveira\AppData\Local\NodeJS\node-v22.14.0-win-x64`.
  Exportar o PATH a cada sessão de shell nova antes de rodar
  `node`/`pnpm`/`npx`/`tsx`:
  `export PATH="/c/Users/Gustavo.Oliveira/AppData/Local/NodeJS/node-v22.14.0-win-x64:$PATH"`
- **Credencial git via GitHub CLI, não Windows Credential Manager.** O git
  global usa `gh.exe auth git-credential` como helper pra `github.com`
  (`git config --global --get credential.https://github.com.helper`). Se o
  push falhar com "Permission ... denied to <conta-errada>" mesmo já tendo
  "trocado o login", o problema é a conta ATIVA no `gh` CLI, não o Windows
  Credential Manager. Fix: `gh auth status` (mostra todas as contas
  logadas) → `gh auth switch --hostname github.com --user mitterlucas`.
  Contas conhecidas nesta máquina: `alltakpcp-ctrl` (CMMS/DASHS/PAINEL SVD)
  e `mitterlucas` (PAINEL 5S NEXT, este projeto).

## Dados (Fase 1 ✅) — o que o `.xlsx` do Sankhya realmente contém

Export do Sankhya = 1 planilha, cabeçalho na linha 1, colunas (nomes exatos,
usados por `scripts/importar-rnc.ts::COLUNAS` pra achar a coluna certa
mesmo que a ORDEM mude num export futuro):

| Coluna do Sankhya | Uso no relatório |
|---|---|
| `Status RRC` | **não usado** (workflow interno, fora do escopo do relatório) |
| `Procedente/Improcedente` | → `R_RES` — vazio vira `"Não classificado"` |
| `Data/Hora Chamada` | → `R_MES` + `R_DATA` (só a data, hora é descartada) |
| `Nro. Único` | → `R_NRO`; linha sem valor aqui = linha de total da planilha → **excluída** |
| `Descrição (Produto)` | → `R_PROD`; 1ª palavra também define `R_FAM` (ver glossário) |
| `Problema RNC` | → `R_RNC` (código); vazio vira pseudo-código `"S/C"` |
| `Nome Parceiro` | **não usado** (não existe no `DATA` do HTML original) |
| `Qtd. c/ problema` | → `R_QTD` (mistura metros lineares e unidades, como no original) |

**Conhecimento que NÃO vem da planilha** (reverse-engineered do HTML
original, validado célula a célula — ver `src/domain/rnc-glossario.ts`):
- Glossário código→descrição RNC (24 códigos + "S/C"). Código novo que não
  estiver no mapa vira `"Código NN — sem descrição"` automaticamente (mesmo
  padrão que os códigos 42/54/57 já tinham no relatório original).
- Ordem fixa de `ress` (`Procedente, Improcedente, Acordo Comercial, Não
  classificado`) — não é alfabética, é a ordem/cor do relatório original.
- Família = 1ª palavra do produto, se estiver no conjunto conhecido
  (`BRUSHED, CARBON, COLOR, DECOR, FPP, KLEAR, KROMA, KRUSHER, LAKA,
  PREMIUM, PRINT, SATIN, TEC, ULTRA`); senão `"OUTROS"`.

**Bug real encontrado e corrigido na Fase 1:** `XLSX.read(..., {cellDates:
true})` do SheetJS aplica um deslocamento de **+3h** ao converter datas
deste `.xls` legado (BIFF) — só fica visível quando o horário cruza a
meia-noite (10 dos 1.160 registros do arquivo de exemplo mudavam de dia por
causa disso). Fix: `scripts/importar-rnc.ts` **não usa `cellDates`**, faz a
conversão manualmente a partir do serial numérico do Excel
(`serialParaDataUtc`, fórmula padrão documentada pelo próprio SheetJS), em
UTC puro, sem depender do fuso do ambiente onde o script roda.

**Verificação feita:** os 1.160 registros gerados em `src/data/rnc.json`
foram comparados campo a campo contra o `DATA` embutido no HTML original —
**1160/1160 idênticos** (produto, família, resultado, código+descrição RNC,
data, quantidade), soma de quantidade batendo exatamente com o total da
planilha (72.769,15). Script de comparação foi temporário
(`scripts/_tmp-*.ts`, apagado ao final — recriar do zero se precisar
reverificar; a lógica está descrita acima, não precisa arqueologia).

## Mapa de migração (HTML antigo → Next.js novo)

| HTML original | Next.js novo |
|---|---|
| `.xls` do Sankhya (pasta `PAINEL CC/`, manual) | `data/source/*.xls(x)` ✅ |
| — | `scripts/importar-rnc.ts` ✅ (lê o mais recente por mtime, gera `src/data/rnc.json`) |
| `const DATA = {...}` | `src/data/rnc.json` ✅ + `src/domain/rnc-tipos.ts` ✅ (tipos) |
| `const R_RES=0,...` | `src/domain/rnc-tipos.ts` (`R_RES`...`R_FAM`) ✅ |
| glossário/família reverse-engineered | `src/domain/rnc-glossario.ts` ✅ |
| `filtra()`, `agrupa()`, `val()` | `src/domain/rnc-filtros.ts` — **pendente** (Fase 2) |
| `renderKpis()` (cálculo) | `src/domain/rnc-kpis.ts` — **pendente** (Fase 2) |
| `mesLab/rncDesc/rncFull/rncCurto/fmtMet` | `src/domain/rnc-formatacao.ts` — **pendente** (Fase 2) |
| `svg()/el()/txt()/rbar()/ticks()` + cada `render*` de gráfico | `src/components/rnc/charts/*.tsx` — **pendente** (Fase 4): `GraficoEvolucaoMensal`, `GraficoDonutResultado`, `GraficoStackMensal`, `BarraHorizontal` (genérico, reuso produto/problema/família), `GraficoDiaSemana`, `HeatmapMesProblema` |
| `renderRec()` / `renderDet()` | `TabelaReincidencia.tsx` / `TabelaDetalhamento.tsx` (TanStack Table) — **pendente** (Fase 5) |
| `st` (objeto mutável) + `render()` | `useReducer` em `src/components/rnc/RelatorioRncClient.tsx` — **pendente** (Fase 5) |
| `themeBtn` / `prefers-color-scheme` | `ThemeProvider` ✅ (Fase 0), paleta real do relatório ainda **pendente** (Fase 3) |
| `csvBtn` (Blob client-side) | handler dentro do Client Component — **pendente** (Fase 5) |
| `:root{--plane:...}` / `html[data-theme]` | tokens Tailwind v4 em `globals.css` — placeholder neutro hoje, paleta real **pendente** (Fase 3) |
| `@media print{...}` | mantido quase igual em `globals.css` — **pendente** (Fase 3, junto com o tema) |
| `idbar`/`footer` | `Cabecalho.tsx` / `Rodape.tsx` — **pendente** (Fase 3 ou 4) |

## Estado

- **Fase 0 (fundação) ✅** (commit `3e16151`, pushado) — scaffold Next.js 15
  App Router + TS strict + Tailwind v4/shadcn + `next-themes`, sem
  banco/auth. Paleta neutra provisória (baseColor slate) — a paleta real do
  relatório entra na Fase 3.
- **Fase 1 (ingestão) ✅** (commit `665c66a`, aguardando push — pedir
  autorização antes) — ver seção "Dados" acima para todos os detalhes.
- **Fase 2 (domínio puro)** — próximo passo. Portar de
  `Relatorio_de_Reclamacoes_RNC_jan_a_ago_2026_Alltak.html`
  (`PAINEL CC/`, linhas ~296-400 do `<script>`) as funções `filtra`,
  `agrupa`, `val`, KPIs (`renderKpis`, só a parte de CÁLCULO, não o HTML) e
  formatação (`mesLab`, `rncFull`, `rncCurto`, `fmtMet`) para
  `src/domain/*.ts`, com testes Vitest comparando contra os números que o
  HTML mostra hoje (mesmo método usado no 5S NEXT: comparar valor a valor
  contra a fonte original).
- **Fases seguintes:** 3 (tema/layout com a paleta real: laranja `--s1`/azul
  `--s2`/verde `--s3` + heatmap `seq-1..6`), 4 (os 6 gráficos SVG em React),
  5 (tabelas + filtros + `useReducer` + export CSV), 6 (verificação:
  `typecheck/lint/test/build` + comparação visual/numérica contra o HTML),
  7 (deploy Vercel).

## Ponto em aberto (não bloqueante)

Atualização do dado hoje é manual: usuário roda `pnpm importar-rnc`
localmente e commita o `rnc.json` atualizado. Não há automação (tipo o
`etl.yml` do 5S NEXT) porque o `.xlsx` só existe na máquina do usuário — se
no futuro for necessário automatizar, precisaria de um lugar acessível por
automação (OneDrive/SharePoint via API, e-mail, etc.).
