import { describe, it, expect } from "vitest";
import { logReturns, sampleStddev, dailyVolatility } from "./volatility";

describe("logReturns", () => {
  it("computes natural-log returns between consecutive prices", () => {
    const r = logReturns([100, 110, 121]);
    expect(r).toHaveLength(2);
    expect(r[0]).toBeCloseTo(Math.log(1.1), 10);
    expect(r[1]).toBeCloseTo(Math.log(1.1), 10);
  });

  it("returns zeros for constant prices", () => {
    expect(logReturns([100, 100, 100])).toEqual([0, 0]);
  });
});

describe("sampleStddev", () => {
  it("computes the sample standard deviation (n-1 denominator)", () => {
    expect(sampleStddev([1, 2, 3, 4, 5])).toBeCloseTo(1.5811388, 6);
  });
});

describe("dailyVolatility", () => {
  it("is zero when prices never change", () => {
    expect(
      dailyVolatility({ prices: [100, 100, 100, 100], periodsPerDay: 1 }),
    ).toBe(0);
  });

  it("scales sub-daily volatility by sqrt(periodsPerDay)", () => {
    const prices = [100, 110, 100, 110, 100];
    const daily = dailyVolatility({ prices, periodsPerDay: 1 });
    const hourly = dailyVolatility({ prices, periodsPerDay: 24 });
    expect(daily).toBeCloseTo(0.1100545, 6);
    expect(hourly).toBeCloseTo(daily * Math.sqrt(24), 10);
  });

  it("throws when there are fewer than 3 prices", () => {
    expect(() =>
      dailyVolatility({ prices: [100, 110], periodsPerDay: 1 }),
    ).toThrow();
  });
});
