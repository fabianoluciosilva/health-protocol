"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Settings } from "lucide-react";
import { calculateProfile } from "@/lib/utils/profile";
import { useLatestWeight } from "@/hooks/useBodyMetrics";
import type { Profile } from "@/lib/supabase/types";
import { cn } from "@/lib/utils/cn";

interface Props {
  profile: Profile;
}

export default function ProfileSummary({ profile }: Props) {
  const [open, setOpen] = useState(false);
  const { weight: latestWeight } = useLatestWeight();
  // Peso de referência = último registro de evolução; fallback para o perfil.
  const weight = latestWeight ?? Number(profile.weight_kg);
  const metrics = calculateProfile(
    weight,
    Number(profile.height_cm),
    new Date(profile.birth_date)
  );

  return (
    <section className="rounded-2xl bg-bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="text-sm text-gray-300">
          <span className="font-medium text-white">{metrics.age} anos</span>
          <span className="mx-1.5 text-gray-500">|</span>
          <span>{weight.toLocaleString("pt-BR")}kg</span>
          <span className="mx-1.5 text-gray-500">|</span>
          <span>{(profile.height_cm / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}m</span>
          <span className="mx-1.5 text-gray-500">|</span>
          <span>IMC: {metrics.bmi.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-gray-500 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-bg-elevated px-4 py-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <Metric label="IMC" value={`${metrics.bmi.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}`} hint={metrics.bmiLabel} />
            <Metric label="Peso alvo" value={`${metrics.targetWeight} kg`} hint="-15%" />
            <Metric label="TMB" value={`${metrics.bmr.toLocaleString("pt-BR")} kcal`} hint="basal" />
            <Metric label="Meta diária" value={`${metrics.targetCalories.toLocaleString("pt-BR")} kcal`} hint="déficit 500 kcal" />
            <Metric label="Proteína" value={`${metrics.proteinGoal} g`} hint="2g / kg alvo" />
            <Metric label="TDEE" value={`${metrics.tdee.toLocaleString("pt-BR")} kcal`} hint="moderado" />
          </div>
          <Link
            href="/profile"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-bg-elevated py-2 text-sm font-medium text-accent-blue active:scale-95"
          >
            <Settings className="h-4 w-4" /> Editar perfil
          </Link>
        </div>
      )}
    </section>
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
