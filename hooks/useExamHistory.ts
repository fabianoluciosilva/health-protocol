"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LabExam, LabResult } from "@/lib/supabase/types";

export interface ExamEntry {
  exam: LabExam;
  results: LabResult[];
}

export interface MarkerTimeline {
  marker: string;
  category: string;
  unit: string;
  ref_min: number | null;
  ref_max: number | null;
  points: { date: string; value: number; status: "low" | "high" | "normal" }[];
}

export function useExamHistory() {
  const [entries, setEntries] = useState<ExamEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: examsData } = await supabase
        .from("lab_exams")
        .select("*")
        .order("exam_date", { ascending: false });

      const exams = (examsData ?? []) as LabExam[];

      if (!exams.length) {
        if (!cancelled) { setEntries([]); setLoading(false); }
        return;
      }

      const { data: resultsData } = await supabase
        .from("lab_results")
        .select("*")
        .in("exam_id", exams.map((e) => e.id));

      const allResults = (resultsData ?? []) as LabResult[];
      const built: ExamEntry[] = exams.map((exam) => ({
        exam,
        results: allResults.filter((r) => r.exam_id === exam.id),
      }));

      if (!cancelled) { setEntries(built); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  const timelines = useMemo((): MarkerTimeline[] => {
    const map = new Map<string, MarkerTimeline>();
    // entries are newest-first; reverse to build chronological timeline
    [...entries].reverse().forEach((entry) => {
      entry.results.forEach((r) => {
        if (!map.has(r.marker)) {
          map.set(r.marker, {
            marker: r.marker,
            category: r.category ?? "",
            unit: r.unit ?? "",
            ref_min: r.ref_min,
            ref_max: r.ref_max,
            points: [],
          });
        }
        map.get(r.marker)!.points.push({
          date: entry.exam.exam_date,
          value: r.value,
          status: r.status,
        });
      });
    });
    return Array.from(map.values());
  }, [entries]);

  return { entries, timelines, loading };
}
