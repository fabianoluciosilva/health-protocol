import type { Meal, MealLog, MealType, OptionChosen } from "@/lib/supabase/types";

export const MEAL_LABELS: Record<MealType, { label: string; icon: string }> = {
  breakfast: { label: "Café da manhã", icon: "☀️" },
  lunch: { label: "Almoço", icon: "🍽️" },
  snack: { label: "Lanche", icon: "🌿" },
  dinner: { label: "Jantar", icon: "🌙" },
  ceia: { label: "Ceia", icon: "🌛" },
};

export const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "snack", "dinner", "ceia"];

export const TAG_LABELS: Record<string, { label: string; icon: string }> = {
  casa: { label: "Casa", icon: "🏠" },
  viagem: { label: "Viagem", icon: "✈️" },
  rapido: { label: "Rápido", icon: "⚡" },
};

export const TAG_KEYS = ["casa", "viagem", "rapido"] as const;
export type TagKey = (typeof TAG_KEYS)[number];

export function getOptionText(meal: Meal, option: OptionChosen): string {
  if (option === "skip") return "Pulou esta refeição";
  if (option === "a") return meal.option_a;
  if (option === "b") return meal.option_b;
  return meal.option_c;
}

export function getOptionLabel(option: OptionChosen): string {
  return option === "skip" ? "—" : option.toUpperCase();
}

export interface NoAppetiteOption {
  label: string;
  calories: number;
  protein: number;
}

export const NO_APPETITE_OPTIONS: Record<MealType, NoAppetiteOption[]> = {
  breakfast: [
    { label: "Iogurte grego 150g + 1 scoop whey", calories: 280, protein: 35 },
    { label: "Crepioca simples + queijo light", calories: 260, protein: 28 },
    { label: "Só whey com água + 1 fruta", calories: 180, protein: 26 },
  ],
  lunch: [
    { label: "Atum em lata 150g + 2 col arroz", calories: 320, protein: 32 },
    { label: "Frango desfiado 150g + salada", calories: 280, protein: 35 },
    { label: "Iogurte grego + whey", calories: 240, protein: 32 },
  ],
  snack: [
    { label: "1 scoop whey + água", calories: 120, protein: 25 },
    { label: "1 ovo cozido + 1 fruta", calories: 160, protein: 10 },
    { label: "Iogurte grego", calories: 150, protein: 14 },
  ],
  dinner: [
    { label: "Crepioca 2 ovos + queijo light", calories: 280, protein: 28 },
    { label: "Iogurte grego + 1 scoop whey", calories: 280, protein: 35 },
    { label: "Sopa proteica leve", calories: 250, protein: 22 },
  ],
  ceia: [
    { label: "Iogurte grego 100g + mel", calories: 150, protein: 12 },
    { label: "1 fatia pão integral + cream cheese light", calories: 140, protein: 8 },
    { label: "Whey 1 scoop com leite morno", calories: 170, protein: 25 },
  ],
};

export function computeDayMacros(meals: Meal[], logs: MealLog[]): { calories: number; protein: number } {
  let calories = 0;
  let protein = 0;
  for (const log of logs) {
    if (log.option_chosen === "skip" || log.no_appetite) {
      calories += log.calories_actual ?? 0;
      protein += log.protein_actual ?? 0;
      continue;
    }
    if (log.calories_actual != null && log.protein_actual != null) {
      calories += log.calories_actual;
      protein += log.protein_actual;
      continue;
    }
    const meal = meals.find((m) => m.meal_type === log.meal_type);
    if (meal) {
      calories += meal.calories_est ?? 0;
      protein += meal.protein_g ?? 0;
    }
  }
  return { calories, protein };
}

export interface ExamAlert {
  marker: string;
  alert: string;
  foodsAvoid: string[];
  foodsInclude: string[];
}

export const NUTRITION_EXAM_ALERTS: ExamAlert[] = [
  {
    marker: "TGP",
    alert: "Fígado sob estresse: evite álcool, frituras e ultraprocessados",
    foodsAvoid: ["álcool", "fritura", "embutidos"],
    foodsInclude: ["brócolis", "alho", "cúrcuma", "alcachofra"],
  },
  {
    marker: "Ácido Úrico",
    alert: "Ácido úrico elevado: impacta inflamação no joelho",
    foodsAvoid: ["cerveja", "frutos do mar em excesso", "carnes processadas"],
    foodsInclude: ["água", "cereja", "limão", "gengibre"],
  },
  {
    marker: "LDL",
    alert: "LDL acima do alvo: prefira gorduras boas",
    foodsAvoid: ["manteiga em excesso", "embutidos", "fast food"],
    foodsInclude: ["azeite", "abacate", "oleaginosas", "peixe"],
  },
  {
    marker: "HOMA-IR",
    alert: "Resistência à insulina: nunca consuma carboidrato isolado",
    foodsAvoid: ["pão branco sozinho", "suco sem proteína", "doces"],
    foodsInclude: ["fibras", "proteína em toda refeição", "canela"],
  },
  {
    marker: "Colesterol Total",
    alert: "Colesterol total limítrofe: reduza gorduras saturadas",
    foodsAvoid: ["manteiga", "embutidos", "doces industrializados"],
    foodsInclude: ["aveia", "linhaça", "azeite extra virgem"],
  },
  {
    marker: "Glicose",
    alert: "Glicose acima de 99: priorize fibras e proteína",
    foodsAvoid: ["açúcar simples", "refrigerante", "suco de fruta"],
    foodsInclude: ["fibras", "proteína", "vegetais não amiláceos"],
  },
];
