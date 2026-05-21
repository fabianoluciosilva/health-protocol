"use client";

import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/exams");
        if (!res.ok) { if (!cancelled) { setEntries([]); setLoading(false); } return; }
        const { exams, results } = await res.json() as { exams: LabExam[]; results: LabResult[] };
        const built: ExamEntry[] = exams.map((exam) => ({
          exam,
          results: results.filter((r) => r.exam_id === exam.id),
        }));
        if (!cancelled) { setEntries(built); setLoading(false); }
      } catch {
        if (!cancelled) { setEntries([]); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const timelines = useMemo((): MarkerTimeline[] => {
    const map = new Map<string, MarkerTimeline>();
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
