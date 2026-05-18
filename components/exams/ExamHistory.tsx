"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus, FlaskConical } from "lucide-react";
import { useExamHistory, type MarkerTimeline } from "@/hooks/useExamHistory";
import MarkerCard from "./MarkerCard";
import MarkerSparkline from "./MarkerSparkline";
import { CATEGORIES, formatValue } from "@/lib/utils/exams";
import { cn } from "@/lib/utils/cn";

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${d} ${months[m - 1]} ${y}`;
}

export default function ExamHistory() {
  const { entries, timelines, loading } = useExamHistory();
  const [mode, setMode] = useState<"date" | "evolution">("evolution");
  const [dateIdx, setDateIdx] = useState(0);
  const [catFilter, setCatFilter] = useState("all");

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-bg-card" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-bg-card p-8 text-center">
        <FlaskConical className="mx-auto mb-2 h-8 w-8 text-gray-600" />
        <p className="text-sm text-gray-400">Nenhum exame registrado.</p>
      </div>
    );
  }

  const hasMultiple = entries.length > 1;
  const selectedEntry = entries[dateIdx];

  return (
    <div className="space-y-4">
      {/* Date/mode selector */}
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {entries.map((e, i) => (
          <button
            key={e.exam.id}
            onClick={() => { setMode("date"); setDateIdx(i); }}
            className={cn(
              "shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors",
              mode === "date" && dateIdx === i
                ? "bg-accent-blue text-white"
                : "bg-bg-card text-gray-400"
            )}
          >
            {fmtDate(e.exam.exam_date)}
          </button>
        ))}
        {hasMultiple && (
          <button
            onClick={() => setMode("evolution")}
            className={cn(
              "shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors",
              mode === "evolution" ? "bg-accent-blue text-white" : "bg-bg-card text-gray-400"
            )}
          >
            📈 Evolução
          </button>
        )}
      </div>

      {/* Specific exam date view */}
      {mode === "date" && (
        <div className="space-y-3">
          <p className="px-1 text-xs text-gray-500">
            {selectedEntry.exam.lab_name ?? "Laboratório"} · {fmtDate(selectedEntry.exam.exam_date)}
            {" · "}{selectedEntry.results.length} marcadores
          </p>
          {selectedEntry.results.map((r) => (
            <MarkerCard key={r.id} result={r} />
          ))}
          {selectedEntry.results.length === 0 && (
            <div className="rounded-2xl bg-bg-card p-4 text-center text-sm text-gray-400">
              Sem resultados para esta data.
            </div>
          )}
        </div>
      )}

      {/* Evolution view */}
      {mode === "evolution" && (
        <EvolutionView timelines={timelines} catFilter={catFilter} onCatFilter={setCatFilter} />
      )}
    </div>
  );
}

function EvolutionView({
  timelines,
  catFilter,
  onCatFilter,
}: {
  timelines: MarkerTimeline[];
  catFilter: string;
  onCatFilter: (c: string) => void;
}) {
  const availableCats = useMemo(() => {
    return Array.from(new Set(timelines.map((t) => t.category).filter(Boolean)));
  }, [timelines]);

  const filtered = useMemo(
    () => (catFilter === "all" ? timelines : timelines.filter((t) => t.category === catFilter)),
    [timelines, catFilter]
  );

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onCatFilter("all")}
          className={cn(
            "shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors",
            catFilter === "all" ? "bg-accent-blue text-white" : "bg-bg-card text-gray-400"
          )}
        >
          Todos
        </button>
        {availableCats.map((cat) => (
          <button
            key={cat}
            onClick={() => onCatFilter(cat)}
            className={cn(
              "shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors",
              catFilter === cat ? "bg-accent-blue text-white" : "bg-bg-card text-gray-400"
            )}
          >
            {CATEGORIES.find((c) => c.key === cat)?.label ?? cat}
          </button>
        ))}
      </div>

      {filtered.map((tl) => (
        <TimelineCard key={tl.marker} tl={tl} />
      ))}

      {filtered.length === 0 && (
        <div className="rounded-2xl bg-bg-card p-4 text-center text-sm text-gray-400">
          Nenhum marcador nesta categoria.
        </div>
      )}
    </div>
  );
}

function TimelineCard({ tl }: { tl: MarkerTimeline }) {
  const last = tl.points[tl.points.length - 1];
  const first = tl.points[0];
  const hasHistory = tl.points.length > 1;

  const trendPct =
    hasHistory && first.value !== 0
      ? Math.round(((last.value - first.value) / Math.abs(first.value)) * 100)
      : 0;

  const borderCls =
    last.status === "high"
      ? "border-amber-400/40"
      : last.status === "low"
      ? "border-blue-500/30"
      : "border-emerald-500/30";

  const refLabel =
    tl.ref_min != null && tl.ref_max != null
      ? `${formatValue(tl.ref_min)}–${formatValue(tl.ref_max)}`
      : tl.ref_max != null
      ? `≤ ${formatValue(tl.ref_max)}`
      : tl.ref_min != null
      ? `≥ ${formatValue(tl.ref_min)}`
      : null;

  return (
    <div className={cn("rounded-2xl border bg-bg-card p-4", borderCls)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-sm font-semibold text-white">{tl.marker}</span>
          {tl.unit && (
            <span className="ml-2 text-[10px] text-gray-500">{tl.unit}</span>
          )}
        </div>
        {hasHistory && (
          <div className="flex items-center gap-1 text-xs">
            {trendPct > 0 ? (
              <>
                <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-amber-400">+{trendPct}%</span>
              </>
            ) : trendPct < 0 ? (
              <>
                <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">{trendPct}%</span>
              </>
            ) : (
              <>
                <Minus className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-400">estável</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
        <span className="text-2xl font-bold text-white">{formatValue(last.value)}</span>
        {hasHistory && (
          <span className="text-xs text-gray-500">
            anterior: {formatValue(first.value)}
          </span>
        )}
        {refLabel && (
          <span className="ml-auto text-[11px] text-gray-500">ref: {refLabel}</span>
        )}
      </div>

      {hasHistory && (
        <div className="mt-3">
          <MarkerSparkline
            points={tl.points}
            refMin={tl.ref_min}
            refMax={tl.ref_max}
          />
        </div>
      )}
    </div>
  );
}
