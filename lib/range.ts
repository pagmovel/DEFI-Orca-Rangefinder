import type { RangePreset, RangeRecommendation } from "./types";
import { HORIZON_DAYS } from "./config";

const TICK_BASE = 1.0001;

// Índice de tick correspondente a um preço: log_1.0001(price).
export function priceToTick(price: number): number {
  return Math.log(price) / Math.log(TICK_BASE);
}

export function tickToPrice(tick: number): number {
  return TICK_BASE ** tick;
}

// Arredonda um tick para o múltiplo mais próximo do tickSpacing do pool.
export function snapToSpacing(tick: number, spacing: number): number {
  return Math.round(tick / spacing) * spacing;
}

// erf via aproximação de Abramowitz & Stegun 7.1.26 (erro < 1.5e-7).
function erf(x: number): number {
  const sign = Math.sign(x);
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t -
      0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

// CDF da normal padrão.
export function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

// P(log-preço permanecer dentro de ±k·σ√t) ≈ 2·Φ(k) − 1.
export function inRangeProbability(k: number): number {
  return 2 * normalCdf(k) - 1;
}

// Ganho de eficiência de capital de uma posição [Pa,Pb] vs. range completo.
// Derivação Uniswap-v3: E = 1 / (1 − (Pa/Pb)^(1/4)).
export function capitalEfficiency(
  lowerPrice: number,
  upperPrice: number,
): number {
  return 1 / (1 - (lowerPrice / upperPrice) ** 0.25);
}

export interface RecommendRangeParams {
  price: number;
  sigmaDaily: number;
  preset: RangePreset;
  tickSpacing: number;
  horizonDays?: number;
}

// Range recomendado: bordas em P·e^(±k·σ·√t), encaixadas no tickSpacing.
export function recommendRange(
  params: RecommendRangeParams,
): RangeRecommendation {
  const { price, sigmaDaily, preset, tickSpacing } = params;
  const horizon = params.horizonDays ?? HORIZON_DAYS;

  const delta = preset.k * sigmaDaily * Math.sqrt(horizon);
  const lowerTick = snapToSpacing(
    priceToTick(price * Math.exp(-delta)),
    tickSpacing,
  );
  let upperTick = snapToSpacing(
    priceToTick(price * Math.exp(delta)),
    tickSpacing,
  );
  // Garante largura mínima de um tickSpacing (evita range degenerado).
  if (upperTick <= lowerTick) {
    upperTick = lowerTick + tickSpacing;
  }

  const lowerPrice = tickToPrice(lowerTick);
  const upperPrice = tickToPrice(upperTick);

  return {
    preset: preset.id,
    lowerPrice,
    upperPrice,
    lowerTick,
    upperTick,
    widthPct: (upperPrice - lowerPrice) / price,
    capitalEfficiency: capitalEfficiency(lowerPrice, upperPrice),
    inRangeProbability: inRangeProbability(preset.k),
  };
}
