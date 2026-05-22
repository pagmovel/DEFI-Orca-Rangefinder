import { describe, it, expect } from "vitest";
import { buildOpportunity, screenPools } from "./analyze";
import { dailyVolatility } from "./volatility";
import type { Pool, PriceSeries } from "./types";

function makePool(overrides: Partial<Pool> = {}): Pool {
  return {
    address: "P1",
    tokenA: { mint: "A", symbol: "SOL", decimals: 9 },
    tokenB: { mint: "B", symbol: "USDC", decimals: 6 },
    tvlUsd: 200_000,
    price: 103,
    tickCurrentIndex: 0,
    tickSpacing: 64,
    feeRate: 0.0004,
    volume24hUsd: 100_000,
    volume7dUsd: 700_000,
    fees24hUsd: 40,
    yieldOverTvl24h: 0.001,
    priceHistory7d: [100, 102, 101, 103, 102, 104, 103],
    ...overrides,
  };
}

const dailySeries = (pool: Pool): PriceSeries => ({
  prices: pool.priceHistory7d,
  periodsPerDay: 1,
});

describe("buildOpportunity", () => {
  it("computes APRs, three ranges, and a score", () => {
    const pool = makePool();
    const opp = buildOpportunity(pool, dailySeries(pool));
    expect(opp.ranges).toHaveLength(3);
    expect(opp.baselineAprPct).toBeCloseTo(36.5, 6);
    expect(opp.concentratedAprPct).toBeGreaterThan(opp.baselineAprPct);
    expect(opp.score).toBeGreaterThan(0);
  });

  it("throws when the price series is too short for volatility", () => {
    const pool = makePool();
    expect(() =>
      buildOpportunity(pool, { prices: [100, 101], periodsPerDay: 1 }),
    ).toThrow();
  });
});

describe("screenPools", () => {
  it("excludes pools below the minimum TVL", () => {
    const result = screenPools([
      makePool({ address: "low", tvlUsd: 50_000 }),
      makePool({ address: "high", tvlUsd: 200_000 }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].pool.address).toBe("high");
  });

  it("skips pools without enough price history instead of throwing", () => {
    const result = screenPools([
      makePool({ address: "nodata", priceHistory7d: [100, 101] }),
    ]);
    expect(result).toHaveLength(0);
  });

  it("ranks opportunities by score descending", () => {
    const result = screenPools([
      makePool({ address: "a", yieldOverTvl24h: 0.001 }),
      makePool({ address: "b", yieldOverTvl24h: 0.005 }),
    ]);
    expect(result.map((o) => o.pool.address)).toEqual(["b", "a"]);
  });

  it("uses an injected price series when provided", () => {
    const pool = makePool();
    const override: PriceSeries = {
      prices: [100, 100.1, 100, 100.1, 100],
      periodsPerDay: 24,
    };
    const result = screenPools([pool], { [pool.address]: override });
    expect(result[0].volatilityDaily).toBeCloseTo(
      dailyVolatility(override),
      10,
    );
  });
});
