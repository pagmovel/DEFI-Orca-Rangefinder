# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Comunicação do projeto em **pt-BR** (chat, commits, docs, UI). Identificadores de
> código permanecem em inglês.

## Projeto

**Rangefinder** — screener de oportunidades em pools de liquidez da Orca (Solana).
Filtra pools com TVL ≥ US$ 100k e recomenda o range de preço ideal para uma posição
de liquidez concentrada render o máximo de fees sem sair da faixa por ≥ 1 semana.
App de análise, somente leitura — sem carteira nem transações.

## Comandos

```bash
npm run dev          # servidor de desenvolvimento (Turbopack)
npm run build        # build de produção (roda TypeScript)
npm start            # serve o build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # Vitest — todos os testes, roda e sai
npm run test:watch   # Vitest em watch

npx vitest run lib/range.test.ts      # um arquivo de teste
npx vitest run -t "trecho do nome"    # um teste específico
```

## Arquitetura

- **`lib/`** — camada de domínio pura, sem React, coberta por testes. Pipeline:
  `fetchOrcaPools` → `screenPools` (filtra TVL, estima volatilidade, calcula ranges
  e score, ordena) → `Opportunity[]`.
- **`app/` + `components/`** — UI Next.js (App Router). Páginas são RSC e fazem todo
  o fetch server-side (sem CORS); componentes interativos são `"use client"`.
- Volatilidade do screener vem do `priceHistory7d` da própria resposta da Orca; a
  página de detalhe busca OHLCV horário da GeckoTerminal para um σ melhor.

Parâmetros do produto ficam em [`lib/config.ts`](lib/config.ts) (`MIN_TVL_USD`,
`HORIZON_DAYS`, presets de range).

## Onde aprofundar

- **Fórmulas, fontes de dados, convenções e armadilhas** → skill `orca-screener`
  (em [`.claude/skills/orca-screener/SKILL.md`](.claude/skills/orca-screener/SKILL.md)).
- **Estado do projeto por fases/tarefas** → [`docs/PROGRESS.md`](docs/PROGRESS.md).
  Ao concluir uma tarefa, marque-a como concluída lá.

@AGENTS.md
