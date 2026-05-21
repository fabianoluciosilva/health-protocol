"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TodayWorkout from "@/components/workout/TodayWorkout";
import { useTodayWorkout } from "@/hooks/useTodayWorkout";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";

export default function WorkoutPage() {
  const now = useMemo(() => new Date(), []);
  const [selectedSplitId, setSelectedSplitId] = useState<string | undefined>(undefined);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  // Limpa o filtro de grupos ao trocar de split
  useEffect(() => {
    setSelectedGroups(new Set());
  }, [selectedSplitId]);

  const { todaySplit, splitExercises, splits, loading } = useTodayWorkout(now, selectedSplitId);
  const activeSplit = selectedSplitId
    ? splits.find((s) => s.id === selectedSplitId) ?? todaySplit
    : todaySplit;

  const { session, startSession } = useWorkoutSession(now, activeSplit?.id);
  const router = useRouter();

  const handleStart = async () => {
    // Persiste o filtro de grupos para a página de sessão
    if (selectedGroups.size > 0) {
      sessionStorage.setItem("workout_group_filter", JSON.stringify(Array.from(selectedGroups)));
    } else {
      sessionStorage.removeItem("workout_group_filter");
    }
    await startSession();
    router.push("/workout/session");
  };

  function handleToggleGroup(name: string) {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      <TodayWorkout
        date={now}
        todaySplit={activeSplit}
        splitExercises={splitExercises}
        splits={splits}
        session={session}
        loading={loading}
        selectedSplitId={selectedSplitId}
        onSelectSplit={setSelectedSplitId}
        onStart={handleStart}
        bodyWeightKg={130}
        selectedGroups={selectedGroups}
        onToggleGroup={handleToggleGroup}
        onClearGroups={() => setSelectedGroups(new Set())}
      />
    </div>
  );
}
