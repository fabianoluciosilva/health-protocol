"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { QuickFoodLog } from "@/lib/supabase/types";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useQuickFood(date?: Date) {
  const [logs, setLogs] = useState<QuickFoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const dateStr = date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : todayISO();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("quick_food_logs")
      .select("*")
      .eq("log_date", dateStr)
      .order("log_time", { ascending: false });
    setLogs((data ?? []) as QuickFoodLog[]);
    setLoading(false);
  }, [supabase, dateStr]);

  useEffect(() => { load(); }, [load]);

  const addFood = useCallback(
    async (
      description: string,
      category: QuickFoodLog["category"],
      calories: number | null,
      protein_g: number | null
    ) => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
      await supabase.from("quick_food_logs").insert({
        log_date: dateStr,
        log_time: time,
        description,
        category,
        calories: calories ?? null,
        protein_g: protein_g ?? null,
      });
      await load();
    },
    [supabase, dateStr, load]
  );

  const removeFood = useCallback(
    async (id: string) => {
      await supabase.from("quick_food_logs").delete().eq("id", id);
      await load();
    },
    [supabase, load]
  );

  const totalCalories = logs.reduce((s, l) => s + (l.calories ?? 0), 0);
  const totalProtein = logs.reduce((s, l) => s + Number(l.protein_g ?? 0), 0);

  return { logs, loading, addFood, removeFood, totalCalories, totalProtein };
}
