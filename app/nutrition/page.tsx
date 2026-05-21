"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import Header from "@/components/nutrition/Header";
import MacroSummary from "@/components/nutrition/MacroSummary";
import WaterTracker from "@/components/nutrition/WaterTracker";
import ExamAlertsList from "@/components/nutrition/ExamAlertsList";
import DailyMeals from "@/components/nutrition/DailyMeals";
import QuickFoodCard from "@/components/nutrition/QuickFoodCard";
import { useProfile } from "@/hooks/useProfile";
import { useDayMeals } from "@/hooks/useTodayMeals";
import { useMealLog } from "@/hooks/useMealLog";
import { useWaterLog } from "@/hooks/useWaterLog";
import { calculateNutritionGoals } from "@/lib/utils/profile";
import { computeDayMacros } from "@/lib/utils/nutrition";

export default function NutritionPage() {
  const now = useMemo(() => new Date(), []);
  const { profile, loading: loadingProfile } = useProfile();
  const { meals } = useDayMeals(now);
  const { logs } = useMealLog(now);
  const { isTraining, toggleTraining } = useWaterLog(now);

  const goals = useMemo(() => {
    if (!profile) return null;
    return calculateNutritionGoals(Number(profile.weight_kg), Number(profile.height_cm), new Date(profile.birth_date));
  }, [profile]);

  const macros = useMemo(() => computeDayMacros(meals, logs), [meals, logs]);

  return (
    <div className="space-y-4 px-4 pt-4">
      {/* Header row: saudação + botão de compras sempre visível */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {loadingProfile || !profile ? (
            <div className="h-16 animate-pulse rounded-2xl bg-bg-card" />
          ) : (
            <Header name={profile.name} date={now} isTrainingDay={isTraining} onToggleTraining={toggleTraining} />
          )}
        </div>
        <Link
          href="/nutrition/shopping"
          className="mt-1 flex shrink-0 items-center gap-1.5 rounded-full bg-bg-card px-3 py-1.5 text-xs font-medium text-gray-300 active:scale-95"
        >
          <ShoppingCart className="h-3.5 w-3.5 text-accent-green" />
          Compras
        </Link>
      </div>

      {/* MacroSummary: sempre visível — skeleton durante loading, valores reais após */}
      {loadingProfile ? (
        <div className="h-24 animate-pulse rounded-2xl bg-bg-card" />
      ) : (
        <MacroSummary
          calories={macros.calories}
          caloriesGoal={goals?.targetCalories ?? 2000}
          protein={macros.protein}
          proteinGoal={goals?.proteinGoal ?? 150}
        />
      )}

      <ExamAlertsList />

      <WaterTracker compact />

      <QuickFoodCard date={now} />

      <DailyMeals date={now} />
    </div>
  );
}
