// ─── Módulo 1 ─────────────────────────────────────────────────────────────

export interface ProfileMetrics {
  age: number;
  bmi: number;
  bmiLabel: string;
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinGoal: number;
  targetWeight: number;
}

export function calculateProfile(weight: number, height: number, birthDate: Date): ProfileMetrics {
  const age = Math.floor((Date.now() - birthDate.getTime()) / 31_557_600_000);
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  const tdee = bmr * 1.375;
  const targetCalories = tdee - 500;
  const targetWeight = weight * 0.85;
  const proteinGoal = targetWeight * 2;

  return {
    age,
    bmi: Math.round(bmi * 10) / 10,
    bmiLabel: bmiLabel(bmi),
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    proteinGoal: Math.round(proteinGoal),
    targetWeight: Math.round(targetWeight),
  };
}

// ─── Módulo 2 ─────────────────────────────────────────────────────────────

export interface NutritionGoals {
  age: number;
  bmi: number;
  bmiLabel: string;
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  targetWeight: number;
  fiberGoal: number;
}

export function calculateNutritionGoals(
  weightKg: number,
  heightCm: number,
  birthDate: Date,
  activityLevel = 1.375
): NutritionGoals {
  const age = Math.floor((Date.now() - birthDate.getTime()) / 31_557_600_000);
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const tdee = bmr * activityLevel;
  const targetCalories = Math.round(tdee - 500);
  const targetWeight = weightKg * 0.85;
  const proteinGoal = Math.round(targetWeight * 2);
  const carbGoal = Math.round((targetCalories * 0.30) / 4);
  const fatGoal = Math.round((targetCalories * 0.25) / 9);

  return {
    age,
    bmi: Math.round(bmi * 10) / 10,
    bmiLabel: bmiLabel(bmi),
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories,
    proteinGoal,
    carbGoal,
    fatGoal,
    targetWeight: Math.round(targetWeight),
    fiberGoal: 30,
  };
}

// ─── Shared ────────────────────────────────────────────────────────────────

function bmiLabel(bmi: number): string {
  if (bmi < 18.5) return "Abaixo do peso";
  if (bmi < 25) return "Peso normal";
  if (bmi < 30) return "Sobrepeso";
  if (bmi < 35) return "Obesidade I";
  if (bmi < 40) return "Obesidade II";
  return "Obesidade III";
}
