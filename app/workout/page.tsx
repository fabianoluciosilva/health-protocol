"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TodayWorkout from "@/components/workout/TodayWorkout";
import AIGenerateOverlay from "@/components/AIGenerateOverlay";
import { useTodayWorkout } from "@/hooks/useTodayWorkout";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import { useProfile } from "@/hooks/useProfile";
import { useAIGenerate, isRenewalDue } from "@/hooks/useAIGenerate";

export default function WorkoutPage() {
  const now = useMemo(() => new Date(), []);
  const [selectedSplitId, setSelectedSplitId] = useState<string | undefined>(undefined);

  const { todaySplit, splitExercises, splits, loading } = useTodayWorkout(now, selectedSplitId);
  const activeSplit = selectedSplitId
    ? splits.find((s) => s.id === selectedSplitId) ?? todaySplit
    : todaySplit;

  const { session, startSession } = useWorkoutSession(now, activeSplit?.id);
  const { profile, loading: loadingProfile, reload: reloadProfile } = useProfile();
  const { generating, result, error, generate } = useAIGenerate("workout");
  const router = useRouter();

  const [showOverlay, setShowOverlay] = useState(false);

  // Acionar automaticamente no primeiro acesso (ai_workout_generated = false)
  useEffect(() => {
    if (!profile || loadingProfile) return;
    if (!profile.ai_workout_generated) {
      setShowOverlay(true);
    }
  }, [profile, loadingProfile]);

  const renewalDue = profile
    ? isRenewalDue(profile.last_workout_generated_at, profile.workout_renewal_months ?? 1)
    : false;

  // Mostrar banner de renovação se vencido (e não for primeiro acesso)
  useEffect(() => {
    if (!profile || loadingProfile) return;
    if (profile.ai_workout_generated && renewalDue) {
      setShowOverlay(true);
    }
  }, [profile, loadingProfile, renewalDue]);

  const handleGenerate = async () => {
    if (!profile) return;
    await generate(profile);
    reloadProfile();
  };

  const handleStart = async () => {
    await startSession();
    router.push("/workout/session");
  };

  return (
    <div className="space-y-4 px-4 pt-4">
      {/* IA: primeiro acesso ou renovação vencida */}
      {profile && showOverlay && (
        <AIGenerateOverlay
          type="workout"
          generating={generating}
          result={result}
          error={error}
          renewalDue={profile.ai_workout_generated && renewalDue}
          onGenerate={handleGenerate}
          onDismiss={() => setShowOverlay(false)}
        />
      )}

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
