import type { PriceSeries } from "./types";

// Log-retornos entre preços consecutivos: ln(p[i] / p[i-1]).
export function logReturns(prices: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    out.push(Math.log(prices[i] / prices[i - 1]));
  }
  return out;
}

// Desvio-padrão amostral (denominador n-1).
export function sampleStddev(values: number[]): number {
  if (values.length < 2) {
    throw new Error("sampleStddev exige ao menos 2 valores");
  }
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// Volatilidade diária: σ dos log-retornos, reescalado de sub-diário para
// diário por √(periodsPerDay) (variância cresce linear com o tempo).
export function dailyVolatility(series: PriceSeries): number {
  if (series.prices.length < 3) {
    throw new Error("dailyVolatility exige ao menos 3 preços");
  }
  return (
    sampleStddev(logReturns(series.prices)) * Math.sqrt(series.periodsPerDay)
  );
}
