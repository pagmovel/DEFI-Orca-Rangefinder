import type { Opportunity, Pool, PriceSeries } from "./types";
import { MIN_TVL_USD, RANGE_PRESETS, DEFAULT_PRESET_ID } from "./config";
import { dailyVolatility } from "./volatility";
import { recommendRange } from "./range";
import { opportunityScore, rankOpportunities } from "./scoring";

// Constrói a oportunidade de um pool a partir de uma série de preços.
// Lança erro se a série for curta demais para estimar volatilidade.
export function buildOpportunity(
  pool: Pool,
  series: PriceSeries,
): Opportunity {
  const volatilityDaily = dailyVolatility(series);

  const ranges = RANGE_PRESETS.map((preset) =>
    recommendRange({
      price: pool.price,
      sigmaDaily: volatilityDaily,
      preset,
      tickSpacing: pool.tickSpacing,
    }),
  );

  const baselineAprPct = pool.yieldOverTvl24h * 365 * 100;
  const balanced =
    ranges.find((r) => r.preset === DEFAULT_PRESET_ID) ?? ranges[0];
  const concentratedAprPct = baselineAprPct * balanced.capitalEfficiency;

  return {
    pool,
    volatilityDaily,
    baselineAprPct,
    concentratedAprPct,
    ranges,
    score: opportunityScore({
      concentratedAprPct,
      volume24hUsd: pool.volume24hUsd,
      volume7dUsd: pool.volume7dUsd,
    }),
  };
}

// Filtra pools por TVL mínimo, monta as oportunidades e ordena por score.
// Pools sem dados de preço suficientes são descartados.
// `seriesByAddress` permite injetar séries melhores (ex.: OHLCV horário);
// na ausência, usa o histórico diário de 7 dias do próprio pool.
export function screenPools(
  pools: Pool[],
  seriesByAddress: Record<string, PriceSeries> = {},
): Opportunity[] {
  const opportunities: Opportunity[] = [];

  for (const pool of pools) {
    if (pool.tvlUsd < MIN_TVL_USD) continue;
    const series: PriceSeries = seriesByAddress[pool.address] ?? {
      prices: pool.priceHistory7d,
      periodsPerDay: 1,
    };
    try {
      opportunities.push(buildOpportunity(pool, series));
    } catch {
      // série de preços insuficiente — descarta o pool
    }
  }

  return rankOpportunities(opportunities);
}
