"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WaterLog } from "@/lib/supabase/types";
import { formatDateISO } from "@/lib/utils/dates";
import { getWaterGoal } from "@/lib/utils/water";

export function useWaterLog(date: Date = new Date()) {
  const [log, setLog] = useState<WaterLog | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const day = formatDateISO(date);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("water_logs")
      .select("*")
      .eq("log_date", day)
      .limit(1);
    const rows = (data ?? []) as WaterLog[];
    setLog(rows[0] ?? null);
    setLoading(false);
  }, [supabase, day]);

  useEffect(() => { load(); }, [load]);

  const ensureRow = useCallback(
    async (patch: Partial<WaterLog>): Promise<WaterLog | null> => {
      if (log) {
        const { data } = await supabase
          .from("water_logs")
          .update(patch)
          .eq("id", log.id)
          .select();
        const rows = (data ?? []) as WaterLog[];
        return rows[0] ?? null;
      }
      const seed = {
        log_date: day,
        ml_consumed: 0,
        goal_ml: getWaterGoal(false),
        is_training_day: false,
        ...patch,
      };
      const { data } = await supabase.from("water_logs").insert(seed).select();
      const rows = (data ?? []) as WaterLog[];
      return rows[0] ?? null;
    },
    [supabase, day, log]
  );

  const add = useCallback(
    async (amount: number) => {
      const current = log?.ml_consumed ?? 0;
      const updated = await ensureRow({ ml_consumed: Math.max(0, current + amount) });
      setLog(updated);
    },
    [log, ensureRow]
  );

  const reset = useCallback(async () => {
    const updated = await ensureRow({ ml_consumed: 0 });
    setLog(updated);
  }, [ensureRow]);

  const toggleTraining = useCallback(
    async (isTraining: boolean) => {
      const updated = await ensureRow({ is_training_day: isTraining, goal_ml: getWaterGoal(isTraining) });
      setLog(updated);
    },
    [ensureRow]
  );

  const ml = log?.ml_consumed ?? 0;
  const goal = log?.goal_ml ?? getWaterGoal(false);
  const isTraining = log?.is_training_day ?? false;
  const pct = Math.min(100, Math.round((ml / goal) * 100));

  return { log, loading, ml, goal, pct, isTraining, add, reset, toggleTraining };
}
