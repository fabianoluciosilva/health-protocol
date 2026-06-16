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

  // Mantém profiles.weight_kg igual ao peso mais recente registrado, para que
  // todos os "informes" (IMC, TMB, TDEE, calorias, proteína) recalculem sozinhos.
  const syncProfileWeight = useCallback(async () => {
    const { data } = await supabase
      .from("body_weight_logs")
      .select("weight_kg")
      .order("log_date", { ascending: false })
      .limit(1);
    const latest = data?.[0];
    if (!latest) return;
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight_kg: Number(latest.weight_kg) }),
    });
  }, [supabase]);

  const addLog = useCallback(async (weight_kg: number, log_date: string, notes?: string) => {
    await supabase.from("body_weight_logs").upsert(
      { log_date, weight_kg, notes: notes ?? null },
      { onConflict: "log_date" }
    );
    await load();
    await syncProfileWeight();
  }, [supabase, load, syncProfileWeight]);

  const removeLog = useCallback(async (id: string) => {
    await supabase.from("body_weight_logs").delete().eq("id", id);
    await load();
    await syncProfileWeight();
  }, [supabase, load, syncProfileWeight]);

  return { logs, loading, addLog, removeLog, reload: load };
}

// Peso mais recente registrado (por data). Fonte de verdade para os "informes".
export function useLatestWeight() {
  const [weight, setWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("body_weight_logs")
        .select("weight_kg")
        .order("log_date", { ascending: false })
        .limit(1);
      if (!active) return;
      setWeight(data?.[0] ? Number(data[0].weight_kg) : null);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [supabase]);

  return { weight, loading };
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

  // Upsert por (user_id, log_date): mesma data substitui; datas diferentes
  // preservam o histórico para o comparativo automático.
  const addMeasurement = useCallback(async (entry: Omit<BodyMeasurement, "id" | "created_at">) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("body_measurements").upsert(
      { ...entry, user_id: user?.id },
      { onConflict: "user_id,log_date" }
    );
    await load();
  }, [supabase, load]);

  const removeLog = useCallback(async (id: string) => {
    await supabase.from("body_measurements").delete().eq("id", id);
    await load();
  }, [supabase, load]);

  return { logs, loading, addMeasurement, removeLog, reload: load };
}
