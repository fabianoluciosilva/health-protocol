"use client";

import { useState } from "react";
import ExamDashboard from "@/components/exams/ExamDashboard";
import ExamHistory from "@/components/exams/ExamHistory";
import AddExamForm from "@/components/exams/AddExamForm";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { key: "result",  label: "Resultado Atual" },
  { key: "history", label: "Histórico" },
  { key: "add",     label: "＋ Novo Exame" },
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
              "flex-1 rounded-xl py-2 text-xs font-semibold transition-colors",
              tab === t.key
                ? t.key === "add" ? "bg-accent-purple text-white" : "bg-bg-base text-white"
                : t.key === "add" ? "text-accent-purple" : "text-gray-500"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "result"  && <ExamDashboard />}
      {tab === "history" && <ExamHistory />}
      {tab === "add"     && (
        <AddExamForm onSuccess={() => setTab("result")} />
      )}
    </div>
  );
}
