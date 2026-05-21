"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Trash2, Upload, AlertTriangle, TrendingDown, Plus, FileText, Dumbbell, Salad, FlaskConical, Sparkles, RefreshCw, LogOut, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useAIGenerate } from "@/hooks/useAIGenerate";
import { useDocuments, daysRemaining } from "@/hooks/useDocuments";
import { useBodyWeightLogs, useBodyMeasurements } from "@/hooks/useBodyMetrics";
import { useMedications } from "@/hooks/useMedications";
import { calculateProfile } from "@/lib/utils/profile";
import { cn } from "@/lib/utils/cn";
import type { ProfileDocument, Medication, Frequency } from "@/lib/supabase/types";

const TABS = [
  { key: "dados",    label: "Dados" },
  { key: "meds",     label: "Meds" },
  { key: "docs",     label: "Docs" },
  { key: "evolucao", label: "Evolução" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const FREQ_LABELS: Record<Frequency, string> = {
  daily: "Diário",
  weekly: "Semanal",
  every_10_days: "A cada 10 dias",
};
const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MED_COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#f97316", "#ef4444", "#06b6d4"];

function daysUntilNext(lastAt: string | null): number {
  if (!lastAt) return 0;
  const next = new Date(lastAt);
  next.setMonth(next.getMonth() + 1);
  return Math.max(0, Math.ceil((next.getTime() - Date.now()) / 86400000));
}

// ─── helpers ────────────────────────────────────────────────────────────────

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d.toString().padStart(2, "0")}/${m.toString().padStart(2, "0")}/${y}`;
}

// ─── Sparkline SVG ──────────────────────────────────────────────────────────

function SimpleSparkline({ values, dates }: { values: number[]; dates: string[] }) {
  if (values.length < 2) return null;
  const W = 300, H = 54, pT = 8, pB = 16, pL = 4, pR = 4;
  const cW = W - pL - pR, cH = H - pT - pB;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const toX = (i: number) => pL + (i / (values.length - 1)) * cW;
  const toY = (v: number) => pT + cH - ((v - min) / range) * cH;
  const pts = values.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 54 }}>
      <polyline points={pts} fill="none" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5" strokeLinejoin="round" />
      {values.map((v, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(v)} r="3" fill="#3b82f6" />
          <text x={toX(i)} y={toY(v) - 5} textAnchor="middle" fontSize="7" fill="#60a5fa" fontWeight="700">
            {v % 1 === 0 ? v : v.toFixed(1)}
          </text>
          <text x={toX(i)} y={H - 3} textAnchor="middle" fontSize="5.5" fill="rgba(156,163,175,0.7)">
            {fmtDate(dates[i]).slice(0, 5)}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Tab: Dados ──────────────────────────────────────────────────────────────

function DadosTab() {
  const { profile, loading, update, reload } = useProfile();
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [wake, setWake] = useState("");
  const [sleep, setSleep] = useState("");
  const [foodRestrictions, setFoodRestrictions] = useState("");
  const [mobilityRestrictions, setMobilityRestrictions] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const nutritionAI = useAIGenerate("nutrition");
  const workoutAI = useAIGenerate("workout");

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setWeight(String(profile.weight_kg));
    setHeight(String(profile.height_cm));
    setBirthDate(profile.birth_date);
    setWake(profile.wake_time.slice(0, 5));
    setSleep(profile.sleep_time.slice(0, 5));
    setFoodRestrictions(profile.food_restrictions ?? "");
    setMobilityRestrictions(profile.mobility_restrictions ?? "");
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    await update({
      name,
      weight_kg: Number(weight),
      height_cm: Number(height),
      birth_date: birthDate,
      wake_time: wake.length === 5 ? `${wake}:00` : wake,
      sleep_time: sleep.length === 5 ? `${sleep}:00` : sleep,
      food_restrictions: foodRestrictions.trim() || null,
      mobility_restrictions: mobilityRestrictions.trim() || null,
    });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 1500);
  };

  if (loading) return <div className="h-24 animate-pulse rounded-2xl bg-bg-card" />;
  if (!profile) return (
    <div className="space-y-3 rounded-2xl bg-bg-card p-6 text-center">
      <p className="text-sm text-gray-400">Perfil não encontrado.</p>
      <button
        onClick={reload}
        className="rounded-xl bg-accent-blue px-4 py-2 text-xs font-semibold text-white active:scale-95"
      >
        Tentar novamente
      </button>
    </div>
  );

  const metrics = calculateProfile(Number(weight) || 0, Number(height) || 0, new Date(birthDate || profile.birth_date));

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl bg-bg-card p-4">
        <Field label="Nome" value={name} onChange={setName} />
        <Field label="Data de nascimento" type="date" value={birthDate} onChange={setBirthDate} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Peso (kg)" type="number" value={weight} onChange={setWeight} step="0.1" />
          <Field label="Altura (cm)" type="number" value={height} onChange={setHeight} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Acorda" type="time" value={wake} onChange={setWake} />
          <Field label="Dorme" type="time" value={sleep} onChange={setSleep} />
        </div>
        <button onClick={handleSave} disabled={saving} className="w-full rounded-xl bg-accent-blue py-2.5 text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-60">
          {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar perfil"}
        </button>
      </section>

      {/* Restrições — usadas como contexto pela IA */}
      <section className="space-y-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
        <div className="flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <h2 className="text-sm font-semibold text-amber-300">Restrições (contexto para IA)</h2>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400">Restrições Alimentares</label>
          <textarea
            value={foodRestrictions}
            onChange={(e) => setFoodRestrictions(e.target.value)}
            placeholder="Ex: intolerância à lactose, alergia a glúten, vegetariano, não come frango..."
            rows={3}
            className="w-full rounded-xl bg-bg-elevated px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-amber-400 resize-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400">Restrições de Mobilidade / Lesões</label>
          <textarea
            value={mobilityRestrictions}
            onChange={(e) => setMobilityRestrictions(e.target.value)}
            placeholder="Ex: problema no joelho direito, hérnia de disco L4-L5, cirurgia no ombro esquerdo..."
            rows={3}
            className="w-full rounded-xl bg-bg-elevated px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-amber-400 resize-none"
          />
        </div>
        <p className="text-xs text-gray-500">Essas informações são usadas pela IA para personalizar sua dieta e treino.</p>
        <button onClick={handleSave} disabled={saving} className="w-full rounded-xl bg-amber-500/80 py-2.5 text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-60">
          {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar restrições"}
        </button>
      </section>

      {/* Geração por IA — limite 1× ao mês */}
      {profile && (
        <section className="space-y-3 rounded-2xl border border-accent-purple/20 bg-accent-purple/5 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-purple" />
            <h2 className="text-sm font-semibold text-accent-purple">Geração por IA</h2>
            <span className="ml-auto text-xs text-gray-600">1× ao mês</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-bg-elevated p-2 text-center">
              <div className="text-gray-500">Última dieta</div>
              <div className="font-medium text-white">
                {profile.last_diet_generated_at
                  ? new Date(profile.last_diet_generated_at).toLocaleDateString("pt-BR")
                  : "Não gerada"}
              </div>
            </div>
            <div className="rounded-xl bg-bg-elevated p-2 text-center">
              <div className="text-gray-500">Último treino</div>
              <div className="font-medium text-white">
                {profile.last_workout_generated_at
                  ? new Date(profile.last_workout_generated_at).toLocaleDateString("pt-BR")
                  : "Não gerado"}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {(() => {
              const d = daysUntilNext(profile.last_diet_generated_at);
              return (
                <button
                  onClick={async () => { await nutritionAI.generate(profile); reload(); }}
                  disabled={nutritionAI.generating || d > 0}
                  className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl bg-accent-purple/80 py-2.5 text-xs font-semibold text-white disabled:opacity-40 active:scale-[0.98]"
                >
                  {nutritionAI.generating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {nutritionAI.generating ? "Gerando…" : d > 0 ? `Dieta em ${d}d` : "Nova Dieta"}
                </button>
              );
            })()}
            {(() => {
              const d = daysUntilNext(profile.last_workout_generated_at);
              return (
                <button
                  onClick={async () => { await workoutAI.generate(profile); reload(); }}
                  disabled={workoutAI.generating || d > 0}
                  className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl bg-accent-purple/80 py-2.5 text-xs font-semibold text-white disabled:opacity-40 active:scale-[0.98]"
                >
                  {workoutAI.generating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {workoutAI.generating ? "Gerando…" : d > 0 ? `Treino em ${d}d` : "Novo Treino"}
                </button>
              );
            })()}
          </div>

          {(nutritionAI.result || workoutAI.result) && (
            <div className="max-h-60 overflow-y-auto rounded-xl bg-bg-elevated p-3 text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
              {nutritionAI.result ?? workoutAI.result}
            </div>
          )}
          {(nutritionAI.error || workoutAI.error) && (
            <p className="text-xs text-red-400">{nutritionAI.error ?? workoutAI.error}</p>
          )}
        </section>
      )}

      <section className="rounded-2xl bg-bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-300">Cálculos automáticos</h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Metric label="Idade" value={`${metrics.age} anos`} />
          <Metric label="IMC" value={metrics.bmi.toLocaleString("pt-BR", { minimumFractionDigits: 1 })} hint={metrics.bmiLabel} />
          <Metric label="TMB" value={`${metrics.bmr.toLocaleString("pt-BR")} kcal`} hint="Mifflin-St Jeor" />
          <Metric label="TDEE" value={`${metrics.tdee.toLocaleString("pt-BR")} kcal`} hint="moderadamente ativo" />
          <Metric label="Meta calórica" value={`${metrics.targetCalories.toLocaleString("pt-BR")} kcal`} hint="déficit 500 kcal" />
          <Metric label="Proteína" value={`${metrics.proteinGoal} g`} hint={`2g x ${metrics.targetWeight}kg alvo`} />
        </div>
      </section>
    </div>
  );
}

// ─── Tab: Medicamentos ───────────────────────────────────────────────────────

function MedicamentosTab() {
  const { medications, loading, addMedication, updateMedication, removeMedication } = useMedications(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [mName, setMName] = useState("");
  const [mDose, setMDose] = useState("");
  const [mFreq, setMFreq] = useState<Frequency>("daily");
  const [mTime1, setMTime1] = useState("08:00");
  const [mTime2, setMTime2] = useState("");
  const [mWeekDay, setMWeekDay] = useState(0);
  const [mStartDate, setMStartDate] = useState(todayISO());
  const [mColor, setMColor] = useState(MED_COLORS[0]);
  const [mNotes, setMNotes] = useState("");
  const [mActive, setMActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const resetForm = () => {
    setMName(""); setMDose(""); setMFreq("daily"); setMTime1("08:00");
    setMTime2(""); setMWeekDay(0); setMStartDate(todayISO());
    setMColor(MED_COLORS[0]); setMNotes(""); setMActive(true); setEditing(null);
  };

  const openAdd = () => { resetForm(); setShowForm(true); };

  const openEdit = (med: Medication) => {
    setEditing(med);
    setMName(med.name); setMDose(med.dose); setMFreq(med.frequency);
    setMTime1(med.time_1.slice(0, 5));
    setMTime2(med.time_2 ? med.time_2.slice(0, 5) : "");
    setMWeekDay(med.week_day ?? 0);
    setMStartDate(med.start_date ?? todayISO());
    setMColor(med.color); setMNotes(med.notes ?? ""); setMActive(med.active);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!mName.trim() || !mDose.trim()) return;
    setSaving(true);
    const input = {
      name: mName.trim(), dose: mDose.trim(), frequency: mFreq,
      time_1: mTime1.length === 5 ? mTime1 + ":00" : mTime1,
      time_2: mTime2 ? (mTime2.length === 5 ? mTime2 + ":00" : mTime2) : null,
      week_day: mFreq === "weekly" ? mWeekDay : null,
      start_date: mFreq === "every_10_days" ? mStartDate : null,
      color: mColor, notes: mNotes.trim() || null, active: mActive,
    };
    if (editing) await updateMedication(editing.id, input);
    else await addMedication(input);
    setSaving(false); setShowForm(false); resetForm();
  };

  const fmtFreq = (med: Medication) =>
    med.frequency === "weekly"
      ? `${FREQ_LABELS.weekly} — ${DAY_LABELS[med.week_day ?? 0]}`
      : FREQ_LABELS[med.frequency];

  const fmtTime = (med: Medication) => {
    const t1 = med.time_1.slice(0, 5);
    const t2 = med.time_2 ? " · " + med.time_2.slice(0, 5) : "";
    return t1 + t2;
  };

  const inputCls = "mt-1 w-full rounded-xl bg-bg-elevated px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-accent-blue";

  if (loading) return <div className="h-24 animate-pulse rounded-2xl bg-bg-card" />;

  return (
    <div className="space-y-3">
      {/* Delete confirm */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-bg-card p-6 space-y-4">
            <h3 className="text-base font-semibold text-white">Remover medicamento?</h3>
            <p className="text-sm text-gray-400">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)}
                className="flex-1 rounded-xl bg-bg-elevated py-2.5 text-sm text-gray-400 active:scale-95">Cancelar</button>
              <button onClick={async () => { await removeMedication(confirmDel); setConfirmDel(null); }}
                className="flex-1 rounded-xl bg-red-500/20 py-2.5 text-sm font-semibold text-red-400 active:scale-95">Remover</button>
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-sm rounded-2xl bg-bg-card p-5 space-y-3">
            <h3 className="text-base font-semibold text-white">{editing ? "Editar" : "Novo"} medicamento</h3>

            <label className="block">
              <span className="text-xs text-gray-500">Nome</span>
              <input type="text" value={mName} onChange={(e) => setMName(e.target.value)}
                placeholder="Ex: Anastrozol" className={inputCls} />
            </label>

            <label className="block">
              <span className="text-xs text-gray-500">Dose</span>
              <input type="text" value={mDose} onChange={(e) => setMDose(e.target.value)}
                placeholder="Ex: 25mg" className={inputCls} />
            </label>

            <label className="block">
              <span className="text-xs text-gray-500">Frequência</span>
              <select value={mFreq} onChange={(e) => setMFreq(e.target.value as Frequency)} className={inputCls}>
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="every_10_days">A cada 10 dias</option>
              </select>
            </label>

            {mFreq === "weekly" && (
              <label className="block">
                <span className="text-xs text-gray-500">Dia da semana</span>
                <select value={mWeekDay} onChange={(e) => setMWeekDay(Number(e.target.value))} className={inputCls}>
                  {DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </label>
            )}

            {mFreq === "every_10_days" && (
              <label className="block">
                <span className="text-xs text-gray-500">Data de início / última dose</span>
                <input type="date" value={mStartDate} onChange={(e) => setMStartDate(e.target.value)} className={inputCls} />
              </label>
            )}

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs text-gray-500">Horário 1</span>
                <input type="time" value={mTime1} onChange={(e) => setMTime1(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Horário 2 (opcional)</span>
                <input type="time" value={mTime2} onChange={(e) => setMTime2(e.target.value)} className={inputCls} />
              </label>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-gray-500">Cor</span>
              <div className="flex gap-2.5 pt-0.5">
                {MED_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setMColor(c)}
                    className="h-7 w-7 rounded-full transition-all"
                    style={{ backgroundColor: c, outline: mColor === c ? `2px solid ${c}` : "none", outlineOffset: "2px" }} />
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-xs text-gray-500">Notas (opcional)</span>
              <input type="text" value={mNotes} onChange={(e) => setMNotes(e.target.value)}
                placeholder="Observações" className={inputCls} />
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={mActive} onChange={(e) => setMActive(e.target.checked)}
                className="h-4 w-4 rounded accent-accent-blue" />
              <span className="text-sm text-gray-300">Medicamento ativo</span>
            </label>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                className="flex-1 rounded-xl bg-bg-elevated py-2.5 text-sm text-gray-400 active:scale-95">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving || !mName.trim() || !mDose.trim()}
                className="flex-1 rounded-xl bg-accent-blue py-2.5 text-sm font-semibold text-white disabled:opacity-50 active:scale-95">
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {medications.length === 0 ? (
        <div className="rounded-2xl bg-bg-card p-6 text-center text-sm text-gray-400">
          Nenhum medicamento cadastrado.
        </div>
      ) : (
        <div className="space-y-2">
          {medications.map((med) => (
            <div key={med.id} className={cn("flex items-center gap-3 rounded-2xl bg-bg-card p-4", !med.active && "opacity-40")}>
              <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: med.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">
                  {med.name} <span className="text-xs text-gray-500">{med.dose}</span>
                  {!med.active && <span className="ml-1 text-xs text-gray-600">(inativo)</span>}
                </div>
                <div className="text-xs text-gray-500">{fmtFreq(med)} · {fmtTime(med)}</div>
                {med.notes && <div className="truncate text-xs text-gray-600">{med.notes}</div>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => openEdit(med)}
                  className="rounded-xl p-2 text-gray-600 active:bg-bg-elevated active:text-accent-blue">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setConfirmDel(med.id)}
                  className="rounded-xl p-2 text-gray-600 active:bg-bg-elevated active:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={openAdd}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-700 py-3 text-sm text-gray-500 active:bg-bg-card">
        <Plus className="h-4 w-4" />
        Adicionar medicamento
      </button>
    </div>
  );
}

// ─── Tab: Documentos ─────────────────────────────────────────────────────────

const DOC_TYPES: { key: ProfileDocument["doc_type"]; label: string; icon: React.ComponentType<{className?:string}> }[] = [
  { key: "exam",           label: "Resultado de exame",  icon: FlaskConical },
  { key: "nutrition_plan", label: "Cardápio do nutricionista", icon: Salad },
  { key: "workout_plan",   label: "Série do professor",  icon: Dumbbell },
  { key: "other",          label: "Outro documento",     icon: FileText },
];

function DocsTab() {
  const { docs, loading, uploadAndSave, removeDoc } = useDocuments();
  const [showForm, setShowForm] = useState(false);
  const [docType, setDocType] = useState<ProfileDocument["doc_type"]>("workout_plan");
  const [title, setTitle] = useState("");
  const [validFrom, setValidFrom] = useState(todayISO());
  const [validDays, setValidDays] = useState("30");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const needsValidity = docType === "workout_plan";

  const handleSave = async () => {
    if (!file || !title.trim()) return;
    setSaving(true);
    await uploadAndSave(file, docType, title.trim(), needsValidity ? validFrom : undefined, needsValidity ? Number(validDays) : undefined);
    setTitle(""); setFile(null); setShowForm(false); setSaving(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Alert for expiring workout plans
  const workoutAlerts = docs.filter(
    (d) => d.doc_type === "workout_plan" && d.valid_from && d.valid_days
  ).map((d) => ({
    doc: d,
    days: daysRemaining(d.valid_from!, d.valid_days!),
  }));

  return (
    <div className="space-y-4">
      {/* Workout plan alerts */}
      {workoutAlerts.map(({ doc, days }) => (
        <div
          key={doc.id}
          className={cn(
            "flex items-start gap-3 rounded-2xl border p-4",
            days <= 0
              ? "border-red-500/40 bg-red-500/10"
              : days <= 7
              ? "border-amber-400/40 bg-amber-400/10"
              : "border-blue-500/30 bg-blue-500/10"
          )}
        >
          <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", days <= 0 ? "text-red-400" : days <= 7 ? "text-amber-400" : "text-blue-400")} />
          <div>
            <p className="text-sm font-semibold text-white">{doc.title}</p>
            <p className={cn("text-xs", days <= 0 ? "text-red-300" : days <= 7 ? "text-amber-300" : "text-blue-300")}>
              {days <= 0 ? "Série vencida — hora de trocar!" : days === 1 ? "Último dia da série!" : `${days} dias restantes na série`}
            </p>
          </div>
        </div>
      ))}

      {/* Add button */}
      <button
        onClick={() => setShowForm((v) => !v)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-600 py-3 text-sm font-medium text-gray-400 active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" /> Anexar documento
      </button>

      {/* Upload form */}
      {showForm && (
        <div className="space-y-3 rounded-2xl bg-bg-card p-4">
          {/* Type picker */}
          <div className="grid grid-cols-2 gap-2">
            {DOC_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setDocType(t.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                    docType === t.key ? "bg-accent-blue text-white" : "bg-bg-elevated text-gray-400"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            placeholder="Título (ex: Cardápio maio 2026)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl bg-bg-elevated px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue"
          />

          {needsValidity && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-[11px] text-gray-500">Início da série</label>
                <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)}
                  className="w-full rounded-xl bg-bg-elevated px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-accent-blue" />
              </div>
              <div className="w-24">
                <label className="mb-1 block text-[11px] text-gray-500">Dias</label>
                <input type="number" value={validDays} onChange={(e) => setValidDays(e.target.value)}
                  className="w-full rounded-xl bg-bg-elevated px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-accent-blue" />
              </div>
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-bg-elevated px-3 py-2.5 text-sm text-gray-300 active:scale-[0.98]">
            <Upload className="h-4 w-4 text-accent-blue" />
            {file ? file.name : "Selecionar arquivo (PDF, imagem)"}
            <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>

          <div className="flex gap-2">
            <button onClick={() => { setShowForm(false); setFile(null); }} className="flex-1 rounded-xl bg-bg-elevated py-2 text-xs text-gray-400 active:scale-95">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving || !file || !title.trim()}
              className="flex-1 rounded-xl bg-accent-blue py-2 text-xs font-semibold text-white disabled:opacity-40 active:scale-95">
              {saving ? "Enviando…" : "Salvar"}
            </button>
          </div>
        </div>
      )}

      {/* Documents list */}
      {!loading && docs.length > 0 && (
        <div className="space-y-2">
          {docs.map((doc) => {
            const meta = DOC_TYPES.find((t) => t.key === doc.doc_type);
            const Icon = meta?.icon ?? FileText;
            const days = doc.valid_from && doc.valid_days ? daysRemaining(doc.valid_from, doc.valid_days) : null;
            return (
              <div key={doc.id} className="flex items-center gap-3 rounded-2xl bg-bg-card px-4 py-3">
                <Icon className="h-5 w-5 shrink-0 text-gray-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{doc.title}</p>
                  <p className="text-[11px] text-gray-500">
                    {meta?.label}
                    {days !== null && (
                      <span className={cn("ml-2", days <= 0 ? "text-red-400" : days <= 7 ? "text-amber-400" : "text-gray-500")}>
                        · {days <= 0 ? "vencida" : `${days}d restantes`}
                      </span>
                    )}
                  </p>
                </div>
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="rounded-lg px-2 py-1 text-xs text-accent-blue active:bg-bg-elevated">
                    Abrir
                  </a>
                )}
                <button onClick={() => removeDoc(doc.id, doc.file_url)} className="rounded-lg p-1.5 text-gray-600 active:bg-bg-elevated">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!loading && docs.length === 0 && !showForm && (
        <p className="text-center text-sm text-gray-500">Nenhum documento anexado.</p>
      )}
    </div>
  );
}

// ─── Tab: Evolução ────────────────────────────────────────────────────────────

function EvolucaoTab() {
  const { logs: weightLogs, loading: loadingW, addLog: addWeight, removeLog: removeWeight } = useBodyWeightLogs(30);
  const { logs: measures, loading: loadingM, addMeasurement, removeLog: removeMeasure } = useBodyMeasurements(10);

  const [weightInput, setWeightInput] = useState("");
  const [weightDate, setWeightDate] = useState(todayISO());
  const [savingW, setSavingW] = useState(false);
  const [showMeasureForm, setShowMeasureForm] = useState(false);
  const [mDate, setMDate] = useState(todayISO());
  const [mWaist, setMWaist] = useState("");
  const [mChest, setMChest] = useState("");
  const [mHips, setMHips] = useState("");
  const [mArm, setMArm] = useState("");
  const [mThigh, setMThigh] = useState("");
  const [savingM, setSavingM] = useState(false);

  const handleAddWeight = async () => {
    const w = parseFloat(weightInput);
    if (!w || w < 30 || w > 300) return;
    setSavingW(true);
    await addWeight(w, weightDate);
    setWeightInput(""); setSavingW(false);
  };

  const handleAddMeasure = async () => {
    setSavingM(true);
    await addMeasurement({
      log_date: mDate,
      waist_cm: mWaist ? Number(mWaist) : null,
      chest_cm: mChest ? Number(mChest) : null,
      hips_cm: mHips ? Number(mHips) : null,
      arm_cm: mArm ? Number(mArm) : null,
      thigh_cm: mThigh ? Number(mThigh) : null,
      neck_cm: null,
      notes: null,
    });
    setMWaist(""); setMChest(""); setMHips(""); setMArm(""); setMThigh("");
    setShowMeasureForm(false); setSavingM(false);
  };

  const chronoWeights = useMemo(() => [...weightLogs].reverse(), [weightLogs]);

  // delta from first to last
  const weightDelta = chronoWeights.length >= 2
    ? (chronoWeights[chronoWeights.length - 1].weight_kg - chronoWeights[0].weight_kg)
    : null;

  return (
    <div className="space-y-6">
      {/* Weight section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-gray-300">Peso corporal (kg)</h2>
          {weightDelta !== null && (
            <span className={cn("flex items-center gap-1 text-xs font-medium", weightDelta < 0 ? "text-emerald-400" : "text-amber-400")}>
              <TrendingDown className={cn("h-3.5 w-3.5", weightDelta >= 0 && "rotate-180")} />
              {weightDelta > 0 ? "+" : ""}{weightDelta.toFixed(1)} kg
            </span>
          )}
        </div>

        {chronoWeights.length >= 2 && (
          <div className="rounded-2xl bg-bg-card p-3">
            <SimpleSparkline
              values={chronoWeights.map((l) => Number(l.weight_kg))}
              dates={chronoWeights.map((l) => l.log_date)}
            />
          </div>
        )}

        {/* Add weight */}
        <div className="flex gap-2">
          <input type="date" value={weightDate} onChange={(e) => setWeightDate(e.target.value)}
            className="w-36 rounded-xl bg-bg-card px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-accent-blue" />
          <input type="number" step="0.1" placeholder="Ex: 128.5"
            value={weightInput} onChange={(e) => setWeightInput(e.target.value)}
            className="flex-1 rounded-xl bg-bg-card px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue" />
          <button onClick={handleAddWeight} disabled={savingW || !weightInput}
            className="rounded-xl bg-accent-blue px-4 py-2 text-xs font-semibold text-white disabled:opacity-40 active:scale-95">
            {savingW ? "…" : "OK"}
          </button>
        </div>

        {/* Weight history list */}
        {!loadingW && weightLogs.length > 0 && (
          <div className="space-y-1">
            {weightLogs.slice(0, 7).map((l) => (
              <div key={l.id} className="flex items-center gap-3 rounded-xl bg-bg-card px-4 py-2">
                <span className="flex-1 text-xs text-gray-400">{fmtDate(l.log_date)}</span>
                <span className="text-sm font-bold text-white">{Number(l.weight_kg).toFixed(1)} kg</span>
                <button onClick={() => removeWeight(l.id)} className="rounded-lg p-1 text-gray-600 active:bg-bg-elevated">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Measurements section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-gray-300">Medidas corporais (cm)</h2>
          <button onClick={() => setShowMeasureForm((v) => !v)}
            className="flex items-center gap-1 rounded-xl bg-bg-card px-3 py-1.5 text-xs font-medium text-gray-300 active:scale-95">
            <Plus className="h-3.5 w-3.5" /> Registrar
          </button>
        </div>

        {showMeasureForm && (
          <div className="space-y-3 rounded-2xl bg-bg-card p-4">
            <input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)}
              className="w-full rounded-xl bg-bg-elevated px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-accent-blue" />
            <div className="grid grid-cols-2 gap-2">
              {[["Cintura", mWaist, setMWaist], ["Peito", mChest, setMChest], ["Quadril", mHips, setMHips], ["Braço", mArm, setMArm], ["Coxa", mThigh, setMThigh]].map(([label, val, setter]) => (
                <label key={label as string} className="block">
                  <span className="mb-1 block text-[10px] uppercase text-gray-500">{label as string}</span>
                  <input type="number" step="0.1" placeholder="cm" value={val as string}
                    onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                    className="w-full rounded-lg bg-bg-elevated px-3 py-1.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue" />
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowMeasureForm(false)} className="flex-1 rounded-xl bg-bg-elevated py-2 text-xs text-gray-400 active:scale-95">Cancelar</button>
              <button onClick={handleAddMeasure} disabled={savingM}
                className="flex-1 rounded-xl bg-accent-blue py-2 text-xs font-semibold text-white disabled:opacity-40 active:scale-95">
                {savingM ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        )}

        {!loadingM && measures.length > 0 && (
          <div className="space-y-2">
            {measures.map((m) => (
              <div key={m.id} className="rounded-2xl bg-bg-card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-300">{fmtDate(m.log_date)}</span>
                  <button onClick={() => removeMeasure(m.id)} className="rounded-lg p-1 text-gray-600 active:bg-bg-elevated">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[["Cintura", m.waist_cm], ["Peito", m.chest_cm], ["Quadril", m.hips_cm], ["Braço", m.arm_cm], ["Coxa", m.thigh_cm]].map(([l, v]) =>
                    v != null ? (
                      <div key={l as string} className="rounded-lg bg-bg-elevated px-2 py-1.5 text-center">
                        <div className="text-[10px] text-gray-500">{l as string}</div>
                        <div className="font-semibold text-white">{Number(v).toFixed(1)}</div>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingM && measures.length === 0 && !showMeasureForm && (
          <p className="text-center text-sm text-gray-500">Nenhuma medida registrada.</p>
        )}
      </section>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>("dados");
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="space-y-4 px-4 pt-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Perfil</h1>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-1.5 rounded-xl bg-bg-card px-3 py-2 text-xs font-medium text-gray-400 active:scale-95 disabled:opacity-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          {loggingOut ? "Saindo…" : "Sair"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-bg-card p-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("flex-1 rounded-xl py-2 text-sm font-semibold transition-colors",
              tab === t.key ? "bg-bg-base text-white" : "text-gray-500")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dados"    && <DadosTab />}
      {tab === "meds"     && <MedicamentosTab />}
      {tab === "docs"     && <DocsTab />}
      {tab === "evolucao" && <EvolucaoTab />}
    </div>
  );
}

// ─── Field & Metric helpers ───────────────────────────────────────────────────

function Field({ label, value, onChange, type = "text", step }: { label: string; value: string; onChange: (v: string) => void; type?: string; step?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">{label}</span>
      <input type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-bg-elevated px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-accent-blue/40" />
    </label>
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
