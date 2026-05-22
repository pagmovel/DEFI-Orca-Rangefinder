import { describe, it, expect } from "vitest";
import {
  priceToTick,
  tickToPrice,
  snapToSpacing,
  normalCdf,
  inRangeProbability,
  capitalEfficiency,
  recommendRange,
} from "./range";
import { RANGE_PRESETS } from "./config";

const conservative = RANGE_PRESETS.find((p) => p.id === "conservative")!;
const balanced = RANGE_PRESETS.find((p) => p.id === "balanced")!;
const aggressive = RANGE_PRESETS.find((p) => p.id === "aggressive")!;

describe("tick <-> price", () => {
  it("maps tick 0 to price 1", () => {
    expect(tickToPrice(0)).toBeCloseTo(1, 10);
  });

  it("round-trips price through tick", () => {
    expect(tickToPrice(priceToTick(1.5))).toBeCloseTo(1.5, 6);
  });
});

describe("snapToSpacing", () => {
  it("snaps a tick to the nearest multiple of the spacing", () => {
    expect(snapToSpacing(127, 10)).toBe(130);
    expect(snapToSpacing(124, 10)).toBe(120);
  });
});

describe("normalCdf / inRangeProbability", () => {
  it("normalCdf(0) is 0.5", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
  });

  it("inRangeProbability matches 2*Phi(k)-1 for the presets", () => {
    expect(inRangeProbability(1.96)).toBeCloseTo(0.95, 2);
    expect(inRangeProbability(1.0)).toBeCloseTo(0.68, 2);
  });
});

describe("capitalEfficiency", () => {
  it("is 2x when the price ratio fourth-root is 1/2", () => {
    expect(capitalEfficiency(1, 16)).toBeCloseTo(2, 6);
  });

  it("grows as the range narrows", () => {
    expect(capitalEfficiency(90, 110)).toBeGreaterThan(
      capitalEfficiency(50, 200),
    );
  });
});

describe("recommendRange", () => {
  it("brackets the current price", () => {
    const rec = recommendRange({
      price: 100,
      sigmaDaily: 0.05,
      preset: balanced,
      tickSpacing: 64,
      horizonDays: 7,
    });
    expect(rec.lowerPrice).toBeLessThan(100);
    expect(rec.upperPrice).toBeGreaterThan(100);
    expect(rec.preset).toBe("balanced");
    expect(rec.inRangeProbability).toBeCloseTo(0.8, 2);
  });

  it("makes a wider range for a higher-k preset", () => {
    const base = { price: 100, sigmaDaily: 0.05, tickSpacing: 64, horizonDays: 7 };
    const cons = recommendRange({ ...base, preset: conservative });
    const aggr = recommendRange({ ...base, preset: aggressive });
    expect(cons.widthPct).toBeGreaterThan(aggr.widthPct);
  });

  it("stays valid with zero volatility (minimum one-spacing range)", () => {
    const rec = recommendRange({
      price: 100,
      sigmaDaily: 0,
      preset: balanced,
      tickSpacing: 64,
      horizonDays: 7,
    });
    expect(rec.upperTick).toBeGreaterThan(rec.lowerTick);
    expect(Number.isFinite(rec.capitalEfficiency)).toBe(true);
  });
});
