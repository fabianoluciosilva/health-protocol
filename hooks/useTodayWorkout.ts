"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WorkoutSplit, SplitExercise } from "@/lib/supabase/types";
import { getTodaySplit, formatDateISO } from "@/lib/utils/workout";

export function useTodayWorkout(date: Date, overrideSplitId?: string) {
  const [splits, setSplits] = useState<WorkoutSplit[]>([]);
  const [splitExercises, setSplitExercises] = useState<SplitExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const todaySplit = getTodaySplit(splits, date);

  const loadExercises = useCallback(async (splitId: string) => {
    const { data: seData } = await supabase
      .from("split_exercises")
      .select("*, exercise:exercises(*, muscle_group:muscle_groups(*))")
      .eq("split_id", splitId)
      .order("order_index");
    setSplitExercises((seData ?? []) as SplitExercise[]);
  }, [supabase]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: splitData } = await supabase
      .from("workout_splits")
      .select("*")
      .order("day_of_week");
    setSplits((splitData ?? []) as WorkoutSplit[]);

    const targetId = overrideSplitId ?? (splitData as WorkoutSplit[] | null)?.find(
      (s) => s.day_of_week === date.getDay() + 1 && !s.is_rest_day
    )?.id;

    if (targetId) {
      await loadExercises(targetId);
    } else {
      setSplitExercises([]);
    }
    setLoading(false);
  }, [supabase, date, overrideSplitId, loadExercises]);

  useEffect(() => {
    load();
  }, [load]);

  const todayStr = formatDateISO(date);

  return { todaySplit, splitExercises, splits, loading, todayStr, loadExercises };
}
