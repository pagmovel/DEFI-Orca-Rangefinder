---
name: orca-screener
description: Use ao desenvolver qualquer feature no projeto Rangefinder (screener de pools de liquidez da Orca/Solana, em d:/docker/DEFI). Cobre arquitetura, fluxo de dados, fórmulas de volatilidade/range/score, fontes de dados externas e convenções do código.
---

# Rangefinder — Screener de pools Orca

App Next.js de análise (somente leitura) que encontra oportunidades em pools de
liquidez concentrada da Orca (Solana) e recomenda o range de preço ideal: o que
rende o máximo de fees sem o preço sair da faixa por ao menos 1 semana.

## Arquitetura e fluxo de dados

Pipeline central, todo em `lib/` (puro, sem React, coberto por testes):

```
fetchOrcaPools()  →  screenPools()  →  Opportunity[]
                       ├─ filtra TVL ≥ MIN_TVL_USD
                       ├─ buildOpportunity() por pool:
                       │    dailyVolatility → recommendRange (3 presets)
                       │    → baselineApr × eficiência → score
                       └─ rankOpportunities() (score desc)
```

- `app/` e `components/` são a UI. Páginas são **RSC** e fazem todo o fetch
  server-side (sem CORS). Componentes interativos são `"use client"`
  (`Screener`, `Filters`, `ScreenerTable`).
- `app/page.tsx` — dashboard: `fetchOrcaPools` + `screenPools`, σ via
  `priceHistory7d`.
- `app/pool/[address]/page.tsx` — detalhe: busca OHLCV horário da GeckoTerminal
  (σ melhor); cai para `priceHistory7d` se falhar.

## Fontes de dados

| Fonte | Endpoint | Uso |
|---|---|---|
| Orca API | `api.orca.so/v2/solana/pools` (cursor `limit`/`after`) | lista de pools — sem chave, CORS aberto |
| GeckoTerminal | `.../networks/solana/pools/{addr}/ohlcv/hour` | OHLCV horário p/ σ — sem chave, **30/min**, só server-side |

Por isso a GeckoTerminal é chamada **só na página de detalhe** (1 pool por vez):
chamá-la para todos os pools estouraria o limite de 30/min. O screener usa o
`priceHistory7d` que já vem de graça na resposta da Orca.

## Modelo matemático

Posição de liquidez concentrada (estilo Uniswap v3 / Whirlpool):

- **Volatilidade** (`lib/volatility.ts`): σ = desvio-padrão amostral dos
  log-retornos; reescalado de sub-diário para diário por `√(periodsPerDay)`.
- **Range recomendado** (`lib/range.ts`): preço modelado como log-normal.
  Bordas em `P·e^(±k·σ·√t)`, com `t = HORIZON_DAYS`. Encaixadas no `tickSpacing`
  do pool (`tick = log_1.0001(preço)`).
- **Probabilidade de permanência**: `2·Φ(k) − 1`. Presets: k=1,96 (~95%),
  k=1,28 (~80%), k=1,0 (~68%).
- **Eficiência de capital**: `E = 1 / (1 − (Pa/Pb)^¼)` (derivada para a posição
  centrada na média geométrica do range).
- **APR concentrado** = APR base (`yieldOverTvl24h × 365`) × eficiência.
- **Score** (`lib/scoring.ts`) = APR concentrado × fator de estabilidade do
  volume. A volatilidade não entra de novo no score: já é penalizada via APR
  concentrado (σ alto → range largo → menor eficiência).

## Convenções

- **TDD** nos módulos de matemática (`volatility`, `range`, `scoring`) e em
  `orca`/`geckoterminal`/`analyze`: teste primeiro, ver falhar, implementar.
  Funções de rede não são testadas; as funções puras de transformação, sim.
- `lib/` nunca importa React. UI nunca contém regra de negócio.
- Tudo em **pt-BR** (UI, comentários, commits, docs). Identificadores em inglês.
- Tema "terminal-quant" (dark charcoal, acento aqua, dados em mono); tokens em
  `app/globals.css` via `@theme` do Tailwind v4.
- Parâmetros do produto centralizados em `lib/config.ts`.
- Documentação de progresso em `docs/PROGRESS.md` (fases/tarefas) — atualizar ao
  concluir cada tarefa.

## Armadilhas

- `feeRate` da Orca vem em **millionésimos** (400 = 0,04%) — `mapOrcaPool`
  divide por 1.000.000.
- `priceHistory7d` tem ~7 pontos diários → σ ruidoso; por isso o detalhe usa
  OHLCV horário.
- `buildOpportunity` **lança erro** com < 3 preços; `screenPools` captura e
  descarta o pool.
- `dailyVolatility` zero (preço constante) geraria range degenerado;
  `recommendRange` garante largura mínima de um `tickSpacing`.
- TanStack Table não é memoizável pelo React Compiler → `ScreenerTable` usa
  `"use no memo"`.
