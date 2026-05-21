"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LabResult } from "@/lib/supabase/types";
import { NUTRITION_EXAM_ALERTS, type ExamAlert } from "@/lib/utils/nutrition";

export function useExamAlerts() {
  const [alerts, setAlerts] = useState<ExamAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchAlerts = useCallback(async () => {
    const { data: exams } = await supabase
      .from("lab_exams")
      .select("id")
      .order("exam_date", { ascending: false })
      .limit(1);
    const latestId = ((exams ?? []) as { id: string }[])[0]?.id;
    if (!latestId) {
      setAlerts([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("lab_results")
      .select("*")
      .eq("exam_id", latestId);
    const results = (data ?? []) as LabResult[];
    const flagged = NUTRITION_EXAM_ALERTS.filter((a) => {
      const r = results.find((x) => x.marker === a.marker);
      return r && r.status === "high";
    });
    setAlerts(flagged);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAlerts();

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
