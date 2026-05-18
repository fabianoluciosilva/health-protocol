"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BodyWeightLog, BodyMeasurement } from "@/lib/supabase/types";

export function useBodyWeightLogs(limit = 20) {
  const [logs, setLogs] = useState<BodyWeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("body_weight_logs")
      .select("*")
      .order("log_date", { ascending: false })
      .limit(limit);
    setLogs((data ?? []) as BodyWeightLog[]);
    setLoading(false);
  }, [supabase, limit]);

  useEffect(() => { load(); }, [load]);

  const addLog = useCallback(async (weight_kg: number, log_date: string, notes?: string) => {
    await supabase.from("body_weight_logs").upsert(
      { log_date, weight_kg, notes: notes ?? null },
      { onConflict: "log_date" }
    );
    await load();
  }, [supabase, load]);

  const removeLog = useCallback(async (id: string) => {
    await supabase.from("body_weight_logs").delete().eq("id", id);
    await load();
  }, [supabase, load]);

  return { logs, loading, addLog, removeLog };
}

export function useBodyMeasurements(limit = 10) {
  const [logs, setLogs] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("body_measurements")
      .select("*")
      .order("log_date", { ascending: false })
      .limit(limit);
    setLogs((data ?? []) as BodyMeasurement[]);
    setLoading(false);
  }, [supabase, limit]);

  useEffect(() => { load(); }, [load]);

  const addMeasurement = useCallback(async (entry: Omit<BodyMeasurement, "id" | "created_at">) => {
    await supabase.from("body_measurements").insert(entry);
    await load();
  }, [supabase, load]);

  const removeLog = useCallback(async (id: string) => {
    await supabase.from("body_measurements").delete().eq("id", id);
    await load();
  }, [supabase, load]);

  return { logs, loading, addMeasurement, removeLog };
}
