import type { RangePreset } from "./types";

// TVL mínimo (USD) para um pool ser considerado oportunidade.
export const MIN_TVL_USD = 100_000;

// Horizonte-alvo: a posição deve permanecer no range por ao menos 1 semana.
export const HORIZON_DAYS = 7;

// k = múltiplos de σ·√t cobertos pelo range.
// P(permanecer no range) ≈ 2·Φ(k) − 1: 1,96≈95% · 1,28≈80% · 1,0≈68%.
export const RANGE_PRESETS: RangePreset[] = [
  { id: "conservative", label: "Conservador", k: 1.96 },
  { id: "balanced", label: "Balanceado", k: 1.28 },
  { id: "aggressive", label: "Agressivo", k: 1.0 },
];

// Preset usado para o APR concentrado em destaque e para o score.
export const DEFAULT_PRESET_ID = "balanced" as const;
