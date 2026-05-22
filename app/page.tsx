import { fetchOrcaPools } from "@/lib/orca";
import { screenPools } from "@/lib/analyze";
import { SiteHeader } from "@/components/SiteHeader";
import { Screener } from "@/components/Screener";
import { SiteFooter } from "@/components/SiteFooter";
import { formatUsd, formatPct } from "@/lib/format";
import { HORIZON_DAYS, MIN_TVL_USD } from "@/lib/config";
import type { Opportunity } from "@/lib/types";

export const revalidate = 300;

export default async function Home() {
  let opportunities: Opportunity[] = [];
  let error: string | null = null;

  try {
    opportunities = screenPools(await fetchOrcaPools());
  } catch (e) {
    error = e instanceof Error ? e.message : "Falha ao carregar dados da Orca";
  }

  const totalTvl = opportunities.reduce((s, o) => s + o.pool.tvlUsd, 0);
  const bestApr = opportunities.reduce(
    (m, o) => Math.max(m, o.concentratedAprPct),
    0,
  );

  const stats = [
    { label: "Pools elegíveis", value: String(opportunities.length) },
    { label: "Melhor APR concentrado", value: formatPct(bestApr), accent: true },
    { label: "TVL analisado", value: formatUsd(totalTvl) },
    { label: "Horizonte do range", value: `${HORIZON_DAYS} dias` },
  ];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-10 sm:px-8">
        <section className="rise mb-10">
          <span className="tag">Screener de liquidez concentrada · Orca</span>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Pools que pagam.
            <br />
            Ranges que <span className="text-aqua">aguentam</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
            Encontra oportunidades em pools da Orca (Solana) com TVL ≥{" "}
            {formatUsd(MIN_TVL_USD)} e calcula o range ideal — o que rende o
            máximo de fees sem o preço sair da faixa por ao menos{" "}
            {HORIZON_DAYS} dias.
          </p>
        </section>

        <section
          className="rise mb-10 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4"
          style={{ animationDelay: "0.08s" }}
        >
          {stats.map((s) => (
            <div key={s.label} className="bg-surface px-5 py-4">
              <p className="tag">{s.label}</p>
              <p
                className={`mt-2 font-mono text-2xl tabular-nums ${
                  s.accent ? "text-aqua" : "text-ink"
                }`}
              >
                {s.value}
              </p>
            </div>
          ))}
        </section>

        <section className="rise" style={{ animationDelay: "0.16s" }}>
          {error ? (
            <div className="border border-coral/40 bg-coral/5 px-6 py-12 text-center">
              <p className="font-mono text-[12px] tracking-[0.14em] text-coral">
                FALHA AO CARREGAR · {error}
              </p>
              <p className="mt-2 text-[13px] text-ink-dim">
                A API da Orca pode estar indisponível. Recarregue em instantes.
              </p>
            </div>
          ) : (
            <Screener opportunities={opportunities} />
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
