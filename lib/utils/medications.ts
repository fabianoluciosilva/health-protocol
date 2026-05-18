import type { Medication, MedicationLog } from "@/lib/supabase/types";

export interface ScheduleSlot {
  medication: Medication;
  time: string;
  slotKey: string;
}

export function getTodaySchedule(medications: Medication[], date: Date): ScheduleSlot[] {
  const dayOfWeek = date.getDay() + 1;
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDateISO(today);
  const slots: ScheduleSlot[] = [];

  for (const med of medications) {
    if (!med.active) continue;
    if (med.start_date && med.start_date > todayStr) continue;

    let include = false;
    if (med.frequency === "daily") include = true;
    else if (med.frequency === "weekly") include = med.week_day === dayOfWeek;
    else if (med.frequency === "every_10_days") {
      const startStr = med.start_date ?? "2026-05-19";
      const [sy, sm, sd] = startStr.split("-").map(Number);
      const startDate = new Date(sy, sm - 1, sd);
      startDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - startDate.getTime()) / 86_400_000);
      include = diffDays >= 0 && diffDays % 10 === 0;
    }

    if (!include) continue;

    slots.push({
      medication: med,
      time: med.time_1,
      slotKey: `${med.id}|${med.time_1}`,
    });

    if (med.time_2) {
      slots.push({
        medication: med,
        time: med.time_2,
        slotKey: `${med.id}|${med.time_2}`,
      });
    }
  }

  return slots.sort((a, b) => a.time.localeCompare(b.time));
}

export type SlotStatus = "taken" | "pending" | "overdue" | "next" | "upcoming";

export function getSlotStatus(
  slot: ScheduleSlot,
  log: MedicationLog | undefined,
  now: Date,
  nextSlotKey: string | null
): SlotStatus {
  if (log?.taken) return "taken";

  const [h, m] = slot.time.split(":").map(Number);
  const slotDate = new Date(now);
  slotDate.setHours(h, m, 0, 0);

  const diffMin = (now.getTime() - slotDate.getTime()) / 60_000;
  if (diffMin > 30) return "overdue";
  if (slot.slotKey === nextSlotKey) return "next";
  if (diffMin > -60) return "upcoming";
  return "pending";
}

export function findNextSlot(slots: ScheduleSlot[], logs: MedicationLog[], now: Date): string | null {
  const takenKeys = new Set(
    logs.filter((l) => l.taken).map((l) => `${l.medication_id}|${l.scheduled_time.slice(0, 5)}`)
  );
  const todayStr = formatDateISO(now);

  for (const slot of slots) {
    const fullKey = `${slot.medication.id}|${slot.time.slice(0, 5)}`;
    if (takenKeys.has(fullKey)) continue;
    const [h, m] = slot.time.split(":").map(Number);
    const slotDate = new Date(now);
    slotDate.setHours(h, m, 0, 0);
    if (slotDate.getTime() >= now.getTime() - 30 * 60_000) {
      void todayStr;
      return slot.slotKey;
    }
  }
  return null;
}

export function formatDateISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatTimeBR(time: string): string {
  return time.slice(0, 5).replace(":", "h");
}

export function dayNameBR(d: Date): string {
  const names = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  return names[d.getDay()];
}

export function dateLabelBR(d: Date): string {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function greetingBR(d: Date): string {
  const h = d.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function logKey(medId: string, time: string) {
  return `${medId}|${time.slice(0, 5)}`;
}

export function findLog(logs: MedicationLog[], medId: string, time: string): MedicationLog | undefined {
  const t = time.slice(0, 5);
  return logs.find((l) => l.medication_id === medId && l.scheduled_time.slice(0, 5) === t);
}

export function getUpcomingMedications(medications: Medication[], date: Date): Medication[] {
  const todayStr = formatDateISO(date);
  return medications.filter((m) => m.active && m.start_date && m.start_date > todayStr);
}

export function daysUntil(dateStr: string, from: Date): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);
  const fromDay = new Date(from);
  fromDay.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - fromDay.getTime()) / 86_400_000);
}
