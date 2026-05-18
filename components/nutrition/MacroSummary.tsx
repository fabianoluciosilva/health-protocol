"use client";

import { Flame, Beef } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Props {
  calories: number;
  caloriesGoal: number;
  protein: number;
  proteinGoal: number;
}

export default function MacroSummary({ calories, caloriesGoal, protein, proteinGoal }: Props) {
  const calPct = caloriesGoal ? Math.min(100, Math.round((calories / caloriesGoal) * 100)) : 0;
  const proPct = proteinGoal ? Math.min(100, Math.round((protein / proteinGoal) * 100)) : 0;

  return (
    <section className="space-y-3 rounded-2xl bg-bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
        Meta do dia
      </div>

      <Row
        icon={<Flame className="h-4 w-4 text-accent-orange" />}
        label="Calorias"
        value={`${calories.toLocaleString("pt-BR")} / ${caloriesGoal.toLocaleString("pt-BR")} kcal`}
        pct={calPct}
        color={calPct > 100 ? "bg-accent-red" : calPct >= 80 ? "bg-accent-green" : "bg-accent-orange"}
      />
      <Row
        icon={<Beef className="h-4 w-4 text-accent-red" />}
        label="Proteína"
        value={`${protein}g / ${proteinGoal}g`}
        pct={proPct}
        color={proPct >= 80 ? "bg-accent-green" : "bg-accent-purple"}
      />
    </section>
  );
}

function Row({ icon, label, value, pct, color }: { icon: React.ReactNode; label: string; value: string; pct: number; color: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-gray-300">{icon} {label}</span>
        <span className="text-gray-400">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-bg-elevated">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
