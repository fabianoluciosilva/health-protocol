"use client";

import { useCallback, useEffect, useState } from "react";
import { TrendingUp, Scale, Ruler, FlaskConical, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { useBodyWeightLogs, useBodyMeasurements } from "@/hooks/useBodyMetrics";
import { useExamHistory } from "@/hooks/useExamHistory";
import WeightChart from "@/components/evolution/WeightChart";
import MeasurementsTable from "@/components/evolution/MeasurementsTable";
import LabTrendTable from "@/components/evolution/LabTrendTable";
import ExamAnalysisCard from "@/components/evolution/ExamAnalysisCard";
import type { ExamAnalysis } from "@/lib/supabase/types";

const TABS = [
  { key: "weight",       label: "Peso",    icon: Scale },
  { key: "measurements", label: "Medidas", icon: Ruler },
  { key: "labs",         label: "Exames",  icon: FlaskConical },
] as const;

type Tab = (typeof TABS)[number]["key"];

export default function EvolutionPage() {
  const [tab, setTab] = useState<Tab>("weight");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisOverride, setAnalysisOverride] = useState<ExamAnalysis | null | undefined>(
    undefined
  );

  const { logs: weightLogs, loading: loadingWeight } = useBodyWeightLogs(30);
  const { logs: measurements, loading: loadingMeasures } = useBodyMeasurements(10);
  const { entries, timelines, loading: loadingLabs } = useExamHistory();

  const latestExam = entries[0]?.exam ?? null;

  // Analysis to display: prefer local override, fall back to DB value
  const displayAnalysis =
    analysisOverride !== undefined ? analysisOverride : (latestExam?.ai_analysis ?? null);

  const runAnalysis = useCallback(async (examId?: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId }),
      });
      if (!res.ok) return;
      const { analysis } = await res.json() as { examId: string; analysis: ExamAnalysis };
      setAnalysisOverride(analysis);
    } catch {
      // silently fail — user can retry via button
    } finally {
      setAnalyzing(false);
    }
  }, []);

  // Auto-analyze when labs tab opens and latest exam has no analysis
  useEffect(() => {
    if (
      tab === "labs" &&
      !loadingLabs &&
      latestExam &&
      !latestExam.ai_analysis &&
      analysisOverride === undefined &&
      !analyzing
    ) {
      runAnalysis(latestExam.id);
    }
  }, [tab, loadingLabs, latestExam, analysisOverride, analyzing, runAnalysis]);

  return (
    <div className="space-y-4 px-4 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent-blue" />
          <h1 className="text-lg font-bold text-white">Evolução</h1>
        </div>
        <Link
          href="/profile"
          className="flex items-center gap-1.5 rounded-full bg-bg-card px-3 py-1.5 text-xs font-medium text-gray-400 active:scale-95"
        >
          <User className="h-3.5 w-3.5" />
          Perfil
        </Link>
      </div>

      <div className="flex gap-1 rounded-2xl bg-bg-card p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors",
                tab === t.key ? "bg-bg-base text-white" : "text-gray-500"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "weight" && (
        loadingWeight ? (
          <div className="h-48 animate-pulse rounded-2xl bg-bg-card" />
        ) : (
          <WeightChart logs={weightLogs} />
        )
      )}

      {tab === "measurements" && (
        loadingMeasures ? (
          <div className="h-48 animate-pulse rounded-2xl bg-bg-card" />
        ) : (
          <MeasurementsTable logs={measurements} />
        )
      )}

      {tab === "labs" && (
        loadingLabs ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-bg-card" />
            ))}
          </div>
        ) : !latestExam ? (
          <div className="rounded-2xl bg-bg-card p-6 text-center text-sm text-gray-400">
            Nenhum exame cadastrado.
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            <ExamAnalysisCard
              examDate={latestExam.exam_date}
              analysis={displayAnalysis}
              analyzing={analyzing}
              onAnalyze={() => {
                setAnalysisOverride(undefined);
                runAnalysis(latestExam.id);
              }}
            />
            {timelines.length > 0 && <LabTrendTable timelines={timelines} />}
          </div>
        )
      )}

      <p className="pb-2 text-center text-[11px] text-gray-600">
        Registre peso e medidas regularmente para acompanhar a evolução.
      </p>
    </div>
  );
}
