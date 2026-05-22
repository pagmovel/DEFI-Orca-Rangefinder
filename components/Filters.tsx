"use client";

import type { RangePresetId } from "@/lib/types";
import { RANGE_PRESETS } from "@/lib/config";
import { inRangeProbability } from "@/lib/range";
import { formatPct } from "@/lib/format";

export interface FilterState {
  search: string;
  minTvl: number;
  minApr: number;
  presetId: RangePresetId;
}

interface FiltersProps {
  value: FilterState;
  onChange: (next: FilterState) => void;
  total: number;
  shown: number;
}

const TVL_OPTIONS = [100_000, 250_000, 500_000, 1_000_000];
const APR_OPTIONS = [0, 25, 50, 100];

const fieldClass =
  "h-9 border border-line bg-surface-2 px-2.5 font-mono text-[12px] text-ink outline-none transition-colors focus:border-aqua";

export function Filters({ value, onChange, total, shown }: FiltersProps) {
  const set = (patch: Partial<FilterState>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-4 border border-line bg-surface p-4">
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <label className="flex flex-col gap-1.5">
          <span className="tag">Par</span>
          <input
            value={value.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="SOL, USDC…"
            className={`${fieldClass} w-40 placeholder:text-ink-faint`}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="tag">TVL mínimo</span>
          <select
            value={value.minTvl}
            onChange={(e) => set({ minTvl: Number(e.target.value) })}
            className={fieldClass}
          >
            {TVL_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v >= 1_000_000 ? `$${v / 1_000_000}M` : `$${v / 1_000}k`}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="tag">APR conc. mínimo</span>
          <select
            value={value.minApr}
            onChange={(e) => set({ minApr: Number(e.target.value) })}
            className={fieldClass}
          >
            {APR_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}%
              </option>
            ))}
          </select>
        </label>

        <div className="ml-auto flex flex-col gap-1.5">
          <span className="tag text-right">
            {shown} de {total} pools
          </span>
          <div className="h-1 w-44 bg-surface-2">
            <div
              className="h-full bg-aqua-deep"
              style={{
                width: `${total ? (shown / total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="tag">Preset de range — alvo: permanência de 1 semana</span>
        <div className="flex flex-wrap gap-1.5">
          {RANGE_PRESETS.map((preset) => {
            const active = preset.id === value.presetId;
            const prob = inRangeProbability(preset.k) * 100;
            return (
              <button
                key={preset.id}
                onClick={() => set({ presetId: preset.id })}
                className={`flex items-baseline gap-2 border px-3 py-2 transition-colors ${
                  active
                    ? "border-aqua bg-aqua/10 text-ink"
                    : "border-line bg-surface-2 text-ink-dim hover:border-line-bright"
                }`}
              >
                <span className="text-[12px] font-medium">{preset.label}</span>
                <span
                  className={`font-mono text-[10px] ${
                    active ? "text-aqua" : "text-ink-faint"
                  }`}
                >
                  ~{formatPct(prob, 0)} no range
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
