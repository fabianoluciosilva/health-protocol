"use client";

import { useMemo } from "react";
import Header from "@/components/medications/Header";
import ProfileSummary from "@/components/medications/ProfileSummary";
import WaterCounter from "@/components/medications/WaterCounter";
import MondayAlert from "@/components/medications/MondayAlert";
import DailyTimeline from "@/components/medications/DailyTimeline";
import { useProfile } from "@/hooks/useProfile";
import { useMedications } from "@/hooks/useMedications";
import { getTodaySchedule } from "@/lib/utils/medications";

export default function MedicationsPage() {
  const { profile, loading: loadingProfile } = useProfile();
  const { medications } = useMedications();
  const now = useMemo(() => new Date(), []);
  const todaySlots = useMemo(() => getTodaySchedule(medications, now), [medications, now]);

  const isMonday = now.getDay() === 1;
  const showMondayAlert = isMonday && todaySlots.length >= 5;

  return (
    <div className="space-y-4 px-4 pt-4">
      {loadingProfile || !profile ? (
        <div className="h-16 animate-pulse rounded-2xl bg-bg-card" />
      ) : (
        <Header name={profile.name} date={now} />
      )}

      {profile && <ProfileSummary profile={profile} />}

      {showMondayAlert && <MondayAlert count={todaySlots.length} />}

      <WaterCounter />

      <DailyTimeline />
    </div>
  );
}
