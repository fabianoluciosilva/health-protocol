"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BloodPressureLog } from "@/lib/supabase/types";

export function useBloodPressure(limit = 10) {
  const [logs, setLogs] = useState<BloodPressureLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("blood_pressure_logs")
      .select("*")
      .order("log_date", { ascending: false })
      .order("log_time", { ascending: false })
      .limit(limit);
    setLogs((data ?? []) as BloodPressureLog[]);
    setLoading(false);
  }, [supabase, limit]);

  useEffect(() => { load(); }, [load]);

  const addReading = useCallback(
    async (systolic: number, diastolic: number, pulse: number | null, date: string, time: string, notes?: string) => {
      await supabase.from("blood_pressure_logs").insert({
        log_date: date,
        log_time: time,
        systolic,
        diastolic,
        pulse: pulse ?? null,
        notes: notes ?? null,
      });
      await load();
    },
    [supabase, load]
  );

  const removeReading = useCallback(
    async (id: string) => {
      await supabase.from("blood_pressure_logs").delete().eq("id", id);
      await load();
    },
    [supabase, load]
  );

  return { logs, loading, addReading, removeReading };
}

export type BPCategory = "normal" | "elevated" | "high1" | "high2" | "crisis";

export function getBPCategory(systolic: number, diastolic: number): BPCategory {
  if (systolic >= 180 || diastolic >= 120) return "crisis";
  if (systolic >= 140 || diastolic >= 90) return "high2";
  if (systolic >= 130 || diastolic >= 80) return "high1";
  if (systolic >= 120 && diastolic < 80) return "elevated";
  return "normal";
}

export const BP_META: Record<BPCategory, { label: string; color: string; border: string; dot: string }> = {
  normal:   { label: "Normal",         color: "text-emerald-400", border: "border-emerald-500/30", dot: "🟢" },
  elevated: { label: "Elevada",        color: "text-yellow-400",  border: "border-yellow-500/30",  dot: "🟡" },
  high1:    { label: "Hipertensão I",  color: "text-orange-400",  border: "border-orange-500/40",  dot: "🟠" },
  high2:    { label: "Hipertensão II", color: "text-red-400",     border: "border-red-500/40",     dot: "🔴" },
  crisis:   { label: "Crise",          color: "text-red-300",     border: "border-red-400/60",     dot: "🔴" },
};
