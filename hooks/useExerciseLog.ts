"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ExerciseLog, WeightHistory } from "@/lib/supabase/types";
import { formatDateISO } from "@/lib/utils/workout";

export function useExerciseLog(sessionId: string | undefined) {
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const loadLogs = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    const { data } = await supabase
      .from("exercise_logs")
      .select("*, exercise:exercises(*)")
      .eq("session_id", sessionId);
    setLogs((data ?? []) as ExerciseLog[]);
    setLoading(false);
  }, [supabase, sessionId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const upsertLog = useCallback(
    async (exerciseId: string, updates: Partial<ExerciseLog>) => {
      if (!sessionId) return;
      const existing = logs.find((l) => l.exercise_id === exerciseId);
      if (existing) {
        await supabase
          .from("exercise_logs")
          .update(updates)
          .eq("id", existing.id);
      } else {
        await supabase.from("exercise_logs").insert({
          session_id: sessionId,
          exercise_id: exerciseId,
          ...updates,
        });
      }
      await loadLogs();
    },
    [supabase, sessionId, logs, loadLogs]
  );

  const saveWeightHistory = useCallback(
    async (exerciseId: string, weightKg: number, date: Date) => {
      await supabase.from("weight_history").upsert(
        { exercise_id: exerciseId, log_date: formatDateISO(date), weight_kg: weightKg },
        { onConflict: "exercise_id,log_date" }
      );
    },
    [supabase]
  );

  return { logs, loading, upsertLog, saveWeightHistory, reload: loadLogs };
}

export function useLastWeight(exerciseId: string | undefined) {
  const [lastWeight, setLastWeight] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!exerciseId) return;
    supabase
      .from("weight_history")
      .select("weight_kg, log_date")
      .eq("exercise_id", exerciseId)
      .order("log_date", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setLastWeight(data ? (data as WeightHistory).weight_kg : null);
      });
  }, [supabase, exerciseId]);

  return lastWeight;
}
