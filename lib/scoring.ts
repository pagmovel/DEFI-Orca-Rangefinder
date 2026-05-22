// Fator de estabilidade [0,1]: favorece volume consistente e penaliza
// picos de 24h insustentáveis. 1 = volume estável ou em queda recente;
// <1 = volume de 24h acima da média de 7 dias.
export function stabilityFactor(
  volume24hUsd: number,
  volume7dUsd: number,
): number {
  if (volume24hUsd <= 0) return 0;
  const avg7d = volume7dUsd / 7;
  return Math.min(1, avg7d / volume24hUsd);
}

export interface ScoreInput {
  concentratedAprPct: number;
  volume24hUsd: number;
  volume7dUsd: number;
}

// Score = APR concentrado ponderado pela estabilidade do volume.
// A volatilidade já é penalizada no APR concentrado (range mais largo →
// menor eficiência de capital), então não entra de novo aqui.
export function opportunityScore(input: ScoreInput): number {
  return (
    input.concentratedAprPct *
    stabilityFactor(input.volume24hUsd, input.volume7dUsd)
  );
}

// Ordena por score decrescente sem mutar a entrada.
export function rankOpportunities<T extends { score: number }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => b.score - a.score);
}
