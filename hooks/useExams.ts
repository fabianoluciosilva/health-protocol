"use client";

import { useEffect, useState } from "react";
import type { LabExam, LabResult } from "@/lib/supabase/types";

export function useExams() {
  const [exam, setExam] = useState<LabExam | null>(null);
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/exams?latest=1");
        if (!res.ok) { if (!cancelled) { setExam(null); setResults([]); setLoading(false); } return; }
        const { exams, results: allResults } = await res.json() as { exams: LabExam[]; results: LabResult[] };
        if (!cancelled) {
          setExam(exams[0] ?? null);
          setResults(allResults);
          setLoading(false);
        }
      } catch {
        if (!cancelled) { setExam(null); setResults([]); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { exam, results, loading };
}
