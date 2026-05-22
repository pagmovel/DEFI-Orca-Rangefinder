<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white) ![Solana](https://img.shields.io/badge/Solana-Mainnet-9945ff?style=flat-square&logo=solana&logoColor=white) ![Orca](https://img.shields.io/badge/Orca-Whirlpool-00c2a3?style=flat-square) ![Tests](https://img.shields.io/badge/testes-35%20passando-22c55e?style=flat-square) ![License](https://img.shields.io/badge/licença-MIT-gray?style=flat-square)

# DEFI - ORCA Rangefinder

**Screener de oportunidades em pools de liquidez concentrada da Orca (Solana)**

Encontra os melhores pools com TVL ≥ US$ 100k e recomenda o range de preço ideal para
maximizar fees sem sair da faixa por pelo menos 1 semana.

</div>

---

## Visão geral

Rangefinder é um dashboard de análise **somente leitura** — sem carteira, sem transações.
Ele consome a API pública da Orca, filtra pools relevantes e aplica um modelo log-normal
para recomendar ranges de liquidez concentrada com diferentes perfis de risco:

| Preset      | k    | Prob. no range |
| ----------- | ---- | -------------- |
| Conservador | 1,96 | ~95 %          |
| Balanceado  | 1,28 | ~80 %          |
| Agressivo   | 1,00 | ~68 %          |

A página de detalhe de cada pool exibe os três ranges com régua visual, eficiência de capital
e APR concentrado estimado, além de um botão direto para aportar na Orca.

## Stack

- **Next.js 16** (App Router, RSC) — fetch server-side, sem CORS
- **TypeScript 5** + Zod — validação de payload das APIs externas
- **Tailwind CSS v4** — tema terminal-quant (dark charcoal + acento aqua)
- **TanStack Table** — tabela ordenável com hints nas colunas
- **Vitest** — 35 testes unitários (volatilidade, range, scoring, orca, geckoterminal, analyze)
- Fontes: **Archivo** (display) + **IBM Plex Mono** (dados)

## Fontes de dados

| Fonte                                      | Uso                                                 | Limite                                   |
| ------------------------------------------ | --------------------------------------------------- | ---------------------------------------- |
| `api.orca.so/v2/solana/pools`            | Lista de pools, preços, TVL, volume, histórico 7d | Sem chave, CORS aberto                   |
| `api.geckoterminal.com` (OHLCV horário) | Volatilidade melhor na página de detalhe           | Sem chave, 30 req/min — só server-side |

## Modelo matemático

```
σ = std(log-retornos) × √(periodsPerDay)          # volatilidade diária

Pa = P · e^(−k · σ · √t)                          # borda inferior do range
Pb = P · e^(+k · σ · √t)                          # borda superior

P(no range) = 2·Φ(k) − 1                          # probabilidade de permanência (t = 7 dias)

E = 1 / (1 − (Pa/Pb)^¼)                           # eficiência de capital
APR concentrado = APR base × E

Score = APR concentrado × min(1, vol7d/7 / vol24h) # penaliza picos isolados de volume
```

## Comandos

```bash
npm run dev          # servidor de desenvolvimento (Turbopack)
npm run build        # build de produção
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # 35 testes Vitest
npm run test:watch   # Vitest em watch mode

npx vitest run lib/range.test.ts      # arquivo específico
npx vitest run -t "trecho do nome"    # teste específico
```

## Estrutura

```
app/
  page.tsx                  # dashboard RSC — lista de pools + screener
  pool/[address]/page.tsx   # detalhe RSC — ranges + RangeBand + link Orca
  globals.css               # tokens de design (Tailwind v4 @theme)
  layout.tsx                # fontes, lang="pt-BR"

components/
  Screener.tsx              # wrapper client (filtragem, buildRow)
  Filters.tsx               # filtros: par, TVL, APR, preset
  ScreenerTable.tsx         # TanStack Table com hints nas colunas
  RangeBand.tsx             # régua SVG/CSS do range vs. preço atual
  SiteHeader.tsx / SiteFooter.tsx

lib/
  types.ts                  # Pool, Opportunity, RangeRecommendation, PriceSeries
  config.ts                 # MIN_TVL_USD, HORIZON_DAYS, RANGE_PRESETS
  orca.ts                   # cliente Orca API (paginação, Zod, mapOrcaPool)
  geckoterminal.ts          # OHLCV horário (server-side, graceful fallback)
  volatility.ts             # dailyVolatility — log-retornos + √(periodsPerDay)
  range.ts                  # priceToTick, recommendRange, capitalEfficiency
  scoring.ts                # stabilityFactor, opportunityScore, rankOpportunities
  analyze.ts                # buildOpportunity, screenPools
  format.ts                 # formatadores pt-BR (USD, %, preço, múltiplo)
```

## Desenvolvimento

Requer Node.js ≥ 18. Clone, instale e inicie:

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. O primeiro carregamento pode levar alguns segundos
enquanto a API da Orca é paginada (~100+ pools).

---

<div align="center">
  <sub>Análise somente leitura · Sem carteira · Sem transações · Dados ao vivo da Orca / GeckoTerminal</sub>
</div>
