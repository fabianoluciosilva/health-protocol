"use client";

import { Check, Clock, AlertTriangle, Circle } from "lucide-react";
import type { Medication, MedicationLog } from "@/lib/supabase/types";
import { findLog, formatTimeBR, getSlotStatus, type ScheduleSlot } from "@/lib/utils/medications";
import { cn } from "@/lib/utils/cn";

interface Props {
  slot: ScheduleSlot;
  logs: MedicationLog[];
  now: Date;
  nextSlotKey: string | null;
  onToggle: (medication: Medication, time: string) => void;
}

export default function MedicationCard({ slot, logs, now, nextSlotKey, onToggle }: Props) {
  const log = findLog(logs, slot.medication.id, slot.time);
  const status = getSlotStatus(slot, log, now, nextSlotKey);

  const ring = {
    taken: "border-accent-green/50 bg-green-500/5",
    overdue: "border-red-500/40 bg-red-500/5",
    next: "border-accent-blue/60 bg-blue-500/5 animate-pulse-soft",
    upcoming: "border-bg-elevated",
    pending: "border-bg-elevated",
  }[status];

  const Indicator = () => {
    if (status === "taken") {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-green text-white">
          <Check className="h-5 w-5" strokeWidth={3} />
        </div>
      );
    }
    if (status === "overdue") {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white">
          <AlertTriangle className="h-4 w-4" />
        </div>
      );
    }
    if (status === "next") {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-blue text-white">
          <Clock className="h-4 w-4" />
        </div>
      );
    }
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-600">
        <Circle className="h-4 w-4 text-gray-600" />
      </div>
    );
  };

  return (
    <button
      onClick={() => onToggle(slot.medication, slot.time)}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border bg-bg-card p-3 text-left transition active:scale-[0.98]",
        ring
      )}
    >
      <div className="w-12 shrink-0 text-center">
        <div className={cn("text-sm font-semibold", status === "taken" ? "text-gray-500 line-through" : "text-white")}>
          {formatTimeBR(slot.time)}
        </div>
      </div>

      <span
        aria-hidden
        className="h-12 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: slot.medication.color }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <div
            className={cn(
              "truncate text-sm font-semibold",
              status === "taken" ? "text-gray-400 line-through" : "text-white"
            )}
          >
            {slot.medication.name}
          </div>
          <div className="text-xs text-gray-400">{slot.medication.dose}</div>
        </div>
        {slot.medication.notes && (
          <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-400">
            {slot.medication.notes}
          </div>
        )}
        {log?.taken && log.taken_at && (
          <div className="mt-1 text-[10px] text-accent-green">
            ✓ Tomado às {new Date(log.taken_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>

      <Indicator />
    </button>
  );
}
