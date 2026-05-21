"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LabExam, LabResult } from "@/lib/supabase/types";
import { NUTRITION_EXAM_ALERTS, type ExamAlert } from "@/lib/utils/nutrition";

export function useExamAlerts() {
  const [alerts, setAlerts] = useState<ExamAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/exams?latest=1");
      if (!res.ok) { setAlerts([]); setLoading(false); return; }
      const { results } = await res.json() as { exams: LabExam[]; results: LabResult[] };
      const flagged = NUTRITION_EXAM_ALERTS.filter((a) => {
        const r = results.find((x) => x.marker === a.marker);
        return r && r.status === "high";
      });
      setAlerts(flagged);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    // Re-fetch alerts whenever a new exam is inserted
    const channel = supabase
      .channel("exam-alerts-watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lab_exams" }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchAlerts]);

  return { alerts, loading };
}
