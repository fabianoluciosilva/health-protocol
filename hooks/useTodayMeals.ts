"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Meal } from "@/lib/supabase/types";
import { dayOfWeekBR } from "@/lib/utils/dates";

export function useDayMeals(date: Date) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const dayKey = date.toDateString();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const dow = dayOfWeekBR(date);
      const { data } = await supabase
        .from("meals")
        .select("*")
        .eq("day_of_week", dow)
        .order("meal_time", { ascending: true });
      if (!cancelled) {
        setMeals(((data ?? []) as Meal[]));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey]);

  return { meals, loading };
}

export function useWeekMeals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("meals")
        .select("*")
        .order("day_of_week", { ascending: true })
        .order("meal_time", { ascending: true });
      if (!cancelled) {
        setMeals(((data ?? []) as Meal[]));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  return { meals, loading };
}
