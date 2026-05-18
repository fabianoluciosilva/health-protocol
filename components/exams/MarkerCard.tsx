"use client";

import type { LabResult } from "@/lib/supabase/types";
import { formatRef, formatValue, getExamColor, getProgressPct, getTip, percentDelta } from "@/lib/utils/exams";
import { cn } from "@/lib/utils/cn";

interface Props {
  result: LabResult;
}

const COLOR_MAP = {
  red: { dot: "🔴", border: "border-red-500/40", bar: "bg-red-500", chip: "text-red-300" },
  yellow: { dot: "🟡", border: "border-amber-400/40", bar: "bg-amber-400", chip: "text-amber-300" },
  green: { dot: "🟢", border: "border-emerald-500/30", bar: "bg-emerald-500", chip: "text-emerald-300" },
  blue: { dot: "🔵", border: "border-blue-500/30", bar: "bg-blue-500", chip: "text-blue-300" },
} as const;

export default function MarkerCard({ result }: Props) {
  const color = getExamColor(result);
  const meta = COLOR_MAP[color];
  const delta = percentDelta(result);
  const pct = getProgressPct(result);
  const tip = getTip(result.marker);

  return (
    <article className={cn("rounded-2xl border bg-bg-card p-4", meta.border)}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span aria-hidden>{meta.dot}</span>
          <h3 className="text-sm font-semibold text-white">{result.marker}</h3>
        </div>
        {delta && (
          <span className={cn("text-xs font-medium", meta.chip)}>
            {delta.sign}
            {delta.pct}% {delta.sign === "+" ? "acima" : "abaixo"}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">{formatValue(result.value)}</span>
        <span className="text-xs text-gray-400">{result.unit}</span>
        <span className="ml-auto text-xs text-gray-500">Ref: {formatRef(result)} {result.unit}</span>
      </div>

      <div className="relative my-3 h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
        <div className={cn("absolute inset-y-0 left-0 rounded-full transition-all", meta.bar)} style={{ width: `${pct}%` }} />
        {result.ref_min != null && (
          <span
            aria-hidden
            className="absolute top-0 h-full w-px bg-white/30"
            style={{ left: `${getRefMarkerPct(result, "min")}%` }}
          />
        )}
        {result.ref_max != null && (
          <span
            aria-hidden
            className="absolute top-0 h-full w-px bg-white/30"
            style={{ left: `${getRefMarkerPct(result, "max")}%` }}
          />
        )}
      </div>

      {tip && (
        <div className="rounded-lg bg-bg-elevated/60 px-3 py-2 text-[11px] leading-snug text-gray-300">
          <span className="mr-1">💡</span>
          {tip}
        </div>
      )}
    </article>
  );
}

function getRefMarkerPct(r: LabResult, which: "min" | "max"): number {
  const lo = r.ref_min ?? 0;
  const hi = r.ref_max ?? lo * 2;
  const range = hi - lo || 1;
  const pad = range * 0.5;
  const min = lo - pad;
  const max = hi + pad;
  const v = which === "min" ? (r.ref_min as number) : (r.ref_max as number);
  return Math.max(2, Math.min(98, ((v - min) / (max - min)) * 100));
}
