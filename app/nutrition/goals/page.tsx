"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Beef, Wheat, Salad, Droplet, Target, Flame, Activity } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { calculateNutritionGoals } from "@/lib/utils/profile";

export default function GoalsPage() {
  const { profile, loading } = useProfile();

  const goals = useMemo(() => {
    if (!profile) return null;
    return calculateNutritionGoals(Number(profile.weight_kg), Number(profile.height_cm), new Date(profile.birth_date));
  }, [profile]);

  if (loading || !profile || !goals) {
    return <div className="px-4 pt-4"><div className="h-40 animate-pulse rounded-2xl bg-bg-card" /></div>;
  }

  const weightKg = Number(profile.weight_kg);
  const loss = weightKg - goals.targetWeight;
  const weeksToGoal = Math.round((loss * 1000) / 800);
  const heightM = Number(profile.height_cm) / 100;
  const targetBmi = Math.round((goals.targetWeight / (heightM * heightM)) * 10) / 10;

  return (
    <div className="space-y-4 px-4 pt-4">
      <header className="flex items-center gap-3">
        <Link href="/nutrition" className="rounded-xl bg-bg-card p-2 text-gray-400 active:scale-95">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold text-white">Suas Metas</h1>
      </header>

      <section className="rounded-2xl bg-bg-card p-4">
        <div className="text-[11px] uppercase tracking-wider text-gray-500">Base de cálculo</div>
        <div className="mt-1 text-sm text-gray-200">
          {goals.age} anos · {weightKg.toLocaleString("pt-BR")} kg · {heightM.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} m
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-bg-card p-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Activity className="h-4 w-4 text-accent-blue" /> Gasto energético</h2>
        <Row label="TMB (basal)" value={`${goals.bmr.toLocaleString("pt-BR")} kcal`} hint="Mifflin-St Jeor" />
        <Row label="TDEE (ativo)" value={`${goals.tdee.toLocaleString("pt-BR")} kcal`} hint="moderadamente ativo (×1,375)" />
        <Row label="Meta calórica" value={`${goals.targetCalories.toLocaleString("pt-BR")} kcal`} hint="déficit de 500 kcal/dia" highlight />
      </section>

      <section className="space-y-3 rounded-2xl bg-bg-card p-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Flame className="h-4 w-4 text-accent-orange" /> Macros diários</h2>
        <Macro icon={<Beef className="h-4 w-4 text-accent-red" />} label="Proteína" grams={goals.proteinGoal} kcal={goals.proteinGoal * 4} pct="2g × kg alvo" />
        <Macro icon={<Wheat className="h-4 w-4 text-accent-yellow" />} label="Carboidrato" grams={goals.carbGoal} kcal={goals.carbGoal * 4} pct="30% das kcal" />
        <Macro icon={<Salad className="h-4 w-4 text-accent-green" />} label="Gordura" grams={goals.fatGoal} kcal={goals.fatGoal * 9} pct="25% das kcal" />
        <Macro icon={<Droplet className="h-4 w-4 text-accent-blue" />} label="Fibra (mínimo)" grams={goals.fiberGoal} kcal={0} pct="alvo diário" />
      </section>

      <section className="space-y-3 rounded-2xl bg-bg-card p-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Target className="h-4 w-4 text-accent-green" /> Peso</h2>
        <Row label="Atual" value={`${weightKg.toLocaleString("pt-BR")} kg`} hint={`IMC ${goals.bmi.toLocaleString("pt-BR", { minimumFractionDigits: 1 })} · ${goals.bmiLabel}`} />
        <Row label="Alvo" value={`${goals.targetWeight} kg`} hint={`-${Math.round(loss)} kg · IMC alvo ${targetBmi.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}`} highlight />
        <Row label="Ritmo sugerido" value="~800 g/semana" hint={`~${weeksToGoal} semanas (${Math.round(weeksToGoal / 4.3)} meses)`} />
      </section>

      <div className="rounded-2xl border border-bg-elevated bg-bg-card/60 p-4 text-xs leading-relaxed text-gray-400">
        💡 A Testosterona (TRT) + déficit calórico controlado preservam massa muscular durante o emagrecimento. Acompanhe junto com as metas do Módulo 1 (Medicamentos).
      </div>
    </div>
  );
}

function Row({ label, value, hint, highlight }: { label: string; value: string; hint?: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-bg-elevated/60 pb-2 last:border-0 last:pb-0">
      <div className="text-sm text-gray-300">{label}</div>
      <div className="text-right">
        <div className={highlight ? "text-base font-bold text-white" : "text-sm font-semibold text-white"}>{value}</div>
        {hint && <div className="text-[10px] text-gray-500">{hint}</div>}
      </div>
    </div>
  );
}

function Macro({ icon, label, grams, kcal, pct }: { icon: React.ReactNode; label: string; grams: number; kcal: number; pct: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-bg-elevated px-3 py-2">
      <div className="flex items-center gap-2 text-sm text-gray-200">{icon} {label}</div>
      <div className="text-right">
        <div className="text-sm font-semibold text-white">{grams}g{kcal ? <span className="text-gray-400"> · {kcal.toLocaleString("pt-BR")} kcal</span> : null}</div>
        <div className="text-[10px] text-gray-500">{pct}</div>
      </div>
    </div>
  );
}
