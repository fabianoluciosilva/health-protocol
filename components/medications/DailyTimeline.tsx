"use client";

import { useMemo } from "react";
import MedicationCard from "./MedicationCard";
import { useMedications } from "@/hooks/useMedications";
import { useTodaySchedule } from "@/hooks/useTodaySchedule";
import { findNextSlot, getUpcomingMedications, daysUntil } from "@/lib/utils/medications";
import { Sparkles, Clock } from "lucide-react";

export default function DailyTimeline() {
  const { medications, loading: loadingMeds } = useMedications();
  const { slots, logs, now, loading: loadingLogs, toggle } = useTodaySchedule(medications);
  const upcoming = useMemo(() => getUpcomingMedications(medications, now), [medications, now]);

  const nextSlotKey = useMemo(() => findNextSlot(slots, logs, now), [slots, logs, now]);
  const takenCount = useMemo(
    () => slots.filter((s) => logs.find((l) => l.medication_id === s.medication.id && l.scheduled_time.slice(0, 5) === s.time.slice(0, 5))?.taken).length,
    [slots, logs]
  );

  if (loadingMeds || loadingLogs) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-bg-card" />
        ))}
      </div>
    );
  }

  if (slots.length === 0 && upcoming.length === 0) {
    return (
      <div className="rounded-2xl bg-bg-card p-6 text-center text-sm text-gray-400">
        <Sparkles className="mx-auto mb-2 h-6 w-6 text-gray-500" />
        Nenhum medicamento programado para hoje.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {slots.length > 0 && (
        <>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-gray-300">Hoje</h2>
            <div className="text-xs text-gray-500">
              <span className="font-semibold text-white">{takenCount}</span> de {slots.length} tomados
            </div>
          </div>
          <div className="space-y-2">
            {slots.map((slot) => (
              <MedicationCard
                key={slot.slotKey}
                slot={slot}
                logs={logs}
                now={now}
                nextSlotKey={nextSlotKey}
                onToggle={toggle}
              />
            ))}
          </div>
        </>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-gray-300">Em breve</h2>
          {upcoming.map((med) => (
            <div
              key={med.id}
              className="flex items-center gap-3 rounded-2xl border border-bg-elevated bg-bg-card px-4 py-3"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: med.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{med.name}</p>
                <p className="text-xs text-gray-500">{med.dose} · {med.time_1.slice(0, 5)}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-accent-blue shrink-0">
                <Clock className="h-3.5 w-3.5" />
                em {daysUntil(med.start_date!, now)}d
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
