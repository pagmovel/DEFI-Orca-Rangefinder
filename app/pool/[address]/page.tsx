import { fetchOrcaPools } from "@/lib/orca";
import { fetchGeckoOhlcv } from "@/lib/geckoterminal";
import { buildOpportunity } from "@/lib/analyze";
import { RANGE_PRESETS, HORIZON_DAYS } from "@/lib/config";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RangeBand } from "@/components/RangeBand";
import {
  formatUsd,
  formatPct,
  formatPrice,
  formatMultiple,
} from "@/lib/format";
import type { PriceSeries, RangePresetId } from "@/lib/types";

export const revalidate = 300;

const ACCENT: Record<RangePresetId, "aqua" | "amber"> = {
  conservative: "aqua",
  balanced: "aqua",
  aggressive: "amber",
};

function Notice({ title, detail }: { title: string; detail: string }) {
  return (
    <>
      <SiteHeader backHref="/" />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-16 sm:px-8">
        <div className="border border-line bg-surface px-6 py-16 text-center">
          <p className="font-mono text-[12px] tracking-[0.14em] text-coral">
            {title}
          </p>
          <p className="mt-2 text-[13px] text-ink-dim">{detail}</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export default async function PoolPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;

  let pools;
  try {
    pools = await fetchOrcaPools();
  } catch {
    return (
      <Notice
        title="FALHA AO CARREGAR · API ORCA"
        detail="A API da Orca pode estar indisponível. Tente novamente em instantes."
      />
    );
  }

  const pool = pools.find((p) => p.address === address);
  if (!pool) {
    return (
      <Notice
        title="POOL NÃO ENCONTRADO"
        detail="Este pool não está na lista atual da Orca."
      />
    );
  }

  // OHLCV horário é melhor para estimar σ; cai para o histórico diário.
  const closes = await fetchGeckoOhlcv(address);
  const useHourly = closes.length >= 3;
  const series: PriceSeries = useHourly
    ? { prices: closes, periodsPerDay: 24 }
    : { prices: pool.priceHistory7d, periodsPerDay: 1 };

  let opp;
  try {
    opp = buildOpportunity(pool, series);
  } catch {
    return (
      <Notice
        title="DADOS DE PREÇO INSUFICIENTES"
        detail="Não há histórico de preço suficiente para estimar a volatilidade deste pool."
      />
    );
  }

  const observedLow = Math.min(...series.prices);
  const observedHigh = Math.max(...series.prices);

  // Domínio comum às três réguas, para comparação visual direta.
  const bounds = [
    observedLow,
    observedHigh,
    pool.price,
    ...opp.ranges.flatMap((r) => [r.lowerPrice, r.upperPrice]),
  ];
  const rawMin = Math.min(...bounds);
  const rawMax = Math.max(...bounds);
  const pad = (rawMax - rawMin) * 0.08 || rawMax * 0.05;
  const domainMin = rawMin - pad;
  const domainMax = rawMax + pad;

  const metrics = [
    { label: "TVL", value: formatUsd(pool.tvlUsd) },
    { label: "Fee tier", value: formatPct(pool.feeRate * 100, 2) },
    { label: "APR base", value: formatPct(opp.baselineAprPct) },
    {
      label: "σ / dia",
      value: formatPct(opp.volatilityDaily * 100),
      accent: opp.volatilityDaily * 100 > 12,
    },
    { label: "Volume 24h", value: formatUsd(pool.volume24hUsd) },
    {
      label: "APR concentrado",
      value: formatPct(opp.concentratedAprPct),
      good: true,
    },
  ];

  return (
    <>
      <SiteHeader backHref="/" />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-8">
        <section className="rise">
          <span className="tag">Análise de pool · Orca Whirlpool</span>
          <h1 className="mt-3 font-mono text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {pool.tokenA.symbol}
            <span className="text-ink-faint">/</span>
            {pool.tokenB.symbol}
          </h1>
          <p className="mt-2 break-all font-mono text-[11px] text-ink-faint">
            {pool.address}
          </p>
        </section>

        <section
          className="rise mt-8 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-6"
          style={{ animationDelay: "0.06s" }}
        >
          {metrics.map((m) => (
            <div key={m.label} className="bg-surface px-4 py-3.5">
              <p className="tag">{m.label}</p>
              <p
                className={`mt-1.5 font-mono text-lg tabular-nums ${
                  m.good ? "text-aqua" : m.accent ? "text-coral" : "text-ink"
                }`}
              >
                {m.value}
              </p>
            </div>
          ))}
        </section>

        <section className="rise mt-10" style={{ animationDelay: "0.12s" }}>
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-ink">
              Ranges recomendados
            </h2>
            <span className="font-mono text-[10px] tracking-[0.14em] text-ink-faint">
              σ VIA {useHourly ? "OHLCV HORÁRIO" : "HISTÓRICO 7D"}
            </span>
          </div>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-dim">
            Faixa em torno do preço atual ({formatPrice(pool.price)}{" "}
            {pool.tokenB.symbol}/{pool.tokenA.symbol}). Quanto mais estreita,
            mais fees por dólar — e maior o risco de o preço sair da faixa
            antes de {HORIZON_DAYS} dias.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {opp.ranges.map((range) => {
              const preset = RANGE_PRESETS.find(
                (p) => p.id === range.preset,
              )!;
              const concentratedApr =
                opp.baselineAprPct * range.capitalEfficiency;
              return (
                <div
                  key={range.preset}
                  className="flex flex-col gap-4 border border-line bg-surface p-5"
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-[15px] font-semibold text-ink">
                      {preset.label}
                    </h3>
                    <span className="font-mono text-[11px] text-ink-dim">
                      ~{formatPct(range.inRangeProbability * 100, 0)} no range
                    </span>
                  </div>

                  <RangeBand
                    domainMin={domainMin}
                    domainMax={domainMax}
                    currentPrice={pool.price}
                    lowerPrice={range.lowerPrice}
                    upperPrice={range.upperPrice}
                    observedLow={observedLow}
                    observedHigh={observedHigh}
                    accent={ACCENT[range.preset]}
                  />

                  <dl className="flex flex-col gap-1.5 border-t border-line pt-3 font-mono text-[12px]">
                    <Row label="Largura" value={`±${formatPct(range.widthPct * 50)}`} />
                    <Row
                      label="Eficiência de capital"
                      value={formatMultiple(range.capitalEfficiency)}
                    />
                    <Row
                      label="APR concentrado"
                      value={formatPct(concentratedApr)}
                      highlight
                    />
                  </dl>

                  <a
                    href={`https://www.orca.so/pools/${pool.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto flex items-center justify-center gap-2 border border-aqua-deep bg-aqua-deep/10 px-4 py-2.5 font-mono text-[11px] tracking-[0.1em] text-aqua transition-colors hover:bg-aqua-deep/25"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    APORTAR NA ORCA
                  </a>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-ink-faint">{label}</dt>
      <dd
        className={`tabular-nums ${
          highlight ? "font-semibold text-aqua" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
