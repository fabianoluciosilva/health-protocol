"use client";

import { useMemo, useState } from "react";
import { FlaskConical } from "lucide-react";
import MarkerCard from "./MarkerCard";
import CategoryFilter from "./CategoryFilter";
import { useExams } from "@/hooks/useExams";
import { getExamColor } from "@/lib/utils/exams";

export default function ExamDashboard() {
  const { exam, results, loading } = useExams();
  const [filter, setFilter] = useState<string>("alert");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: results.length };
    const alertCount = results.filter((r) => {
      const col = getExamColor(r);
      return col === "red" || col === "yellow";
    }).length;
    c.alert = alertCount;
    for (const r of results) {
      if (r.category) c[r.category] = (c[r.category] ?? 0) + 1;
    }
    return c;
  }, [results]);

  const filtered = useMemo(() => {
    if (filter === "all") return results;
    if (filter === "alert") {
      return results.filter((r) => {
        const col = getExamColor(r);
        return col === "red" || col === "yellow";
      });
    }
    return results.filter((r) => r.category === filter);
  }, [results, filter]);

  const sorted = useMemo(() => {
    const order = { red: 0, yellow: 1, blue: 2, green: 3 } as const;
    return [...filtered].sort((a, b) => order[getExamColor(a)] - order[getExamColor(b)]);
  }, [filtered]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-bg-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <div className="flex items-center gap-2 text-lg font-semibold text-white">
          <FlaskConical className="h-5 w-5 text-accent-blue" />
          Exames Laboratoriais
        </div>
        {exam && (
          <p className="mt-0.5 text-xs text-gray-400">
            Coleta: {formatExamDate(exam.exam_date)} · {exam.lab_name ?? "Laboratório"}
          </p>
        )}
      </header>

      <CategoryFilter active={filter} onChange={setFilter} counts={counts} />

      {sorted.length === 0 ? (
        <div className="rounded-2xl bg-bg-card p-6 text-center text-sm text-gray-400">
          Nenhum marcador nesta categoria.
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((r) => (
            <MarkerCard key={r.id} result={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function formatExamDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${d} ${months[m - 1]} ${y}`;
}
