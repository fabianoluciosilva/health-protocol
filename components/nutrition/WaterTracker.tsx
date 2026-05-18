"use client";

import { Droplet, RotateCcw } from "lucide-react";
import { useWaterLog } from "@/hooks/useWaterLog";
import { cn } from "@/lib/utils/cn";

export default function WaterTracker({ compact = false }: { compact?: boolean }) {
  const { ml, goal, pct, isTraining, add, reset, loading } = useWaterLog();

  if (loading) return <div className="h-24 animate-pulse rounded-2xl bg-bg-card" />;

  return (
    <section className="rounded-2xl bg-bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
          <Droplet className="h-4 w-4 text-accent-blue" />
          Água hoje {isTraining && <span className="text-[10px] text-accent-orange">(treino)</span>}
        </div>
        <div className="text-xs text-gray-400">
          <span className="text-base font-semibold text-white">{ml.toLocaleString("pt-BR")}</span>
          <span> / {goal.toLocaleString("pt-BR")} ml</span>
        </div>
      </div>

      <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-bg-elevated">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all",
            pct >= 100 && "from-green-500 to-emerald-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex gap-2">
        <button onClick={() => add(250)} className="flex-1 rounded-xl bg-bg-elevated px-3 py-2 text-sm font-medium text-gray-100 active:scale-95">+250 ml</button>
        <button onClick={() => add(500)} className="flex-1 rounded-xl bg-bg-elevated px-3 py-2 text-sm font-medium text-gray-100 active:scale-95">+500 ml</button>
        {!compact && (
          <button onClick={reset} className="rounded-xl bg-bg-elevated px-3 py-2 text-gray-400 active:scale-95" aria-label="Zerar">
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}
