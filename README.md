# Painel CC — Relatório de Reclamações (RNC)

Reescrita em Next.js do relatório `Relatorio_de_Reclamacoes_RNC_jan_a_ago_2026_Alltak.html`
(arquivo HTML autocontido, sem libs externas) num painel fixo, com o mesmo
conjunto de gráficos e filtros cruzados.

Ver `CLAUDE.md` para arquitetura, decisões e estado do projeto.

## Desenvolvimento

```bash
pnpm install
pnpm dev
```

## Atualizar os dados

Os dados vêm de um `.xlsx` exportado do Sankhya. Para atualizar:

1. Coloque o `.xlsx` novo em `data/source/`.
2. Rode `pnpm importar-rnc` — gera `src/data/rnc.json`.
3. Confira o resultado (`pnpm dev`) e faça o commit do `rnc.json` atualizado.

## Scripts

- `pnpm dev` / `pnpm build` / `pnpm start`
- `pnpm typecheck` / `pnpm lint` / `pnpm test`
- `pnpm importar-rnc` — gera `src/data/rnc.json` a partir do `.xlsx` mais recente em `data/source/`
