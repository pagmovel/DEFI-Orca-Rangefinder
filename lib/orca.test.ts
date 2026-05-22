import { describe, it, expect } from "vitest";
import { mapOrcaPool } from "./orca";

const rawPool = {
  address: "POOL_ADDR",
  tvlUsdc: "150000",
  price: "1.5",
  tickCurrentIndex: 100,
  tickSpacing: 64,
  feeRate: 400,
  tokenMintA: "MINT_A",
  tokenMintB: "MINT_B",
  tokenA: { symbol: "SOL", decimals: 9 },
  tokenB: { symbol: "USDC", decimals: 6 },
  stats: {
    "24h": { volume: "200000", fees: "80", yieldOverTvl: "0.0005" },
    "7d": { volume: "1400000", fees: "560", yieldOverTvl: "0.0035" },
  },
  priceHistory7d: [1.4, 1.45, 1.5, 1.48, 1.52, 1.5, 1.5],
};

describe("mapOrcaPool", () => {
  it("normalizes string numerics and maps the API shape", () => {
    const pool = mapOrcaPool(rawPool);
    expect(pool.tvlUsd).toBe(150000);
    expect(pool.price).toBe(1.5);
    expect(pool.tokenA.symbol).toBe("SOL");
    expect(pool.tokenB.symbol).toBe("USDC");
    expect(pool.volume24hUsd).toBe(200000);
    expect(pool.volume7dUsd).toBe(1400000);
    expect(pool.yieldOverTvl24h).toBe(0.0005);
    expect(pool.priceHistory7d).toHaveLength(7);
  });

  it("converts feeRate (millionths) to a decimal fraction", () => {
    expect(mapOrcaPool(rawPool).feeRate).toBeCloseTo(0.0004, 10);
  });

  it("throws on a payload missing required fields", () => {
    expect(() => mapOrcaPool({ address: "x" })).toThrow();
  });
});
