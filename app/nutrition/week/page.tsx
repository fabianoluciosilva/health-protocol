"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { useWeekMeals } from "@/hooks/useTodayMeals";
import { MEAL_LABELS, MEAL_ORDER } from "@/lib/utils/nutrition";
import { dayShortBR } from "@/lib/utils/dates";
import type { Meal, MealType } from "@/lib/supabase/types";

export default function WeekPage() {
  const { meals, loading } = useWeekMeals();

  const byDay = useMemo(() => {
    const map = new Map<number, Map<MealType, Meal>>();
    for (const m of meals) {
      if (!map.has(m.day_of_week)) map.set(m.day_of_week, new Map());
      map.get(m.day_of_week)!.set(m.meal_type, m);
    }
    return map;
  }, [meals]);

  const dayOrder = [2, 3, 4, 5, 6, 7, 1];

  return (
    <div className="space-y-4 px-4 pt-4">
      <header className="flex items-center gap-3">
        <Link href="/nutrition" className="rounded-xl bg-bg-card p-2 text-gray-400 active:scale-95">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold text-white">Cardápio da Semana</h1>
      </header>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-bg-card" />)}</div>
      ) : (
        <div className="space-y-4">
          {dayOrder.map((dow) => {
            const dayMeals = byDay.get(dow);
            if (!dayMeals) return null;
            return (
              <section key={dow} className="rounded-2xl bg-bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-white">{dayShortBR(dow)}-feira</h2>
                <ul className="space-y-3">
                  {MEAL_ORDER.map((type) => {
                    const meal = dayMeals.get(type);
                    if (!meal) return null;
                    const label = MEAL_LABELS[type];
                    return (
                      <li key={type} className="border-l-2 border-bg-elevated pl-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="text-[11px] uppercase tracking-wider text-gray-500">
                            <span aria-hidden>{label.icon}</span> {label.label} · {meal.meal_time.slice(0, 5)}
                          </div>
                          <div className="text-[10px] text-gray-500">{meal.calories_est} kcal · {meal.protein_g}g</div>
                        </div>
                        <div className="mt-1 space-y-0.5 text-xs leading-snug text-gray-300">
                          <div><span className="text-gray-500">A:</span> {meal.option_a}</div>
                          <div><span className="text-gray-500">B:</span> {meal.option_b}</div>
                          <div><span className="text-gray-500">C:</span> {meal.option_c}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
