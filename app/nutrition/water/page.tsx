"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Dumbbell, Bed, Droplet, RotateCcw } from "lucide-react";
import { useWaterLog } from "@/hooks/useWaterLog";
import { cn } from "@/lib/utils/cn";

export default function WaterPage() {
  const now = useMemo(() => new Date(), []);
  const { ml, goal, pct, isTraining, add, reset, toggleTraining, loading } = useWaterLog(now);

  return (
    <div className="space-y-4 px-4 pt-4">
      <header className="flex items-center gap-3">
        <Link href="/nutrition" className="rounded-xl bg-bg-card p-2 text-gray-400 active:scale-95">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold text-white">Hidratação</h1>
      </header>

      <section className="rounded-2xl bg-bg-card p-4">
        <button
          onClick={() => toggleTraining(!isTraining)}
          className={cn(
            "flex w-full items-center justify-between rounded-xl p-3 active:scale-[0.98]",
            isTraining ? "bg-accent-orange/15 text-accent-orange" : "bg-bg-elevated text-gray-300"
          )}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {isTraining ? <Dumbbell className="h-4 w-4" /> : <Bed className="h-4 w-4" />}
            {isTraining ? "Dia de treino" : "Dia de descanso"}
          </div>
          <div className="text-xs">
            Meta: <span className="font-semibold text-white">{goal.toLocaleString("pt-BR")} ml</span>
          </div>
        </button>
      </section>

      {loading ? (
        <div className="h-44 animate-pulse rounded-2xl bg-bg-card" />
      ) : (
        <section className="space-y-4 rounded-2xl bg-bg-card p-5 text-center">
          <Droplet className="mx-auto h-10 w-10 text-accent-blue" />
          <div>
            <div className="text-3xl font-bold text-white">{ml.toLocaleString("pt-BR")} ml</div>
            <div className="text-xs text-gray-400">de {goal.toLocaleString("pt-BR")} ml ({pct}%)</div>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-elevated">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all",
                pct >= 100 && "from-green-500 to-emerald-500"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </section>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[200, 250, 500].map((amt) => (
          <button
            key={amt}
            onClick={() => add(amt)}
            className="rounded-2xl bg-bg-card py-4 text-sm font-semibold text-white active:scale-95"
          >
            +{amt} ml
          </button>
        ))}
      </div>

      <button
        onClick={reset}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-bg-card py-2.5 text-sm text-gray-400 active:scale-95"
      >
        <RotateCcw className="h-4 w-4" /> Zerar o dia
      </button>

      <div className="rounded-2xl border border-bg-elevated bg-bg-card/60 p-4 text-xs leading-relaxed text-gray-400">
        💡 Dapagliflozina + Glifage têm efeito diurético. Em dias de treino, meta sobe para 3 L. Beba constante — não conte com a sede.
      </div>
    </div>
  );
}
