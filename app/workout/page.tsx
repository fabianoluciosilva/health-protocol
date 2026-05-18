"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TodayWorkout from "@/components/workout/TodayWorkout";
import { useTodayWorkout } from "@/hooks/useTodayWorkout";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";

export default function WorkoutPage() {
  const now = useMemo(() => new Date(), []);
  const [selectedSplitId, setSelectedSplitId] = useState<string | undefined>(undefined);

  const { todaySplit, splitExercises, splits, loading } = useTodayWorkout(now, selectedSplitId);
  const activeSplit = selectedSplitId
    ? splits.find((s) => s.id === selectedSplitId) ?? todaySplit
    : todaySplit;

  const { session, startSession } = useWorkoutSession(now, activeSplit?.id);
  const router = useRouter();

  const handleStart = async () => {
    await startSession();
    router.push("/workout/session");
  };

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
      />
    </div>
  );
}
