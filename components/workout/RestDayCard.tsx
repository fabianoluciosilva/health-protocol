"use client";

import type { WorkoutSplit } from "@/lib/supabase/types";

interface Props {
  split: WorkoutSplit;
  nextWorkoutDay: string;
}

export default function RestDayCard({ split, nextWorkoutDay }: Props) {
  const isActive = split.rest_type === "active";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-bg-card p-5 text-center">
        <div className="mb-1 text-4xl">{isActive ? "🚶" : "😴"}</div>
        <h2 className="text-lg font-bold text-white">{split.split_name}</h2>
        {split.split_description && (
          <p className="mt-1 text-sm text-gray-400">{split.split_description}</p>
        )}
      </div>

      <div className="rounded-2xl bg-bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-300">
          {isActive ? "Sugestões para hoje" : "Recuperação total"}
        </h3>
        {isActive ? (
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span>🚶</span>
              <div>
                <div className="font-medium">Caminhada leve 30-40 min</div>
                <div className="text-xs text-gray-500">Boa para o joelho — movimento sem impacto</div>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span>🧘</span>
              <div>
                <div className="font-medium">Alongamento 20 min</div>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span>📱</span>
              <div>
                <div className="font-medium">Mobilidade articular</div>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span>💧</span>
              <div>
                <div className="font-medium">Meta de água: 2,5 L hoje</div>
              </div>
            </li>
          </ul>
        ) : (
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2"><span>😴</span><div><div className="font-medium">Sono de qualidade — priorize 7-8h</div></div></li>
            <li className="flex items-start gap-2"><span>💧</span><div><div className="font-medium">Hidratação completa — 2,5 L mínimo</div></div></li>
            <li className="flex items-start gap-2"><span>🍽️</span><div><div className="font-medium">Respeite a meta calórica do Módulo 2</div></div></li>
            <li className="flex items-start gap-2"><span>💊</span><div><div className="font-medium">Confira seus medicamentos no Módulo 1</div></div></li>
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-bg-elevated bg-bg-card/60 p-4 text-sm">
        <div className="text-gray-400">Próximo treino:</div>
        <div className="mt-1 font-semibold text-white">{nextWorkoutDay} 💪</div>
      </div>
    </div>
  );
}
