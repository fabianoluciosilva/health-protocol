"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MedicationLog, Medication } from "@/lib/supabase/types";
import { formatDateISO, getTodaySchedule, findLog } from "@/lib/utils/medications";

export function useTodaySchedule(medications: Medication[]) {
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const supabase = createClient();

  const today = useMemo(() => formatDateISO(now), [now]);
  const slots = useMemo(() => getTodaySchedule(medications, now), [medications, now]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("medication_logs")
      .select("*")
      .eq("scheduled_date", today);
    setLogs(((data ?? []) as MedicationLog[]));
    setLoading(false);
  }, [supabase, today]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const toggle = useCallback(
    async (medication: Medication, time: string) => {
      const t = time.length === 5 ? `${time}:00` : time;
      const existing = findLog(logs, medication.id, time);
      const nextTaken = !(existing?.taken ?? false);

      if (existing) {
        await supabase
          .from("medication_logs")
          .update({ taken: nextTaken, taken_at: nextTaken ? new Date().toISOString() : null })
          .eq("id", existing.id);
      } else {
        await supabase.from("medication_logs").insert({
          medication_id: medication.id,
          scheduled_date: today,
          scheduled_time: t,
          taken: nextTaken,
          taken_at: nextTaken ? new Date().toISOString() : null,
        });
      }
      await loadLogs();
    },
    [logs, supabase, today, loadLogs]
  );

  return { slots, logs, now, loading, toggle };
}
