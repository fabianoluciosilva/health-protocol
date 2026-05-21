"use client";

import { RefreshCw, Sparkles, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { ExamAnalysis } from "@/lib/supabase/types";

interface Props {
  examDate: string;
  analysis: ExamAnalysis | null;
  analyzing: boolean;
  onAnalyze: () => void;
  hasPrevExam?: boolean;
}

const OVERALL_CONFIG = {
  bom: {
    label: "Resultados bons",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/30",
    icon: CheckCircle,
  },
  atencao: {
    label: "Requer atenção",
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/30",
    icon: AlertTriangle,
  },
  critico: {
    label: "Atenção médica indicada",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
    icon: AlertTriangle,
  },
};

function fmt(v: number) {
  return v % 1 === 0 ? String(v) : v.toFixed(2).replace(/\.?0+$/, "");
}

export default function ExamAnalysisCard({ examDate, analysis, analyzing, onAnalyze, hasPrevExam }: Props) {
  if (analyzing) {
    return (
      <div className="rounded-2xl border border-accent-purple/30 bg-accent-purple/5 p-5">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-4 w-4 animate-spin text-accent-purple" />
          <div>
            <p className="text-sm font-semibold text-accent-purple">Analisando exame com IA…</p>
            <p className="text-xs text-gray-500">Comparando resultados e gerando avaliação</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="rounded-2xl border border-dashed border-accent-purple/40 bg-accent-purple/5 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-purple" />
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold text-accent-purple">Análise por IA</p>
              <p className="text-xs text-gray-400">
                Clique para analisar o exame de {new Date(examDate + "T12:00:00").toLocaleDateString("pt-BR")}
                {hasPrevExam ? " e comparar com o anterior." : "."}
              </p>
            </div>
            <button
              onClick={onAnalyze}
              className="flex items-center gap-2 rounded-xl bg-accent-purple px-4 py-2 text-xs font-semibold text-white active:scale-[0.98]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Analisar com IA
            </button>
          </div>
        </div>
        {!hasPrevExam && (
          <div className="flex items-center justify-between rounded-xl bg-bg-elevated px-3 py-2.5">
            <p className="text-xs text-gray-500">Importar novo exame para comparação</p>
            <Link
              href="/medications/exams"
              className="flex items-center gap-1 rounded-lg bg-accent-purple/20 px-3 py-1.5 text-xs font-semibold text-accent-purple active:scale-95"
            >
              <Plus className="h-3 w-3" />
              Importar
            </Link>
          </div>
        )}
      </div>
    );
  }

  const cfg = OVERALL_CONFIG[analysis.overall];
  const Icon = cfg.icon;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className={cn("flex items-start gap-3 rounded-2xl border p-4", cfg.bg)}>
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", cfg.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-sm font-bold", cfg.color)}>{cfg.label}</span>
            <span className="text-[10px] text-gray-500">
              Exame de {new Date(examDate + "T12:00:00").toLocaleDateString("pt-BR")}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-gray-300">{analysis.summary}</p>
        </div>
        <button
          onClick={onAnalyze}
          title="Re-analisar"
          className="shrink-0 rounded-lg p-1.5 text-gray-600 active:bg-white/10"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Críticos */}
      {analysis.criticos.length > 0 && (
        <section className="rounded-2xl bg-bg-card p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400">
            Marcadores fora do padrão
          </h3>
          <div className="space-y-2">
            {analysis.criticos.map((c) => (
              <div key={c.marker} className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white">{c.marker}</span>
                  <span className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                    c.status === "high" ? "bg-red-500/20 text-red-300" : "bg-blue-500/20 text-blue-300"
                  )}>
                    {fmt(c.valor)} {c.unidade} · {c.status === "high" ? "ALTO" : "BAIXO"}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">{c.explicacao}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Piorou */}
      {analysis.piorou.length > 0 && (
        <section className="rounded-2xl bg-bg-card p-4 space-y-2">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <TrendingUp className="h-3.5 w-3.5 text-red-400" />
            Piorou vs exame anterior
          </h3>
          <div className="space-y-1.5">
            {analysis.piorou.map((d) => (
              <div key={d.marker} className="flex items-center justify-between gap-2 rounded-xl bg-amber-400/5 px-3 py-2">
                <span className="text-sm text-white">{d.marker}</span>
                <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                  <span>{fmt(d.anterior)}</span>
                  <span className="text-red-400">→ {fmt(d.atual)} {d.unidade}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Melhorou */}
      {analysis.melhorou.length > 0 && (
        <section className="rounded-2xl bg-bg-card p-4 space-y-2">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <TrendingDown className="h-3.5 w-3.5 rotate-180 text-emerald-400" />
            Melhorou vs exame anterior
          </h3>
          <div className="space-y-1.5">
            {analysis.melhorou.map((d) => (
              <div key={d.marker} className="flex items-center justify-between gap-2 rounded-xl bg-emerald-400/5 px-3 py-2">
                <span className="text-sm text-white">{d.marker}</span>
                <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                  <span>{fmt(d.anterior)}</span>
                  <span className="text-emerald-400">→ {fmt(d.atual)} {d.unidade}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recomendações */}
      {analysis.recomendacoes.length > 0 && (
        <section className="rounded-2xl bg-bg-card p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-blue">
            Recomendações
          </h3>
          <ul className="space-y-1.5">
            {analysis.recomendacoes.map((r, i) => (
              <li key={i} className="flex gap-2 text-xs text-gray-300 leading-relaxed">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue mt-1.5" />
                {r}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Normais */}
      {analysis.normais.length > 0 && (
        <details className="rounded-2xl bg-bg-card p-4">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-gray-500 select-none">
            Dentro da faixa normal ({analysis.normais.length})
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            {analysis.normais.join(" · ")}
          </p>
        </details>
      )}
    </div>
  );
}
