"use client";

import { useState } from "react";
import ExamDashboard from "@/components/exams/ExamDashboard";
import ExamHistory from "@/components/exams/ExamHistory";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { key: "result", label: "Resultado Atual" },
  { key: "history", label: "Histórico" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export default function ExamsPage() {
  const [tab, setTab] = useState<Tab>("result");

  return (
    <div className="space-y-4 px-4 pt-4">
      <div className="flex gap-1 rounded-2xl bg-bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-xl py-2 text-sm font-semibold transition-colors",
              tab === t.key ? "bg-bg-base text-white" : "text-gray-500"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "result" ? <ExamDashboard /> : <ExamHistory />}
    </div>
  );
}
