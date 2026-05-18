"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { WeightHistory, Exercise } from "@/lib/supabase/types";

interface ExerciseProgress {
  exercise: Exercise;
  history: WeightHistory[];
  latest: number;
  oldest: number;
  delta: number;
}

export default function ProgressPage() {
  const [data, setData] = useState<ExerciseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: histData } = await supabase
        .from("weight_history")
        .select("*, exercise:exercises(*, muscle_group:muscle_groups(name, color))")
        .order("log_date", { ascending: false });

      if (!histData) { setLoading(false); return; }

      const byExercise = (histData as (WeightHistory & { exercise: Exercise })[]).reduce<
        Record<string, { exercise: Exercise; history: WeightHistory[] }>
      >((acc, h) => {
        if (!acc[h.exercise_id]) acc[h.exercise_id] = { exercise: h.exercise, history: [] };
        acc[h.exercise_id].history.push(h);
        return acc;
      }, {});

      const progress = Object.values(byExercise)
        .filter((x) => x.history.length > 0)
        .map((x) => {
          const sorted = [...x.history].sort((a, b) => a.log_date.localeCompare(b.log_date));
          const latest = sorted[sorted.length - 1].weight_kg;
          const oldest = sorted[0].weight_kg;
          return { exercise: x.exercise, history: sorted, latest, oldest, delta: latest - oldest };
        })
        .sort((a, b) => b.history.length - a.history.length);

      setData(progress);
      setLoading(false);
    })();
  }, [supabase]);

  return (
    <div className="space-y-4 px-4 pt-4">
      <header className="flex items-center gap-3">
        <Link href="/workout" className="rounded-xl bg-bg-card p-2 text-gray-400 active:scale-95">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold text-white">Evolução de Cargas</h1>
      </header>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-bg-card" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-2xl bg-bg-card p-6 text-center text-sm text-gray-400">
          Conclua alguns treinos para ver a evolução de cargas aqui.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map(({ exercise, history, latest, oldest, delta }) => {
            const mg = (exercise as Exercise & { muscle_group?: { name: string; color: string } }).muscle_group;
            return (
              <div key={exercise.id} className="rounded-2xl bg-bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-white">{exercise.name}</div>
                    {mg && (
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: mg.color }}
                        />
                        {mg.name}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-bold text-white">{latest} kg</div>
                    <div className="flex items-center justify-end gap-0.5 text-xs">
                      {delta > 0 && <><TrendingUp className="h-3 w-3 text-accent-green" /><span className="text-accent-green">+{delta} kg</span></>}
                      {delta < 0 && <><TrendingDown className="h-3 w-3 text-accent-red" /><span className="text-accent-red">{delta} kg</span></>}
                      {delta === 0 && <><Minus className="h-3 w-3 text-gray-500" /><span className="text-gray-500">sem alteração</span></>}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-end gap-1 overflow-x-auto no-scrollbar">
                  {history.slice(-12).map((h, i, arr) => {
                    const max = Math.max(...arr.map((x) => x.weight_kg));
                    const pct = max > 0 ? (h.weight_kg / max) * 100 : 10;
                    return (
                      <div key={h.id} className="flex flex-1 flex-col items-center gap-1 min-w-[2rem]">
                        <div className="text-[9px] tabular-nums text-gray-500">{h.weight_kg}</div>
                        <div
                          className="w-full rounded-sm bg-accent-blue/60 min-h-[4px] transition-all"
                          style={{ height: `${Math.max(4, (pct / 100) * 40)}px` }}
                        />
                        <div className="text-[8px] text-gray-600 rotate-0">
                          {new Date(h.log_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 flex justify-between text-[10px] text-gray-500">
                  <span>Início: {oldest} kg</span>
                  <span>{history.length} registro{history.length !== 1 ? "s" : ""}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
