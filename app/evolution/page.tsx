"use client";

import { useCallback, useState } from "react";
import { TrendingUp, Scale, Ruler, FlaskConical, User, ArrowRight, Plus } from "lucide-react";
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

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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
  const prevExam = entries[1]?.exam ?? null;

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
      const { analysis } = (await res.json()) as { examId: string; analysis: ExamAnalysis };
      setAnalysisOverride(analysis);
    } catch {
      // silently fail — user can retry
    } finally {
      setAnalyzing(false);
    }
  }, []);

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
            {/* Cabeçalho dos exames sendo comparados */}
            <div className="flex items-center justify-between rounded-2xl bg-bg-card px-4 py-3">
              <div className="text-xs text-gray-400">
                {prevExam ? (
                  <span className="flex items-center gap-1.5">
                    <span className="font-medium text-gray-300">{fmtDate(prevExam.exam_date)}</span>
                    <ArrowRight className="h-3 w-3 text-gray-600" />
                    <span className="font-semibold text-white">{fmtDate(latestExam.exam_date)}</span>
                  </span>
                ) : (
                  <span className="font-semibold text-white">{fmtDate(latestExam.exam_date)}</span>
                )}
              </div>
              <span className="text-[10px] text-gray-600">
                {entries.length} {entries.length === 1 ? "exame" : "exames"}
              </span>
            </div>

            {/* Botão importar novo exame */}
            {!prevExam && (
              <Link
                href="/medications/exams"
                className="flex items-center gap-3 rounded-2xl border border-dashed border-accent-blue/40 bg-accent-blue/5 px-4 py-3 active:scale-[0.98] transition-transform"
              >
                <Plus className="h-4 w-4 shrink-0 text-accent-blue" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-accent-blue">Importar exame de maio</p>
                  <p className="text-[11px] text-gray-500">Upload do PDF → IA extrai todos os marcadores</p>
                </div>
                <span className="text-xs text-gray-600">›</span>
              </Link>
            )}

            {/* Análise por IA */}
            <ExamAnalysisCard
              examDate={latestExam.exam_date}
              analysis={displayAnalysis}
              analyzing={analyzing}
              hasPrevExam={!!prevExam}
              onAnalyze={() => {
                setAnalysisOverride(undefined);
                runAnalysis(latestExam.id);
              }}
            />

            {/* Tabela de tendências — mostra todos os marcadores com histórico */}
            {timelines.length > 0 && (
              <div className="space-y-2">
                <p className="px-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Evolução por marcador
                </p>
                <LabTrendTable timelines={timelines} />
              </div>
            )}
          </div>
        )
      )}

      <p className="pb-2 text-center text-[11px] text-gray-600">
        Registre peso e medidas regularmente para acompanhar a evolução.
      </p>
    </div>
  );
}
