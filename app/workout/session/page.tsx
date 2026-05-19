"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";
import { useTodayWorkout } from "@/hooks/useTodayWorkout";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import { useExerciseLog } from "@/hooks/useExerciseLog";
import { useRestTimer } from "@/hooks/useRestTimer";
import WeightInput from "@/components/workout/WeightInput";
import RestTimer from "@/components/workout/RestTimer";
import ProgressBar from "@/components/workout/ProgressBar";
import VideoPlayer from "@/components/workout/VideoPlayer";
import WorkoutSummary from "@/components/workout/WorkoutSummary";
import { cn } from "@/lib/utils/cn";

export default function SessionPage() {
  const now = useMemo(() => new Date(), []);
  const router = useRouter();
  const { todaySplit, splitExercises, loading: loadingSplit } = useTodayWorkout(now);
  const { session, completeSession, cancelSession, reload: reloadSession } = useWorkoutSession(now, todaySplit?.id);
  const { logs, upsertLog, saveWeightHistory, reload: reloadLogs } = useExerciseLog(session?.id);
  const timer = useRestTimer();

  const [activeIdx, setActiveIdx] = useState(0);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [prevWeights] = useState<Record<string, number>>({});
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const activeExercise = splitExercises[activeIdx]?.exercise;
  const activeWeight = activeExercise ? (weights[activeExercise.id] ?? 0) : 0;
  const completedCount = logs.filter((l) => l.completed).length;

  const completedIds = useMemo(
    () => new Set(logs.filter((l) => l.completed).map((l) => l.exercise_id)),
    [logs]
  );

  const handleComplete = useCallback(async () => {
    if (!activeExercise || !session) return;
    const weight = weights[activeExercise.id] ?? 0;
    await upsertLog(activeExercise.id, {
      weight_kg: weight || null,
      sets_done: activeExercise.sets,
      reps_done: activeExercise.reps,
      completed: true,
    });
    if (weight > 0) {
      await saveWeightHistory(activeExercise.id, weight, now);
    }
    timer.start(activeExercise.rest_seconds);
    if (activeIdx < splitExercises.length - 1) {
      setActiveIdx((i) => i + 1);
    }
  }, [activeExercise, session, weights, upsertLog, saveWeightHistory, now, timer, activeIdx, splitExercises.length]);

  const handleFinish = useCallback(async () => {
    await completeSession();
    await reloadSession();
    await reloadLogs();
    setShowSummary(true);
  }, [completeSession, reloadSession, reloadLogs]);

  const handleCancel = useCallback(async () => {
    await cancelSession();
    setCancelConfirm(false);
    router.push("/workout");
  }, [cancelSession, router]);

  if (loadingSplit || !session) {
    return (
      <div className="space-y-3 px-4 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-bg-card" />
        ))}
      </div>
    );
  }

  if (!todaySplit || splitExercises.length === 0) {
    return (
      <div className="px-4 pt-4 text-center text-gray-400">
        Nenhum exercício carregado.{" "}
        <Link href="/workout" className="text-accent-blue">Voltar</Link>
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="space-y-4 px-4 pt-4">
        <WorkoutSummary
          session={session}
          logs={logs}
          previousWeights={prevWeights}
          onSave={() => router.push("/workout/history")}
        />
      </div>
    );
  }

  const allDone = completedIds.size >= splitExercises.length;

  return (
    <div className="space-y-4 px-4 pt-4">
      {cancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-bg-card p-6 space-y-4">
            <h3 className="text-base font-semibold text-white">Cancelar treino?</h3>
            <p className="text-sm text-gray-400">Nenhum dado será salvo. O histórico permanece limpo.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelConfirm(false)}
                className="flex-1 rounded-xl bg-bg-elevated py-2.5 text-sm text-gray-400 active:scale-95"
              >
                Continuar
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 rounded-xl bg-red-500/20 py-2.5 text-sm font-semibold text-red-400 active:scale-95"
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex items-center gap-3">
        <Link href="/workout" className="rounded-xl bg-bg-card p-2 text-gray-400 active:scale-95">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="text-xs text-gray-500">{todaySplit.split_name}</div>
        </div>
        <button
          onClick={() => setCancelConfirm(true)}
          className="flex items-center gap-1.5 rounded-xl bg-bg-card px-3 py-2 text-xs text-red-400 active:scale-95"
        >
          <X className="h-3.5 w-3.5" />
          Cancelar treino
        </button>
      </header>

      <ProgressBar done={completedCount} total={splitExercises.length} />

      <div className="space-y-1 rounded-2xl bg-bg-card p-4">
        <div className="text-xs uppercase tracking-wider text-gray-500">
          Série — Exercício {activeIdx + 1} de {splitExercises.length}
        </div>
        <h2 className="text-xl font-bold text-white">{activeExercise?.name}</h2>
        <p className="text-sm text-gray-400">
          {activeExercise?.sets} séries · {activeExercise?.reps} reps · descanso {activeExercise?.rest_seconds}s
        </p>

        {activeExercise?.technique_tip && (
          <p className="mt-2 text-xs leading-relaxed text-gray-400">
            💡 {activeExercise.technique_tip}
          </p>
        )}
      </div>

      {activeExercise?.youtube_video_id && (
        <VideoPlayer
          videoId={activeExercise.youtube_video_id}
          channel={activeExercise.youtube_channel}
          title={activeExercise.name}
        />
      )}

      {timer.active && (
        <RestTimer
          remaining={timer.remaining}
          total={timer.total}
          pct={timer.pct}
          active={timer.active}
          onSkip={timer.skip}
        />
      )}

      {!timer.active && (
        <div className="space-y-2 rounded-2xl bg-bg-card p-4">
          <div className="text-sm font-medium text-gray-300">Carga desta série</div>
          <WeightInput
            value={activeWeight}
            onChange={(v) => {
              if (activeExercise) setWeights((p) => ({ ...p, [activeExercise.id]: v }));
            }}
          />
          <button
            onClick={handleComplete}
            disabled={completedIds.has(activeExercise?.id ?? "")}
            className={cn(
              "mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition active:scale-[0.98]",
              completedIds.has(activeExercise?.id ?? "")
                ? "bg-accent-green/20 text-accent-green"
                : "bg-accent-green text-white"
            )}
          >
            <Check className="h-5 w-5" strokeWidth={3} />
            {completedIds.has(activeExercise?.id ?? "") ? "Exercício concluído" : "Série concluída"}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {splitExercises.map((se, i) => (
          <button
            key={se.id}
            onClick={() => setActiveIdx(i)}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-xs font-medium transition",
              i === activeIdx ? "bg-accent-blue text-white" : completedIds.has(se.exercise_id) ? "bg-accent-green/20 text-accent-green" : "bg-bg-elevated text-gray-400"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {allDone && (
        <button
          onClick={handleFinish}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-purple py-3.5 text-sm font-semibold text-white active:scale-[0.98]"
        >
          🏁 Finalizar treino
        </button>
      )}
    </div>
  );
}
