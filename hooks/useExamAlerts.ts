"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LabResult } from "@/lib/supabase/types";
import { NUTRITION_EXAM_ALERTS, type ExamAlert } from "@/lib/utils/nutrition";

export function useExamAlerts() {
  const [alerts, setAlerts] = useState<ExamAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: exams } = await supabase
        .from("lab_exams")
        .select("id")
        .order("exam_date", { ascending: false })
        .limit(1);
      const latestId = ((exams ?? []) as { id: string }[])[0]?.id;
      if (!latestId) {
        if (!cancelled) { setAlerts([]); setLoading(false); }
        return;
      }
      const { data } = await supabase
        .from("lab_results")
        .select("*")
        .eq("exam_id", latestId);
      const results = ((data ?? []) as LabResult[]);
      const flagged = NUTRITION_EXAM_ALERTS.filter((a) => {
        const r = results.find((x) => x.marker === a.marker);
        return r && r.status === "high";
      });
      if (!cancelled) {
        setAlerts(flagged);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  return { alerts, loading };
}
