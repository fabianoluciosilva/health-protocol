"use client";

import { Droplet, RotateCcw } from "lucide-react";
import { useWaterCounter } from "@/hooks/useWaterCounter";
import { cn } from "@/lib/utils/cn";

export default function WaterCounter() {
  const { ml, goalMl, pct, add, reset, ready } = useWaterCounter(3000);

  if (!ready) {
    return <div className="h-32 animate-pulse rounded-2xl bg-bg-card" />;
  }

  return (
    <section className="rounded-2xl bg-bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
          <Droplet className="h-4 w-4 text-accent-blue" />
          Água hoje
        </div>
        <div className="text-xs text-gray-400">
          <span className="text-base font-semibold text-white">{ml.toLocaleString("pt-BR")}</span>
          <span> / {goalMl.toLocaleString("pt-BR")} ml</span>
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
        <button
          onClick={() => add(250)}
          className="flex-1 rounded-xl bg-bg-elevated px-3 py-2 text-sm font-medium text-gray-100 active:scale-95"
        >
          +250 ml
        </button>
        <button
          onClick={() => add(500)}
          className="flex-1 rounded-xl bg-bg-elevated px-3 py-2 text-sm font-medium text-gray-100 active:scale-95"
        >
          +500 ml
        </button>
        <button
          onClick={reset}
          className="rounded-xl bg-bg-elevated px-3 py-2 text-gray-400 active:scale-95"
          aria-label="Zerar"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
