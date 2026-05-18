"use client";

import { useMemo } from "react";
import { Play, AlertTriangle, Dumbbell } from "lucide-react";
import type { SplitExercise, WorkoutSplit, WorkoutSession } from "@/lib/supabase/types";
import ExerciseCard from "./ExerciseCard";
import RestDayCard from "./RestDayCard";
import { dayNameBR, estimateWorkoutDuration, WORKOUT_ALERTS } from "@/lib/utils/workout";
import Link from "next/link";

interface Props {
  date: Date;
  todaySplit: WorkoutSplit | undefined;
  splitExercises: SplitExercise[];
  splits: WorkoutSplit[];
  session: WorkoutSession | null;
  loading: boolean;
  onStart: () => void;
  bodyWeightKg?: number;
}

export default function TodayWorkout({
  date,
  todaySplit,
  splitExercises,
  splits,
  session,
  loading,
  onStart,
  bodyWeightKg = 130,
}: Props) {
  const nextWorkoutDay = useMemo(() => {
    if (!splits.length) return "";
    const dow = date.getDay() + 1;
    for (let i = 1; i <= 7; i++) {
      const next = ((dow - 1 + i) % 7) + 1;
      const s = splits.find((x) => x.day_of_week === next && !x.is_rest_day);
      if (s) {
        const daysAhead = i;
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + daysAhead);
        return `${dayNameBR(nextDate)} — ${s.split_name}`;
      }
    }
    return "";
  }, [splits, date]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-bg-card" />
        ))}
      </div>
    );
  }

  if (!todaySplit) {
    return (
      <div className="rounded-2xl bg-bg-card p-6 text-center text-sm text-gray-400">
        <Dumbbell className="mx-auto mb-2 h-6 w-6 text-gray-500" />
        Nenhum treino configurado para hoje.
      </div>
    );
  }

  if (todaySplit.is_rest_day) {
    return <RestDayCard split={todaySplit} nextWorkoutDay={nextWorkoutDay} />;
  }

  const duration = estimateWorkoutDuration(splitExercises.length);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500">{dayNameBR(date)}</div>
            <h2 className="mt-0.5 text-lg font-bold text-white">
              <span
                className="mr-2 inline-block h-3 w-3 rounded-full align-middle"
                style={{ backgroundColor: todaySplit.color }}
              />
              {todaySplit.split_name}
            </h2>
            {todaySplit.split_description && (
              <p className="mt-0.5 text-sm text-gray-400">{todaySplit.split_description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {splitExercises.length} exercícios · {duration}
            </p>
          </div>
        </div>

        {session?.completed ? (
          <Link
            href="/workout/history"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-accent-green/40 bg-accent-green/10 py-2.5 text-sm font-semibold text-accent-green"
          >
            ✓ Treino concluído hoje — ver histórico
          </Link>
        ) : session?.started_at ? (
          <Link
            href="/workout/session"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-orange py-3 text-sm font-semibold text-white active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-white" />
            Continuar treino em andamento
          </Link>
        ) : (
          <button
            onClick={onStart}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-blue py-3 text-sm font-semibold text-white active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-white" />
            Iniciar treino
          </button>
        )}
      </div>

      <div className="space-y-1.5 rounded-2xl bg-bg-card/60 p-3 text-xs text-gray-400">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-yellow" />
          {WORKOUT_ALERTS.knee.message}
        </div>
        <div className="flex items-start gap-2">
          <span className="shrink-0">💧</span>
          {WORKOUT_ALERTS.uricAcid.message}
        </div>
        <div className="flex items-start gap-2">
          <span className="shrink-0">❤️</span>
          {WORKOUT_ALERTS.bloodPressure.message}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="px-1 text-sm font-semibold text-gray-300">Exercícios de hoje</h3>
        {splitExercises.map((se, i) => (
          <ExerciseCard
            key={se.id}
            splitExercise={se}
            index={i}
            bodyWeightKg={bodyWeightKg}
          />
        ))}
      </div>
    </div>
  );
}
