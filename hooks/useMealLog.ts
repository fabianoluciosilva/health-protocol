"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Meal, MealLog, MealType, OptionChosen } from "@/lib/supabase/types";
import { formatDateISO } from "@/lib/utils/dates";
import { NO_APPETITE_OPTIONS } from "@/lib/utils/nutrition";

export function useMealLog(date: Date) {
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const day = formatDateISO(date);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("meal_logs")
      .select("*")
      .eq("log_date", day);
    setLogs(((data ?? []) as MealLog[]));
    setLoading(false);
  }, [supabase, day]);

  useEffect(() => { load(); }, [load]);

  const findLog = useCallback(
    (type: MealType) => logs.find((l) => l.meal_type === type),
    [logs]
  );

  const upsert = useCallback(
    async (patch: Partial<MealLog> & { meal_type: MealType }) => {
      const existing = findLog(patch.meal_type);
      if (existing) {
        await supabase
          .from("meal_logs")
          .update({ ...patch, log_date: day })
          .eq("id", existing.id);
      } else {
        await supabase.from("meal_logs").insert({ ...patch, log_date: day });
      }
      await load();
    },
    [supabase, day, findLog, load]
  );

  const logOption = useCallback(
    async (meal: Meal, option: OptionChosen) => {
      await upsert({
        meal_type: meal.meal_type,
        option_chosen: option,
        no_appetite: false,
        notes: null,
        calories_actual: option === "skip" ? 0 : meal.calories_est,
        protein_actual: option === "skip" ? 0 : meal.protein_g,
      });
    },
    [upsert]
  );

  const logNoAppetite = useCallback(
    async (mealType: MealType, idx = 0) => {
      const opt = NO_APPETITE_OPTIONS[mealType][idx];
      await upsert({
        meal_type: mealType,
        option_chosen: null,
        no_appetite: true,
        notes: opt.label,
        calories_actual: opt.calories,
        protein_actual: opt.protein,
      });
    },
    [upsert]
  );

  const removeLog = useCallback(
    async (mealType: MealType) => {
      const existing = findLog(mealType);
      if (!existing) return;
      await supabase.from("meal_logs").delete().eq("id", existing.id);
      await load();
    },
    [supabase, findLog, load]
  );

  const logCustom = useCallback(
    async (mealType: MealType, description: string, calories: number | null, protein: number | null) => {
      await upsert({
        meal_type: mealType,
        option_chosen: null,
        no_appetite: false,
        notes: description,
        calories_actual: calories,
        protein_actual: protein,
      });
    },
    [upsert]
  );

  return { logs, loading, findLog, logOption, logNoAppetite, logCustom, removeLog, reload: load };
}
