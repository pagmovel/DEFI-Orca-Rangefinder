import { describe, it, expect } from "vitest";
import { extractCloses } from "./geckoterminal";

describe("extractCloses", () => {
  it("pulls close prices in chronological order", () => {
    const raw = {
      data: {
        attributes: {
          ohlcv_list: [
            [2000, 1.5, 3, 1, 2.5, 200],
            [1000, 1, 2, 0.5, 1.5, 100],
          ],
        },
      },
    };
    expect(extractCloses(raw)).toEqual([1.5, 2.5]);
  });

  it("returns an empty array for a malformed payload", () => {
    expect(extractCloses({})).toEqual([]);
    expect(extractCloses(null)).toEqual([]);
  });
});
