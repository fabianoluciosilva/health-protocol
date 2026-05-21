"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import Header from "@/components/medications/Header";
import ProfileSummary from "@/components/medications/ProfileSummary";
import MondayAlert from "@/components/medications/MondayAlert";
import DailyTimeline from "@/components/medications/DailyTimeline";
import BloodPressureCard from "@/components/medications/BloodPressureCard";
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

      <BloodPressureCard />

      <Link
        href="/medications/exams"
        className="flex items-center gap-3 rounded-2xl bg-bg-card px-4 py-3 active:scale-[0.98] transition-transform"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-blue/10">
          <FlaskConical className="h-4 w-4 text-accent-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Exames Laboratoriais</p>
          <p className="text-xs text-gray-500">Ver resultados · Importar novo exame</p>
        </div>
        <span className="text-xs text-gray-600">›</span>
      </Link>

      <DailyTimeline />
    </div>
  );
}
