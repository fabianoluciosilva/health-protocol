"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { MealType } from "@/lib/supabase/types";
import { NO_APPETITE_OPTIONS } from "@/lib/utils/nutrition";

interface Props {
  mealType: MealType;
  onChoose: (idx: number) => void;
  onCancel: () => void;
}

export default function NoAppetiteMode({ mealType, onChoose, onCancel }: Props) {
  const [picking, setPicking] = useState<number | null>(null);
  const options = NO_APPETITE_OPTIONS[mealType];

  const handle = (i: number) => {
    setPicking(i);
    onChoose(i);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-amber-200">😞 Modo sem fome</div>
        <button onClick={onCancel} className="rounded-md p-1 text-amber-200/70" aria-label="Cancelar">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-xs text-amber-100/80">
        Sem problema. Escolha uma opção mínima em volume e máxima em proteína:
      </p>
      <div className="space-y-2">
        {options.map((o, i) => (
          <button
            key={i}
            onClick={() => handle(i)}
            disabled={picking !== null}
            className="flex w-full items-center gap-3 rounded-xl bg-bg-card p-3 text-left active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{o.label}</div>
              <div className="text-[11px] text-gray-400">{o.calories} kcal · {o.protein}g proteína</div>
            </div>
            {picking === i ? <Check className="h-5 w-5 text-accent-green" /> : <span className="text-xs text-accent-blue">Escolher</span>}
          </button>
        ))}
      </div>
      {mealType === "dinner" && (
        <div className="rounded-lg bg-bg-elevated/60 px-3 py-2 text-[11px] leading-snug text-amber-100">
          ⚠️ Lembrete: <strong>Glifage XR às 20:30</strong> precisa de algo no estômago antes.
        </div>
      )}
    </div>
  );
}
