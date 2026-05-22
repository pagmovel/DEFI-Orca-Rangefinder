// Tipos de domínio do screener de pools da Orca (Solana).

export interface Token {
  mint: string;
  symbol: string;
  decimals: number;
}

// Pool da Orca normalizado a partir da API pública.
export interface Pool {
  address: string;
  tokenA: Token;
  tokenB: Token;
  tvlUsd: number;
  price: number; // preço de tokenB por tokenA
  tickCurrentIndex: number;
  tickSpacing: number;
  feeRate: number; // fração decimal da taxa, ex.: 0.0004 = 0,04%
  volume24hUsd: number;
  volume7dUsd: number;
  fees24hUsd: number;
  yieldOverTvl24h: number; // rendimento diário instantâneo (fração)
  priceHistory7d: number[]; // ~7 pontos diários
}

export type RangePresetId = "conservative" | "balanced" | "aggressive";

// Preset de largura de range: k = múltiplos de desvio-padrão cobertos.
export interface RangePreset {
  id: RangePresetId;
  label: string;
  k: number;
}

export interface RangeRecommendation {
  preset: RangePresetId;
  lowerPrice: number;
  upperPrice: number;
  lowerTick: number;
  upperTick: number;
  widthPct: number; // largura total relativa ao preço atual
  capitalEfficiency: number; // ganho de eficiência vs. range completo
  inRangeProbability: number; // P(preço permanecer no range no horizonte)
}

// Série de preços usada para estimar volatilidade.
export interface PriceSeries {
  prices: number[];
  periodsPerDay: number; // 1 = diário, 24 = horário
}

export interface Opportunity {
  pool: Pool;
  volatilityDaily: number; // σ dos log-retornos diários
  baselineAprPct: number; // APR de fee sem concentração
  concentratedAprPct: number; // APR usando o range "balanced"
  ranges: RangeRecommendation[];
  score: number;
}
