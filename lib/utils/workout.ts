import type { WorkoutSplit } from "@/lib/supabase/types";

export function getTodaySplit(splits: WorkoutSplit[], date: Date): WorkoutSplit | undefined {
  const dayOfWeek = date.getDay() + 1;
  return splits.find((s) => s.day_of_week === dayOfWeek);
}

export function getWeightRecommendation(exerciseName: string, bodyWeightKg: number): string {
  const ratios: Record<string, [number, number]> = {
    "Supino Reto com Barra": [0.5, 0.7],
    "Remada Curvada com Barra": [0.5, 0.7],
    "Desenvolvimento com Halteres": [0.15, 0.2],
    "Elevação Lateral com Haltere": [0.05, 0.08],
    "Rosca Direta com Barra": [0.25, 0.35],
    "Stiff com Barra": [0.6, 0.8],
    "Hip Thrust com Barra": [0.7, 1.0],
    "Levantamento Terra Romeno": [0.6, 0.8],
    "Encolhimento com Barra": [0.5, 0.7],
    "Tríceps Pulley Barra Reta": [0.2, 0.3],
    "Puxada Frontal no Pulley": [0.5, 0.7],
  };
  const ratio = ratios[exerciseName];
  if (!ratio) return "Comece leve e sinta o movimento";
  const min = Math.round((bodyWeightKg * ratio[0]) / 5) * 5;
  const max = Math.round((bodyWeightKg * ratio[1]) / 5) * 5;
  return `Sugestão: ${min}–${max} kg`;
}

export function estimateWorkoutDuration(exerciseCount: number): string {
  const minutes = exerciseCount * 8 + 10;
  return `~${minutes}-${minutes + 15} min`;
}

export function dayNameBR(date: Date): string {
  const names = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  return names[date.getDay()];
}

export function formatDateISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const WORKOUT_ALERTS = {
  knee: {
    message: "🦵 Joelho: exercícios adaptados — lesão em recuperação",
    avoided: ["Leg Press", "Cadeira Extensora", "Agachamento Livre", "Afundo"],
    tip: "Foco em posterior, glúteo e panturrilha com joelho neutro",
  },
  uricAcid: {
    message: "💧 Ácido Úrico elevado: beba 500 ml de água antes do treino",
    reminder: "Hidratação reduz risco de crise gotosa e inflamação articular",
  },
  bloodPressure: {
    message: "❤️ Pressão controlada: evite apneia (Valsalva) em cargas máximas",
    tip: "Expire sempre no esforço. Nunca prenda a respiração.",
  },
};
