"use client";

import { Check, Droplets, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ExerciseLog, WorkoutSession } from "@/lib/supabase/types";
import Link from "next/link";

interface Props {
  session: WorkoutSession;
  logs: ExerciseLog[];
  previousWeights: Record<string, number>;
  onSave: () => void;
}

export default function WorkoutSummary({ session, logs, previousWeights, onSave }: Props) {
  const durationMin = session.started_at && session.completed_at
    ? Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 60000)
    : null;

  const doneLogs = logs.filter((l) => l.completed);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-bg-card p-5 text-center">
        <div className="text-4xl">🎉</div>
        <h2 className="mt-2 text-xl font-bold text-white">Treino Concluído!</h2>
        <div className="mt-3 flex justify-center gap-6 text-sm">
          {durationMin && (
            <div>
              <div className="font-semibold text-white">⏱ {durationMin} min</div>
              <div className="text-xs text-gray-500">duração</div>
            </div>
          )}
          <div>
            <div className="font-semibold text-white">📊 {doneLogs.length}/{logs.length}</div>
            <div className="text-xs text-gray-500">exercícios</div>
          </div>
        </div>
      </div>

      {doneLogs.length > 0 && (
        <div className="rounded-2xl bg-bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-300">Resumo de Cargas</h3>
          <ul className="space-y-2">
            {doneLogs.map((log) => {
              const prev = log.exercise_id ? previousWeights[log.exercise_id] : undefined;
              const curr = log.weight_kg;
              const delta = curr != null && prev != null ? curr - prev : null;
              return (
                <li key={log.id} className="flex items-center justify-between text-sm">
                  <span className="flex-1 truncate text-gray-300">{log.exercise?.name ?? "—"}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white">
                      {curr != null ? `${curr} kg` : "Peso corporal"}
                    </span>
                    {delta !== null && delta > 0 && <TrendingUp className="h-3.5 w-3.5 text-accent-green" />}
                    {delta !== null && delta < 0 && <TrendingDown className="h-3.5 w-3.5 text-accent-red" />}
                    {delta !== null && delta === 0 && <Minus className="h-3.5 w-3.5 text-gray-500" />}
                    {delta !== null && delta !== 0 && (
                      <span className={`text-[10px] ${delta > 0 ? "text-accent-green" : "text-accent-red"}`}>
                        {delta > 0 ? "+" : ""}{delta} kg
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-accent-blue/20 bg-bg-card/60 p-4 text-sm text-gray-400">
        <div className="flex items-start gap-2">
          <Droplets className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue" />
          <span>Lembre de beber água! Ácido Úrico elevado — hidratação pós-treino é fundamental.</span>
        </div>
      </div>

      <button
        onClick={onSave}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-green py-3.5 text-sm font-semibold text-white active:scale-[0.98]"
      >
        <Check className="h-5 w-5" strokeWidth={3} />
        Salvar treino
      </button>

      <Link
        href="/workout/history"
        className="block w-full rounded-2xl border border-bg-elevated bg-bg-card py-3 text-center text-sm text-gray-400 active:scale-[0.98]"
      >
        Ver histórico
      </Link>
    </div>
  );
}
