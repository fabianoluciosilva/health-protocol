"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import TodayWorkout from "@/components/workout/TodayWorkout";
import { useTodayWorkout } from "@/hooks/useTodayWorkout";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";

export default function WorkoutPage() {
  const now = useMemo(() => new Date(), []);
  const { todaySplit, splitExercises, splits, loading } = useTodayWorkout(now);
  const { session, startSession } = useWorkoutSession(now, todaySplit?.id);
  const router = useRouter();

  const handleStart = async () => {
    await startSession();
    router.push("/workout/session");
  };

  return (
    <div className="space-y-4 px-4 pt-4">
      <TodayWorkout
        date={now}
        todaySplit={todaySplit}
        splitExercises={splitExercises}
        splits={splits}
        session={session}
        loading={loading}
        onStart={handleStart}
        bodyWeightKg={130}
      />
    </div>
  );
}
