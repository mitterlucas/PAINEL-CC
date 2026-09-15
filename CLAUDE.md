# Painel CC (RNC) — regras, stack e estado

Reescrita, em Next.js, do relatório HTML autocontido
`Relatorio_de_Reclamacoes_RNC_jan_a_ago_2026_Alltak.html` (raiz deste
repositório — mantido só como referência para comparação/validação contra o
dado migrado, não faz parte do app Next.js; a pasta `PAINEL CC/` que
originou este projeto foi removida em 2026-09-15, depois do HTML e do
`.xlsx` terem sido movidos pra cá). Repositório próprio:
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
| `filtra()`, `agrupa()`, `val()` | `src/domain/rnc-filtros.ts` ✅ |
| `renderKpis()` (cálculo) | `src/domain/rnc-kpis.ts` ✅ |
| `mesLab/rncDesc/rncFull/rncCurto/fmtMet` | `src/domain/rnc-formatacao.ts` ✅ |
| `svg()/el()/txt()/rbar()/ticks()` + cada `render*` de gráfico | `src/components/rnc/charts/*.tsx` — **pendente** (Fase 4): `GraficoEvolucaoMensal`, `GraficoDonutResultado`, `GraficoStackMensal`, `BarraHorizontal` (genérico, reuso produto/problema/família), `GraficoDiaSemana`, `HeatmapMesProblema` |
| `renderRec()` / `renderDet()` | `TabelaReincidencia.tsx` / `TabelaDetalhamento.tsx` (TanStack Table) — **pendente** (Fase 5) |
| `st` (objeto mutável) + `render()` | `useReducer` em `src/components/rnc/RelatorioRncClient.tsx` — **pendente** (Fase 5): liga `BarraFiltros.tsx` (hoje estática), os gráficos e o botão de CSV (hoje `disabled`) ao `FiltroState`/`filtra()` reais |
| `themeBtn` / `prefers-color-scheme` | `ThemeToggleButton.tsx` ✅ (usa `next-themes`, mesmo comportamento do original: sem persistência entre sessões) |
| `csvBtn` (Blob client-side) | handler dentro do Client Component — **pendente** (Fase 5); botão já existe em `Cabecalho.tsx`, `disabled` até lá |
| `:root{--plane:...}` / `html[data-theme]` | tokens `--rnc-*` em `globals.css` ✅ — porte 1:1 dos valores claro/escuro do original, seletor `html[data-theme="dark"]` virou `:root.dark` (mesma convenção de `ThemeProvider.tsx`) |
| `@media print{...}` | portado 1:1 em `globals.css` ✅ (não testado numa impressão real ainda — os gráficos/tabelas que o `@media print` esconde/ajusta só existem a partir da Fase 4/5) |
| `idbar`/`footer` | `Cabecalho.tsx` ✅ / `Rodape.tsx` ✅ |
| `.filters` (`fMes`/`fRes`/`fFam`/`fRnc`/`fBusca`) | `BarraFiltros.tsx` ✅ — casca visual com opções reais de `rnc.json`, **sem interatividade** ainda (Fase 5) |
| `renderKpis()` (HTML dos cartões) | `Kpis.tsx` ✅ — recebe `KpisRnc` já calculado (`calcularKpis`), por isso funciona hoje com o dataset completo e não muda quando a Fase 5 passar `rows` filtradas |
| `.grid` com os 9 cards de gráfico/tabela | `Card.tsx` ✅ (casca `c3`..`c12`) + `page.tsx` ✅ — mesma ordem/tamanho de coluna do original; conteúdo de cada card é placeholder (`Gráfico — Fase 4` / `Tabela — Fase 5`) até a fase correspondente |

## Estado

- **Fase 0 (fundação) ✅** (commit `3e16151`, pushado) — scaffold Next.js 15
  App Router + TS strict + Tailwind v4/shadcn + `next-themes`, sem
  banco/auth. Os tokens `--background`/`--primary`/etc. de `globals.css` já
  nasceram com os valores reais do relatório (o comentário da época dizia
  "paleta neutra baseColor slate", mas isso nunca refletiu o CSS de fato —
  corrigido na Fase 3).
- **Fase 1 (ingestão) ✅** (commit `665c66a`, pushado) — ver seção "Dados"
  acima para todos os detalhes.
- **Fase 2 (domínio puro) ✅** (commit `5151fa8`, pushado) — portado
  de `Relatorio_de_Reclamacoes_RNC_jan_a_ago_2026_Alltak.html` (linhas
  ~296-426 do `<script>`) para `src/domain/`:
  - `rnc-filtros.ts` — `filtra()`/`val()`/`agrupa()`, com `FiltroState`
    explícito (substitui o `st` mutável) e `agrupa<K>` genérico (aceita
    chave numérica ou string).
  - `rnc-kpis.ts` — `calcularKpis()`, só a parte de CÁLCULO dos 5 cartões de
    `renderKpis` (o HTML dos cartões fica pra Fase 4/5).
  - `rnc-formatacao.ts` — `nf0`, `nf1`, `mesLab`, `rncDesc`, `rncFull`,
    `rncCurto`, `fmtMet` (com `Metrica = "n" | "qtd"` explícito no lugar de
    `st.met`).
  - Testes Vitest (37, todos passando): fixtures sintéticas pequenas
    cobrindo cada dimensão de filtro/agregação/formatação isoladamente +
    casos-limite (lista vazia, um único mês, sem base de comparação), mais
    um bloco de integração usando `src/data/rnc.json` real que confere
    `calcularKpis` contra os números já validados na Fase 1 (total 1.160,
    soma de quantidade 72.769,15, 873 procedentes). `typecheck`/`lint`
    limpos.
- **Fase 3 (tema/layout) ✅** (commit `5151fa8`, pushado) — objetivo
  explícito do usuário: **preservar o frontend do HTML original** — não
  reinventar a UI em componentes shadcn genéricos.
  - `globals.css` — tokens `--rnc-*` com os valores claro/escuro 1:1 do
    `:root`/`html[data-theme="dark"]` original (`--rnc-s1/s2/s3`,
    `--rnc-seq-1..6`, `--rnc-plane/surface/ink/muted/grid/axis/border`,
    etc.), família de fonte `system-ui,-apple-system,"Segoe UI",sans-serif`
    (a fonte Google Inter da Fase 0 foi removida — o original não usa
    webfont) e todo o CSS bespoke portado quase 1:1 (`.idbar`, `header.top`,
    `.filters`, `.chip`, `.grid`/`.c3`..`.c12`, `.kpi`, classes de SVG
    (`.gl`/`.bl`/`.tk`/`.vl`/`.mk`/`.dim`/`.hc-hi`/`.hc-lo`), `#tip`, tabela,
    `.idbar`/`footer`, `@media print`, breakpoint de 720px). Os tokens
    semânticos do shadcn (`--background`/`--primary`/etc.) continuam
    existindo mas não são a fonte da verdade visual — o relatório usa
    sempre `--rnc-*` diretamente.
  - `src/components/rnc/`: `Cabecalho.tsx` (idbar + header, período e
    legenda calculados de `rnc.json`), `ThemeToggleButton.tsx` (client,
    `next-themes`, mesmo comportamento do original — sem persistência),
    `Rodape.tsx` (footer; números dataset-específicos do original tipo "31
    sem resultado" viraram texto de regra geral, pra não ficar
    desatualizado a cada `pnpm importar-rnc`), `BarraFiltros.tsx` (casca
    visual dos filtros, opções reais, **sem interatividade** — Fase 5),
    `Kpis.tsx` (os 5 cartões, recebe `KpisRnc` já calculado), `Card.tsx`
    (casca `.card cN` reaproveitada pelos 9 cards de gráfico/tabela),
    `paleta.ts` (`COR_RESULTADO`/`COR_SEQ`, cores por índice de
    resultado/heatmap — usado aqui na legenda, e de novo nos gráficos da
    Fase 4).
  - `page.tsx` monta a página inteira com dados reais (`filtra(data,
    filtroVazio())` + `calcularKpis`) — os KPIs já são reais e corretos
    hoje; os 9 cards de gráfico/tabela mostram placeholder (`Gráfico — Fase
    4` / `Tabela — Fase 5`) no mesmo tamanho/posição do original.
  - Verificado: `typecheck`/`lint`/`test` (37 testes) limpos, `next build`
    passa. Visual conferido rodando `pnpm dev` e comparando screenshot
    (Playwright, claro e escuro) lado a lado com o HTML original — mesma
    tipografia, cores, espaçamento e estrutura de grid; nenhum erro no
    console do navegador.
- **Fases seguintes:** 4 (os 6 gráficos SVG em React, consumindo
  `rnc-filtros.ts`/`rnc-formatacao.ts`/`paleta.ts`, substituindo os
  placeholders "Gráfico — Fase 4"), 5 (tabelas + `BarraFiltros`
  interativa + `useReducer` + export CSV, consumindo `rnc-kpis.ts` —
  `Kpis.tsx`/`Card.tsx` já prontos pra receber dados filtrados), 6
  (verificação: `typecheck/lint/test/build` + comparação visual/numérica
  contra o HTML), 7 (deploy Vercel).

## Ponto em aberto (não bloqueante)

Atualização do dado hoje é manual: usuário roda `pnpm importar-rnc`
localmente e commita o `rnc.json` atualizado. Não há automação (tipo o
`etl.yml` do 5S NEXT) porque o `.xlsx` só existe na máquina do usuário — se
no futuro for necessário automatizar, precisaria de um lugar acessível por
automação (OneDrive/SharePoint via API, e-mail, etc.).
