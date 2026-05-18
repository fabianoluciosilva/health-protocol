"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LabExam, LabResult } from "@/lib/supabase/types";

export function useExams() {
  const [exam, setExam] = useState<LabExam | null>(null);
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: examsData } = await supabase
        .from("lab_exams")
        .select("*")
        .order("exam_date", { ascending: false })
        .limit(1);
      const latest = ((examsData ?? []) as LabExam[])[0] ?? null;
      let res: LabResult[] = [];
      if (latest) {
        const { data } = await supabase
          .from("lab_results")
          .select("*")
          .eq("exam_id", latest.id);
        res = ((data ?? []) as LabResult[]);
      }
      if (!cancelled) {
        setExam(latest);
        setResults(res);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return { exam, results, loading };
}
