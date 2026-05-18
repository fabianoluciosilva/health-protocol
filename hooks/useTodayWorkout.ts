"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WorkoutSplit, SplitExercise } from "@/lib/supabase/types";
import { getTodaySplit, formatDateISO } from "@/lib/utils/workout";

export function useTodayWorkout(date: Date) {
  const [splits, setSplits] = useState<WorkoutSplit[]>([]);
  const [splitExercises, setSplitExercises] = useState<SplitExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const todaySplit = getTodaySplit(splits, date);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: splitData } = await supabase
      .from("workout_splits")
      .select("*")
      .order("day_of_week");
    setSplits((splitData ?? []) as WorkoutSplit[]);

    if (splitData && splitData.length > 0) {
      const todayDow = date.getDay() + 1;
      const today = (splitData as WorkoutSplit[]).find((s) => s.day_of_week === todayDow);
      if (today && !today.is_rest_day) {
        const { data: seData } = await supabase
          .from("split_exercises")
          .select("*, exercise:exercises(*, muscle_group:muscle_groups(*))")
          .eq("split_id", today.id)
          .order("order_index");
        setSplitExercises((seData ?? []) as SplitExercise[]);
      }
    }
    setLoading(false);
  }, [supabase, date]);

  useEffect(() => {
    load();
  }, [load]);

  const todayStr = formatDateISO(date);

  return { todaySplit, splitExercises, splits, loading, todayStr };
}
