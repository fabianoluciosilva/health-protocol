"use client";

import { useMemo } from "react";
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
      {loadingProfile || !profile ? (
        <div className="h-16 animate-pulse rounded-2xl bg-bg-card" />
      ) : (
        <Header name={profile.name} date={now} isTrainingDay={isTraining} onToggleTraining={toggleTraining} />
      )}

      {goals && (
        <MacroSummary
          calories={macros.calories}
          caloriesGoal={goals.targetCalories}
          protein={macros.protein}
          proteinGoal={goals.proteinGoal}
        />
      )}

      <ExamAlertsList />

      <WaterTracker compact />

      <QuickFoodCard date={now} />

      <DailyMeals date={now} />
    </div>
  );
}
