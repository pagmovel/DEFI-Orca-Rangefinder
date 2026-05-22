"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import type { Opportunity, RangePresetId } from "@/lib/types";
import { formatUsd, formatPct, formatMultiple } from "@/lib/format";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    hint?: string;
  }
}

export interface ScreenerRow {
  address: string;
  tokenA: string;
  tokenB: string;
  tvlUsd: number;
  feeRatePct: number;
  baselineAprPct: number;
  volatilityPct: number;
  rangeWidthPct: number;
  concentratedAprPct: number;
  score: number;
}

// Achata uma oportunidade para a linha da tabela conforme o preset ativo.
export function buildRow(
  opp: Opportunity,
  presetId: RangePresetId,
): ScreenerRow {
  const range = opp.ranges.find((r) => r.preset === presetId) ?? opp.ranges[0];
  return {
    address: opp.pool.address,
    tokenA: opp.pool.tokenA.symbol,
    tokenB: opp.pool.tokenB.symbol,
    tvlUsd: opp.pool.tvlUsd,
    feeRatePct: opp.pool.feeRate * 100,
    baselineAprPct: opp.baselineAprPct,
    volatilityPct: opp.volatilityDaily * 100,
    rangeWidthPct: range.widthPct * 100,
    concentratedAprPct: opp.baselineAprPct * range.capitalEfficiency,
    score: opp.score,
  };
}

const col = createColumnHelper<ScreenerRow>();

function ColHint({ hint }: { hint: string }) {
  return (
    <span
      className="group/hint relative inline-flex"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="cursor-help select-none text-[9px] text-ink-faint opacity-50 transition-opacity hover:opacity-100">
        ⓘ
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-52 -translate-x-1/2 border border-line bg-surface-2 px-2.5 py-2 font-mono text-[10px] leading-relaxed text-ink-dim opacity-0 transition-opacity group-hover/hint:opacity-100">
        {hint}
      </span>
    </span>
  );
}

const columns = [
  col.accessor((r) => `${r.tokenA}/${r.tokenB}`, {
    id: "pair",
    header: "Par",
    meta: { hint: "Par de tokens. Clique na linha para ver a análise completa do pool." },
    cell: (c) => (
      <Link
        href={`/pool/${c.row.original.address}`}
        className="font-mono text-[13px] font-medium text-ink underline-offset-4 hover:text-aqua hover:underline"
      >
        {c.row.original.tokenA}
        <span className="text-ink-faint">/</span>
        {c.row.original.tokenB}
      </Link>
    ),
  }),
  col.accessor("tvlUsd", {
    header: "TVL",
    meta: { hint: "Total Value Locked — liquidez total depositada no pool, em USD." },
    cell: (c) => formatUsd(c.getValue()),
  }),
  col.accessor("feeRatePct", {
    header: "Fee",
    meta: { hint: "Taxa cobrada por cada swap. Vai integralmente para os provedores de liquidez." },
    cell: (c) => formatPct(c.getValue(), 2),
  }),
  col.accessor("baselineAprPct", {
    header: "APR base",
    meta: { hint: "Retorno anualizado sem concentração: yieldOverTvl24h × 365. Equivale a fornecer liquidez em toda a curva." },
    cell: (c) => formatPct(c.getValue()),
  }),
  col.accessor("volatilityPct", {
    header: "σ / dia",
    meta: { hint: "Volatilidade diária — desvio-padrão dos log-retornos. Alta volatilidade exige ranges mais largos, reduzindo a eficiência de capital. Acima de 12 % é destacado em coral." },
    cell: (c) => (
      <span className={c.getValue() > 12 ? "text-coral" : "text-ink-dim"}>
        {formatPct(c.getValue())}
      </span>
    ),
  }),
  col.accessor("rangeWidthPct", {
    header: "Largura range",
    meta: { hint: "Amplitude total do range recomendado (preset ativo) em torno do preço atual. Exibida como ± metade da largura total." },
    cell: (c) => {
      const v = c.getValue();
      return (
        <div className="flex items-center justify-end gap-2">
          <span className="h-1 w-14 bg-surface-2">
            {/* stylelint-disable-next-line */}
            <span
              className="block h-full bg-aqua-deep"
              style={{ width: `${Math.min(100, (v / 80) * 100)}%` }}
            />
          </span>
          <span className="w-14 text-right">±{formatPct(v / 2)}</span>
        </div>
      );
    },
  }),
  col.accessor("concentratedAprPct", {
    header: "APR concentrado",
    meta: { hint: "APR base × eficiência de capital do range ativo. Quanto mais estreito o range, maior a alavancagem de fees — e maior o risco de sair da faixa." },
    cell: (c) => (
      <span className="font-semibold text-aqua">
        {formatPct(c.getValue())}
      </span>
    ),
  }),
  col.accessor("score", {
    header: "Score",
    meta: { hint: "APR concentrado × estabilidade do volume. Penaliza pools cujo volume 24 h desvia muito da média dos últimos 7 dias — favorece consistência sobre picos isolados." },
    cell: (c) => (
      <span className="font-semibold text-ink">
        {formatMultiple(c.getValue()).replace("×", "")}
      </span>
    ),
  }),
];

export function ScreenerTable({ rows }: { rows: ScreenerRow[] }) {
  "use no memo"; // TanStack Table não é memoizável pelo React Compiler
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "score", desc: true },
  ]);

  // eslint-disable-next-line react-hooks/incompatible-library -- ver "use no memo" acima
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (rows.length === 0) {
    return (
      <div className="border border-line bg-surface px-6 py-16 text-center">
        <p className="font-mono text-[12px] tracking-[0.14em] text-ink-faint">
          NENHUM POOL ATENDE AOS FILTROS
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-line bg-surface">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-line">
              {hg.headers.map((h, i) => {
                const sorted = h.column.getIsSorted();
                return (
                  <th
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    className={`cursor-pointer select-none px-3 py-2.5 font-mono text-[10px] tracking-[0.14em] text-ink-faint transition-colors hover:text-ink ${
                      i === 0 ? "text-left" : "text-right"
                    }`}
                  >
                    <span
                      className={`flex items-center gap-1 ${
                        i === 0 ? "" : "justify-end"
                      }`}
                    >
                      {flexRender(
                        h.column.columnDef.header,
                        h.getContext(),
                      )}
                      {h.column.columnDef.meta?.hint && (
                        <ColHint hint={h.column.columnDef.meta.hint} />
                      )}
                      <span
                        className={
                          sorted ? "text-aqua" : "text-line-bright"
                        }
                      >
                        {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : "▽"}
                      </span>
                    </span>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, idx) => (
            <tr
              key={row.id}
              onClick={() => router.push(`/pool/${row.original.address}`)}
              className="group cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2"
            >
              {row.getVisibleCells().map((cell, i) => (
                <td
                  key={cell.id}
                  className={`px-3 py-2.5 font-mono text-[12px] tabular-nums ${
                    i === 0
                      ? "border-l-2 border-transparent text-left group-hover:border-aqua"
                      : "text-right text-ink-dim"
                  }`}
                >
                  {i === 0 && (
                    <span className="mr-2 text-[10px] text-ink-faint">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  )}
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
