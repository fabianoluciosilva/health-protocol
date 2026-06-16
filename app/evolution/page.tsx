"use client";

import { useCallback, useMemo, useState } from "react";
import { TrendingUp, Scale, Ruler, FlaskConical, User, ArrowRight, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { useBodyWeightLogs, useBodyMeasurements } from "@/hooks/useBodyMetrics";
import { useExamHistory } from "@/hooks/useExamHistory";
import { useProfile } from "@/hooks/useProfile";
import { calculateProfile } from "@/lib/utils/profile";
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

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtShort(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

export default function EvolutionPage() {
  const [tab, setTab] = useState<Tab>("weight");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisOverride, setAnalysisOverride] = useState<ExamAnalysis | null | undefined>(
    undefined
  );

  const { profile, reload: reloadProfile } = useProfile();
  const { logs: weightLogs, loading: loadingWeight, addLog: addWeight, removeLog: removeWeight } = useBodyWeightLogs(30);
  const { logs: measurements, loading: loadingMeasures, addMeasurement, removeLog: removeMeasure } = useBodyMeasurements(10);
  const { entries, timelines, loading: loadingLabs } = useExamHistory();

  const latestExam = entries[0]?.exam ?? null;
  const prevExam = entries[1]?.exam ?? null;

  // Peso de referência = registro mais recente; fallback para o peso do perfil
  const latestWeight = weightLogs.length > 0 ? Number(weightLogs[0].weight_kg) : (profile ? Number(profile.weight_kg) : null);
  const metrics = useMemo(() => {
    if (!profile || latestWeight == null) return null;
    return calculateProfile(latestWeight, Number(profile.height_cm), new Date(profile.birth_date));
  }, [profile, latestWeight]);

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

  // ── Formulário de peso ──────────────────────────────────────────────
  const [weightInput, setWeightInput] = useState("");
  const [weightDate, setWeightDate] = useState(todayISO());
  const [savingW, setSavingW] = useState(false);

  const handleAddWeight = async () => {
    const w = parseFloat(weightInput.replace(",", "."));
    if (!w || w < 30 || w > 400) return;
    setSavingW(true);
    await addWeight(w, weightDate);
    await reloadProfile();
    setWeightInput(""); setSavingW(false);
  };

  // ── Formulário de medidas ───────────────────────────────────────────
  const [showMeasureForm, setShowMeasureForm] = useState(false);
  const [mDate, setMDate] = useState(todayISO());
  const [mWaist, setMWaist] = useState("");
  const [mChest, setMChest] = useState("");
  const [mHips, setMHips] = useState("");
  const [mArm, setMArm] = useState("");
  const [mThigh, setMThigh] = useState("");
  const [mNeck, setMNeck] = useState("");
  const [savingM, setSavingM] = useState(false);

  const num = (v: string) => (v.trim() ? Number(v.replace(",", ".")) : null);

  const handleAddMeasure = async () => {
    if (!mWaist && !mChest && !mHips && !mArm && !mThigh && !mNeck) return;
    setSavingM(true);
    await addMeasurement({
      log_date: mDate,
      waist_cm: num(mWaist),
      chest_cm: num(mChest),
      hips_cm: num(mHips),
      arm_cm: num(mArm),
      thigh_cm: num(mThigh),
      neck_cm: num(mNeck),
      notes: null,
    });
    setMWaist(""); setMChest(""); setMHips(""); setMArm(""); setMThigh(""); setMNeck("");
    setShowMeasureForm(false); setSavingM(false);
  };

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

      {/* Informe sempre recalculado com base no peso mais recente */}
      {metrics && (
        <section className="space-y-3 rounded-2xl border border-accent-blue/20 bg-accent-blue/5 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Informe atual</h2>
            <span className="text-[10px] text-gray-500">
              recalculado · {weightLogs.length > 0 ? fmtShort(weightLogs[0].log_date) : "perfil"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Metric label="Idade" value={`${metrics.age} anos`} />
            <Metric label="Peso atual" value={`${latestWeight!.toLocaleString("pt-BR")} kg`} />
            <Metric label="Altura" value={`${(Number(profile!.height_cm) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} m`} />
            <Metric label="IMC" value={metrics.bmi.toLocaleString("pt-BR", { minimumFractionDigits: 1 })} hint={metrics.bmiLabel} />
            <Metric label="TMB" value={`${metrics.bmr.toLocaleString("pt-BR")} kcal`} hint="basal" />
            <Metric label="TDEE" value={`${metrics.tdee.toLocaleString("pt-BR")} kcal`} hint="moderado" />
            <Metric label="Meta calórica" value={`${metrics.targetCalories.toLocaleString("pt-BR")} kcal`} hint="déficit 500" />
            <Metric label="Proteína" value={`${metrics.proteinGoal} g`} hint={`alvo ${metrics.targetWeight} kg`} />
          </div>
        </section>
      )}

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
        <div className="space-y-3">
          {/* Cadastro de novo peso */}
          <div className="flex gap-2">
            <input type="date" value={weightDate} onChange={(e) => setWeightDate(e.target.value)}
              className="w-36 rounded-xl bg-bg-card px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-accent-blue" />
            <input type="number" inputMode="decimal" step="0.1" placeholder="Ex: 128.5"
              value={weightInput} onChange={(e) => setWeightInput(e.target.value)}
              className="flex-1 rounded-xl bg-bg-card px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue" />
            <button onClick={handleAddWeight} disabled={savingW || !weightInput}
              className="rounded-xl bg-accent-blue px-4 py-2 text-xs font-semibold text-white disabled:opacity-40 active:scale-95">
              {savingW ? "…" : "OK"}
            </button>
          </div>
          <p className="px-1 text-[11px] text-gray-600">
            O peso mais recente recalcula automaticamente o informe acima. Mesma data substitui o registro.
          </p>

          {loadingWeight ? (
            <div className="h-48 animate-pulse rounded-2xl bg-bg-card" />
          ) : (
            <WeightChart logs={weightLogs} />
          )}

          {/* Lista para remover registros */}
          {!loadingWeight && weightLogs.length > 0 && (
            <div className="space-y-1">
              {weightLogs.slice(0, 8).map((l) => (
                <div key={l.id} className="flex items-center gap-3 rounded-xl bg-bg-card px-4 py-2">
                  <span className="flex-1 text-xs text-gray-400">{fmtShort(l.log_date)}</span>
                  <span className="text-sm font-bold text-white">{Number(l.weight_kg).toFixed(1)} kg</span>
                  <button onClick={() => removeWeight(l.id)} className="rounded-lg p-1 text-gray-600 active:bg-bg-elevated active:text-red-400">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "measurements" && (
        <div className="space-y-3">
          {/* Cadastro de medidas */}
          <button onClick={() => setShowMeasureForm((v) => !v)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-700 py-3 text-sm font-medium text-gray-400 active:bg-bg-card">
            <Plus className="h-4 w-4" /> Registrar medidas
          </button>

          {showMeasureForm && (
            <div className="space-y-3 rounded-2xl bg-bg-card p-4">
              <input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)}
                className="w-full rounded-xl bg-bg-elevated px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-accent-blue" />
              <div className="grid grid-cols-2 gap-2">
                {([["Cintura", mWaist, setMWaist], ["Peito", mChest, setMChest], ["Quadril", mHips, setMHips], ["Braço", mArm, setMArm], ["Coxa", mThigh, setMThigh], ["Pescoço", mNeck, setMNeck]] as const).map(([label, val, setter]) => (
                  <label key={label} className="block">
                    <span className="mb-1 block text-[10px] uppercase text-gray-500">{label}</span>
                    <input type="number" inputMode="decimal" step="0.1" placeholder="cm" value={val}
                      onChange={(e) => setter(e.target.value)}
                      className="w-full rounded-lg bg-bg-elevated px-3 py-1.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue" />
                  </label>
                ))}
              </div>
              <p className="text-[11px] text-gray-600">Mesma data substitui o registro; datas diferentes mantêm o histórico para o comparativo.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowMeasureForm(false)} className="flex-1 rounded-xl bg-bg-elevated py-2 text-xs text-gray-400 active:scale-95">Cancelar</button>
                <button onClick={handleAddMeasure} disabled={savingM}
                  className="flex-1 rounded-xl bg-accent-blue py-2 text-xs font-semibold text-white disabled:opacity-40 active:scale-95">
                  {savingM ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </div>
          )}

          {loadingMeasures ? (
            <div className="h-48 animate-pulse rounded-2xl bg-bg-card" />
          ) : (
            <MeasurementsTable logs={measurements} />
          )}

          {/* Lista para remover registros */}
          {!loadingMeasures && measurements.length > 0 && (
            <div className="space-y-1">
              {measurements.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl bg-bg-card px-4 py-2">
                  <span className="flex-1 text-xs text-gray-400">{fmtShort(m.log_date)}</span>
                  <button onClick={() => removeMeasure(m.id)} className="rounded-lg p-1 text-gray-600 active:bg-bg-elevated active:text-red-400">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
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
                  <p className="text-xs font-semibold text-accent-blue">Importar novo exame</p>
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

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-bg-elevated px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-white">{value}</div>
      {hint && <div className="text-[10px] text-gray-500">{hint}</div>}
    </div>
  );
}
