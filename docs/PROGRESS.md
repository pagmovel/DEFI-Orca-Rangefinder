# Progresso — Orca Whirlpool Opportunity Screener

Frontend de análise para encontrar oportunidades em pools de liquidez na Orca (Solana),
com TVL ≥ US$ 100k, e recomendar ranges de preço ideais para permanecer no range por
pelo menos 1 semana maximizando os ganhos de fee.

**Regra:** ao concluir uma tarefa, marcar `[x]` aqui. Pedir autorização antes de cada fase.

---

## Fase 1 — Scaffold

- [x] `create-next-app` (Next.js 16 + TypeScript + Tailwind v4 + ESLint, App Router)
- [x] Instalar deps: `@tanstack/react-table`, `zod`, `vitest`, `@vitejs/plugin-react`, `jsdom`
- [x] Scripts (`test`, `typecheck`, `test:watch`) + `vitest.config.ts`
- [x] Criar `docs/PROGRESS.md`

## Fase 2 — Camada de domínio (`lib/`, TDD) ✅

- [x] `lib/types.ts` — `Pool`, `Opportunity`, `RangeRecommendation`, `RangePreset`
- [x] `lib/config.ts` — `MIN_TVL_USD = 100_000`, `HORIZON_DAYS = 7`, presets `k`
- [x] `lib/orca.ts` — cliente Orca API, paginação, validação Zod
- [x] `lib/geckoterminal.ts` — OHLCV (server-side)
- [x] `lib/volatility.ts` — σ por log-retornos + testes
- [x] `lib/range.ts` — preço↔tick, `recommendRange`, eficiência de capital + testes
- [x] `lib/scoring.ts` — score de oportunidade + ranking + testes
- [x] `lib/analyze.ts` — orquestra `Pool → Opportunity` (35 testes, typecheck limpo)

## Fase 3 — UI ✅

- [x] Tema terminal-quant em `globals.css` (tokens, grão, atmosfera) + fontes
      Archivo / IBM Plex Mono
- [x] `lib/format.ts` — formatadores pt-BR (USD, %, preço, múltiplo)
- [x] `app/page.tsx` — dashboard RSC (busca Orca + `screenPools`, σ via `priceHistory7d`)
- [x] `components/Screener.tsx` + `Filters.tsx` — filtros (par/TVL/APR/preset)
- [x] `components/ScreenerTable.tsx` — tabela ordenável (TanStack Table)
- [x] `app/pool/[address]/page.tsx` — detalhe RSC (OHLCV horário GeckoTerminal p/ σ)
- [x] `components/RangeBand.tsx` — régua do range vs. preço atual + amplitude 7d
- [x] `components/SiteHeader.tsx` / `SiteFooter.tsx`
- [x] Build de produção, typecheck e lint limpos

> Ajustes: filtros usam estado client (`useState`), não URL — evita o boundary de
> Suspense do `useSearchParams`. Sem rota proxy `app/api/ohlcv`: todo fetch é
> server-side (RSC), sem CORS. O screener estima σ pelo `priceHistory7d` da resposta
> da Orca (0 chamadas extras, respeita o limite de 30/min da GeckoTerminal); a
> GeckoTerminal só é chamada na página de detalhe, 1 pool por vez.

## Fase 4 — Documentação

- [x] `CLAUDE.md` enxuto (pt-BR) — importa `@AGENTS.md` (aviso do Next 16)
- [x] Skill do projeto `.claude/skills/orca-screener/SKILL.md` (arquitetura, fórmulas,
      fontes de dados, convenções, armadilhas)
- [x] Atualização do `docs/PROGRESS.md`

## Fase 5 — Verificação ✅

- [x] `npm test` — 35 testes passam (volatilidade, range, scoring, orca, geckoterminal, analyze)
- [x] `npm run typecheck` limpo
- [x] `npm run lint` limpo
- [x] `npm run build` — build de produção OK
- [x] `npm run dev` — smoke test: home 200 (113 pools, links reais), detalhe 200
      (3 cards de preset), sem erros no log do servidor

---

**Projeto concluído.** Todas as 5 fases entregues. Próximos passos possíveis:
testes de componente da UI, persistência de filtros na URL, camada opcional de
comentário qualitativo.
