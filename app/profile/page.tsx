"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { calculateProfile } from "@/lib/utils/profile";

export default function ProfilePage() {
  const { profile, loading, update } = useProfile();
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [wake, setWake] = useState("");
  const [sleep, setSleep] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setWeight(String(profile.weight_kg));
    setHeight(String(profile.height_cm));
    setBirthDate(profile.birth_date);
    setWake(profile.wake_time.slice(0, 5));
    setSleep(profile.sleep_time.slice(0, 5));
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
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (loading || !profile) {
    return <div className="px-4 pt-4"><div className="h-24 animate-pulse rounded-2xl bg-bg-card" /></div>;
  }

  const metrics = calculateProfile(Number(weight) || 0, Number(height) || 0, new Date(birthDate || profile.birth_date));

  return (
    <div className="space-y-4 px-4 pt-4">
      <header className="flex items-center gap-3">
        <Link href="/medications" className="rounded-xl bg-bg-card p-2 text-gray-400 active:scale-95">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold text-white">Perfil</h1>
      </header>

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

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-accent-blue py-2.5 text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar perfil"}
        </button>
      </section>

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

function Field({
  label,
  value,
  onChange,
  type = "text",
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">{label}</span>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-bg-elevated px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-accent-blue/40"
      />
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
