// Formatadores de exibição em pt-BR. Glue de apresentação — usa Intl.

const DASH = "—";

function nf(opts: Intl.NumberFormatOptions): Intl.NumberFormat {
  return new Intl.NumberFormat("pt-BR", opts);
}

// Valor em USD com sufixo k/M.
export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return DASH;
  const abs = Math.abs(value);
  if (abs >= 1_000_000)
    return "$" + nf({ maximumFractionDigits: 2 }).format(value / 1_000_000) + "M";
  if (abs >= 1_000)
    return "$" + nf({ maximumFractionDigits: 1 }).format(value / 1_000) + "k";
  return "$" + nf({ maximumFractionDigits: 0 }).format(value);
}

// Percentual já em escala de pontos (ex.: 42.5 → "42,5%").
export function formatPct(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return DASH;
  return (
    nf({ minimumFractionDigits: digits, maximumFractionDigits: digits }).format(
      value,
    ) + "%"
  );
}

// Preço com precisão adaptada à magnitude.
export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return DASH;
  const digits = value >= 100 ? 2 : value >= 1 ? 4 : 6;
  return nf({
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

// Múltiplo (ex.: eficiência de capital → "12,4×").
export function formatMultiple(value: number): string {
  if (!Number.isFinite(value)) return DASH;
  return nf({ maximumFractionDigits: 1 }).format(value) + "×";
}
