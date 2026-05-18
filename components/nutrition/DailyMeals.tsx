"use client";

import { useMemo, useState } from "react";
import MealCard from "./MealCard";
import TagFilter from "./TagFilter";
import { useDayMeals } from "@/hooks/useTodayMeals";
import { useMealLog } from "@/hooks/useMealLog";
import { MEAL_ORDER, type TagKey } from "@/lib/utils/nutrition";

interface Props {
  date: Date;
}

export default function DailyMeals({ date }: Props) {
  const { meals, loading: loadingMeals } = useDayMeals(date);
  const { findLog, logOption, logNoAppetite, removeLog, loading: loadingLogs } = useMealLog(date);
  const [tag, setTag] = useState<TagKey | "all">("all");
  const now = useMemo(() => new Date(), []);

  const ordered = useMemo(() => {
    const byType = new Map(meals.map((m) => [m.meal_type, m]));
    return MEAL_ORDER.map((t) => byType.get(t)).filter(Boolean) as typeof meals;
  }, [meals]);

  if (loadingMeals || loadingLogs) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-bg-card" />
        ))}
      </div>
    );
  }

  if (ordered.length === 0) {
    return <div className="rounded-2xl bg-bg-card p-6 text-center text-sm text-gray-400">Sem cardápio cadastrado para hoje.</div>;
  }

  return (
    <div className="space-y-3">
      <TagFilter active={tag} onChange={setTag} />
      {ordered.map((meal) => (
        <MealCard
          key={meal.id}
          meal={meal}
          log={findLog(meal.meal_type)}
          now={now}
          tagFilter={tag}
          onLogOption={(m, opt) => logOption(m, opt)}
          onLogNoAppetite={(idx) => logNoAppetite(meal.meal_type, idx)}
          onRemove={() => removeLog(meal.meal_type)}
        />
      ))}
    </div>
  );
}
