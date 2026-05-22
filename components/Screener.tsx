"use client";

import { useMemo, useState } from "react";
import type { Opportunity } from "@/lib/types";
import { Filters, type FilterState } from "./Filters";
import { ScreenerTable, buildRow } from "./ScreenerTable";

export function Screener({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    minTvl: 100_000,
    minApr: 0,
    presetId: "balanced",
  });

  const rows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return opportunities
      .filter((o) => {
        if (o.pool.tvlUsd < filters.minTvl) return false;
        if (q) {
          const pair =
            `${o.pool.tokenA.symbol}/${o.pool.tokenB.symbol}`.toLowerCase();
          if (!pair.includes(q)) return false;
        }
        return true;
      })
      .map((o) => buildRow(o, filters.presetId))
      .filter((r) => r.concentratedAprPct >= filters.minApr);
  }, [opportunities, filters]);

  return (
    <div className="flex flex-col gap-4">
      <Filters
        value={filters}
        onChange={setFilters}
        total={opportunities.length}
        shown={rows.length}
      />
      <ScreenerTable rows={rows} />
    </div>
  );
}
