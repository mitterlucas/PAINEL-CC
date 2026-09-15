# Painel CC (RNC) — regras e stack

Reescrita, em Next.js, do relatório HTML autocontido
`PAINEL CC/Relatorio_de_Reclamacoes_RNC_jan_a_ago_2026_Alltak.html` (fora
deste repositório — projeto irmão em `Desktop/Python/PAINEL CC/`). Repositório
próprio: `https://github.com/mitterlucas/PAINEL-CC.git` (mesma conta usada
pelo `PAINEL 5S NEXT`, ver gotcha de credencial abaixo).

## Decisões de arquitetura (validadas com o usuário, não reabrir sem motivo)

- **Sem login.** O HTML original não tem autenticação — "documento interno"
  é só uma marcação visual. O painel fixo mantém o mesmo comportamento.
- **Sem banco de dados.** Os dados são estáticos, gerados em build-time a
  partir de um `.xlsx` — nada de Postgres/Drizzle/Neon (diferente do
  `PAINEL 5S NEXT`/`PAINEL SVD`).
- **Ingestão via arquivo solto na pasta**, não ETL agendado. O `.xlsx` é
  exportado manualmente do Sankhya e colocado em `data/source/`;
  `scripts/importar-rnc.ts` lê o mais recente e gera `src/data/rnc.json`
  (commitado — não é segredo, é o dado do relatório). O último arquivo usado
  fica em `data/source/` como exemplo de formato de entrada.
- **Formato de dado colunar preservado.** `rnc.json` mantém a mesma forma do
  `DATA` do HTML original (`prods/fams/rncs/rncdesc/ress/meses` + `rows`
  referenciando índices) — evita duplicar texto de produto/motivo em cada uma
  das 1.160+ linhas.
- **Gráficos em SVG feito à mão (React), não Plotly.** O HTML original tem
  visuais bem específicos (donut com tabela acessível embutida, heatmap com
  paleta sequencial própria, barras horizontais genéricas reaproveitadas por
  3 dimensões diferentes) — portar 1:1 a matemática existente é mais fiel e
  mais barato do que reconstruir em Plotly. Diferente do `PAINEL 5S NEXT`.
- **Estado do filtro via `useReducer`** num Client Component único
  (substitui o objeto mutável `st` + `render()` manual do HTML original).
- **Tabelas via TanStack Table**, substituindo o sort manual + corte em 400
  linhas do HTML original.
- **Export CSV** client-side (Blob), igual ao original. **Export PDF**
  continua sendo `window.print()` do navegador (`@media print` em
  `globals.css`) — sem gerar PDF no servidor.

## Gotcha de ambiente (válido nesta máquina)

- **Node fora do PATH** — instalação portátil em
  `C:\Users\Gustavo.Oliveira\AppData\Local\NodeJS\node-v22.14.0-win-x64`.
  Exportar o PATH a cada sessão de shell nova antes de rodar
  `node`/`pnpm`/`npx`/`tsx`.
- **Credencial git de conta diferente.** Este repo é de `mitterlucas` (mesma
  conta do `PAINEL 5S NEXT`), não a conta usada por CMMS/DASHS/PAINEL SVD. Se
  o push falhar com "remote: Repository not found" mesmo o repo existindo,
  trocar a credencial em cache (Credential Manager) antes de tentar de novo.

## Estado

- **Fase 0 (fundação) ✅** — scaffold Next.js 15 App Router + TS strict +
  Tailwind v4/shadcn + `next-themes`, sem banco/auth. Paleta neutra
  provisória (baseColor slate do shadcn) — a paleta real do relatório
  (laranja/azul/verde + heatmap seq-1..6) entra na fase de tema/layout.
- **Fase 1 (ingestão)** — pendente, aguardando o `.xlsx` de exemplo do
  Sankhya.
- Fases seguintes (domínio puro, tema/layout, gráficos, tabelas/filtros,
  verificação, deploy) — ver plano acordado com o usuário na conversa que
  originou este projeto.
