import { describe, it, expect } from "vitest";
import {
  stabilityFactor,
  opportunityScore,
  rankOpportunities,
} from "./scoring";

describe("stabilityFactor", () => {
  it("is 1 when 24h volume equals the 7d daily average", () => {
    expect(stabilityFactor(1000, 7000)).toBeCloseTo(1, 10);
  });

  it("penalizes a 24h volume spike above the 7d average", () => {
    expect(stabilityFactor(2000, 7000)).toBeCloseTo(0.5, 10);
  });

  it("caps at 1 when recent volume slowed below the average", () => {
    expect(stabilityFactor(500, 7000)).toBe(1);
  });

  it("is 0 when there is no recent volume", () => {
    expect(stabilityFactor(0, 7000)).toBe(0);
  });
});

describe("opportunityScore", () => {
  it("is the concentrated APR scaled by the stability factor", () => {
    expect(
      opportunityScore({
        concentratedAprPct: 50,
        volume24hUsd: 1000,
        volume7dUsd: 7000,
      }),
    ).toBeCloseTo(50, 10);
  });

  it("drops when recent volume spiked", () => {
    expect(
      opportunityScore({
        concentratedAprPct: 50,
        volume24hUsd: 2000,
        volume7dUsd: 7000,
      }),
    ).toBeCloseTo(25, 10);
  });
});

describe("rankOpportunities", () => {
  it("sorts by score descending", () => {
    const ranked = rankOpportunities([
      { score: 1 },
      { score: 9 },
      { score: 5 },
    ]);
    expect(ranked.map((r) => r.score)).toEqual([9, 5, 1]);
  });

  it("does not mutate the input array", () => {
    const input = [{ score: 1 }, { score: 9 }];
    rankOpportunities(input);
    expect(input.map((r) => r.score)).toEqual([1, 9]);
  });
});
