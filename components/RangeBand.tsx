import { formatPrice } from "@/lib/format";

type Accent = "aqua" | "amber";

const ACCENT: Record<Accent, { band: string; edge: string; text: string }> = {
  aqua: {
    band: "bg-aqua/15",
    edge: "bg-aqua",
    text: "text-aqua",
  },
  amber: {
    band: "bg-amber/15",
    edge: "bg-amber",
    text: "text-amber",
  },
};

interface RangeBandProps {
  domainMin: number;
  domainMax: number;
  currentPrice: number;
  lowerPrice: number;
  upperPrice: number;
  observedLow?: number;
  observedHigh?: number;
  accent?: Accent;
}

// Régua de preço horizontal: faixa recomendada, preço atual e a
// amplitude de preço observada nos últimos 7 dias.
export function RangeBand({
  domainMin,
  domainMax,
  currentPrice,
  lowerPrice,
  upperPrice,
  observedLow,
  observedHigh,
  accent = "aqua",
}: RangeBandProps) {
  const span = domainMax - domainMin || 1;
  const pct = (v: number) =>
    Math.min(100, Math.max(0, ((v - domainMin) / span) * 100));

  const lo = pct(lowerPrice);
  const hi = pct(upperPrice);
  const cur = pct(currentPrice);
  const c = ACCENT[accent];
  const hasObserved =
    observedLow !== undefined && observedHigh !== undefined;

  return (
    <div className="w-full">
      <div className="relative h-10">
        {/* Amplitude observada nos últimos 7 dias. */}
        {hasObserved && (
          <div
            className="absolute top-0 flex h-3.5 items-start justify-center border-x border-t border-dashed border-ink-faint/70"
            style={{
              left: `${pct(observedLow)}%`,
              width: `${pct(observedHigh) - pct(observedLow)}%`,
            }}
          >
            <span className="tag -translate-y-3.5 text-[8px]">7d</span>
          </div>
        )}

        {/* Trilho. */}
        <div className="absolute inset-x-0 bottom-2.5 h-3 border border-line bg-surface-2">
          {/* Faixa recomendada. */}
          <div
            className={`absolute inset-y-0 ${c.band}`}
            style={{ left: `${lo}%`, width: `${Math.max(hi - lo, 0.6)}%` }}
          >
            <span className={`absolute inset-y-0 left-0 w-0.5 ${c.edge}`} />
            <span className={`absolute inset-y-0 right-0 w-0.5 ${c.edge}`} />
          </div>

          {/* Marcador do preço atual. */}
          <div
            className="absolute -top-1.5 -bottom-1.5 w-px bg-ink"
            style={{ left: `${cur}%` }}
          >
            <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-ink" />
          </div>
        </div>
      </div>

      <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-faint">
        <span>{formatPrice(domainMin)}</span>
        <span className={c.text}>
          {formatPrice(lowerPrice)} – {formatPrice(upperPrice)}
        </span>
        <span>{formatPrice(domainMax)}</span>
      </div>
    </div>
  );
}
