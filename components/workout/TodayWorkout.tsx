"use client";

import { useMemo, useState } from "react";
import { Play, AlertTriangle, Dumbbell } from "lucide-react";
import type { MuscleGroup, SplitExercise, WorkoutSplit, WorkoutSession } from "@/lib/supabase/types";
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
  selectedSplitId?: string;
  onSelectSplit: (id: string | undefined) => void;
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
  selectedSplitId,
  onSelectSplit,
  onStart,
  bodyWeightKg = 130,
}: Props) {
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const todayDow = date.getDay() + 1;
  const trainingSplits = splits.filter((s) => !s.is_rest_day);

  const uniqueMuscleGroups = useMemo((): MuscleGroup[] => {
    const seen = new Set<string>();
    const groups: MuscleGroup[] = [];
    for (const se of splitExercises) {
      const mg = se.exercise?.muscle_group;
      if (mg && !seen.has(mg.id)) {
        seen.add(mg.id);
        groups.push(mg);
      }
    }
    return groups;
  }, [splitExercises]);

  const visibleExercises = useMemo(() => {
    if (selectedGroups.size === 0) return splitExercises;
    return splitExercises.filter((se) => {
      const name = se.exercise?.muscle_group?.name;
      return name && selectedGroups.has(name);
    });
  }, [splitExercises, selectedGroups]);

  function toggleGroup(name: string) {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }
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

  const splitSelector = trainingSplits.length > 0 && (
    <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {trainingSplits.map((s) => {
        const isToday = s.day_of_week === todayDow;
        const isActive = selectedSplitId ? s.id === selectedSplitId : isToday;
        return (
          <button
            key={s.id}
            onClick={() => onSelectSplit(s.id === (splits.find((x) => x.day_of_week === todayDow)?.id) && isToday ? undefined : s.id)}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              isActive
                ? "text-white"
                : "bg-bg-card text-gray-400"
            }`}
            style={isActive ? { backgroundColor: s.color } : undefined}
          >
            {s.split_name}
            {isToday && <span className="ml-1 opacity-70">·hoje</span>}
          </button>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {splitSelector}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-bg-card" />
        ))}
      </div>
    );
  }

  if (!todaySplit) {
    return (
      <div className="space-y-3">
        {splitSelector}
        <div className="rounded-2xl bg-bg-card p-6 text-center text-sm text-gray-400">
          <Dumbbell className="mx-auto mb-2 h-6 w-6 text-gray-500" />
          {selectedSplitId ? "Carregando treino..." : "Nenhum treino configurado para hoje."}
        </div>
      </div>
    );
  }

  if (todaySplit?.is_rest_day) {
    return (
      <div className="space-y-3">
        {splitSelector}
        <RestDayCard split={todaySplit} nextWorkoutDay={nextWorkoutDay} />
      </div>
    );
  }

  const duration = estimateWorkoutDuration(splitExercises.length);

  return (
    <div className="space-y-4">
      {splitSelector}
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

      {uniqueMuscleGroups.length > 1 && (
        <div className="space-y-2">
          <p className="px-1 text-xs text-gray-500">Filtrar por grupo muscular</p>
          <div className="flex flex-wrap gap-2">
            {uniqueMuscleGroups.map((mg) => {
              const active = selectedGroups.has(mg.name);
              return (
                <button
                  key={mg.id}
                  onClick={() => toggleGroup(mg.name)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active ? "text-white" : "bg-bg-card text-gray-400"
                  }`}
                  style={active ? { backgroundColor: mg.color } : undefined}
                >
                  {mg.name}
                </button>
              );
            })}
            {selectedGroups.size > 0 && (
              <button
                onClick={() => setSelectedGroups(new Set())}
                className="rounded-xl bg-bg-elevated px-3 py-1.5 text-xs text-gray-500"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="px-1 text-sm font-semibold text-gray-300">
          Exercícios de hoje
          {selectedGroups.size > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-500">
              ({visibleExercises.length} de {splitExercises.length})
            </span>
          )}
        </h3>
        {visibleExercises.map((se, i) => (
          <ExerciseCard
            key={se.id}
            splitExercise={se}
            index={i}
            bodyWeightKg={bodyWeightKg}
          />
        ))}
        {visibleExercises.length === 0 && (
          <div className="rounded-2xl bg-bg-card p-6 text-center text-sm text-gray-400">
            Nenhum exercício para os grupos selecionados.
          </div>
        )}
      </div>
    </div>
  );
}
