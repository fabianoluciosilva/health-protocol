// ─── Módulo 1 — Medicamentos ───────────────────────────────────────────────

export type Frequency = "daily" | "weekly" | "every_10_days";

export interface Profile {
  id: string;
  created_at: string;
  name: string;
  birth_date: string;
  weight_kg: number;
  height_cm: number;
  wake_time: string;
  sleep_time: string;
  onboarding_done: boolean;
  food_restrictions: string | null;
  mobility_restrictions: string | null;
  ai_nutrition_generated: boolean;
  ai_workout_generated: boolean;
  last_diet_generated_at: string | null;
  last_workout_generated_at: string | null;
  diet_renewal_months: number;
  workout_renewal_months: number;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: Frequency;
  week_day: number | null;
  time_1: string;
  time_2: string | null;
  notes: string | null;
  color: string;
  active: boolean;
  start_date: string | null;
  created_at: string;
}

export interface BloodPressureLog {
  id: string;
  log_date: string;
  log_time: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  notes: string | null;
  created_at: string;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  scheduled_date: string;
  scheduled_time: string;
  taken_at: string | null;
  taken: boolean;
  created_at: string;
}

export interface ExamAnalysisCritical {
  marker: string;
  valor: number;
  unidade: string;
  status: "high" | "low";
  explicacao: string;
}

export interface ExamAnalysisDelta {
  marker: string;
  anterior: number;
  atual: number;
  unidade: string;
  comentario: string;
}

export interface ExamAnalysis {
  summary: string;
  overall: "bom" | "atencao" | "critico";
  criticos: ExamAnalysisCritical[];
  melhorou: ExamAnalysisDelta[];
  piorou: ExamAnalysisDelta[];
  normais: string[];
  recomendacoes: string[];
}

export interface LabExam {
  id: string;
  exam_date: string;
  lab_name: string | null;
  created_at: string;
  ai_analysis: ExamAnalysis | null;
}

export interface LabResult {
  id: string;
  exam_id: string;
  marker: string;
  value: number;
  unit: string;
  ref_min: number | null;
  ref_max: number | null;
  status: "low" | "high" | "normal";
  category: string | null;
  created_at: string;
}

// ─── Módulo 2 — Nutrição ───────────────────────────────────────────────────

export type MealType = "breakfast" | "lunch" | "snack" | "dinner" | "ceia";
export type OptionChosen = "a" | "b" | "c" | "skip";

export interface Meal {
  id: string;
  day_of_week: number;
  meal_type: MealType;
  meal_time: string;
  option_a: string;
  option_b: string;
  option_c: string;
  calories_est: number | null;
  protein_g: number | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface MealLog {
  id: string;
  log_date: string;
  meal_type: MealType;
  option_chosen: OptionChosen | null;
  no_appetite: boolean;
  notes: string | null;
  calories_actual: number | null;
  protein_actual: number | null;
  created_at: string;
}

export interface WaterLog {
  id: string;
  log_date: string;
  ml_consumed: number;
  goal_ml: number;
  is_training_day: boolean;
  created_at: string;
}

// ─── Módulo 3 — Musculação ─────────────────────────────────────────────────

export interface MuscleGroup {
  id: string;
  name: string;
  color: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group_id: string;
  muscle_group?: MuscleGroup;
  sets: number;
  reps: string;
  rest_seconds: number;
  technique_tip: string | null;
  youtube_video_id: string | null;
  youtube_channel: string;
  knee_safe: boolean;
  equipment: string | null;
  created_at: string;
}

export interface WorkoutSplit {
  id: string;
  day_of_week: number;
  split_name: string;
  split_description: string | null;
  is_rest_day: boolean;
  rest_type: "active" | "complete" | null;
  color: string;
  created_at: string;
}

export interface SplitExercise {
  id: string;
  split_id: string;
  exercise_id: string;
  exercise?: Exercise;
  order_index: number;
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  session_date: string;
  split_id: string | null;
  split?: WorkoutSplit;
  started_at: string | null;
  completed_at: string | null;
  completed: boolean;
  notes: string | null;
  created_at: string;
}

export interface ExerciseLog {
  id: string;
  session_id: string;
  exercise_id: string;
  exercise?: Exercise;
  weight_kg: number | null;
  sets_done: number | null;
  reps_done: string | null;
  completed: boolean;
  notes: string | null;
  created_at: string;
}

export interface WeightHistory {
  id: string;
  exercise_id: string;
  log_date: string;
  weight_kg: number;
  created_at: string;
}

export interface QuickFoodLog {
  id: string;
  log_date: string;
  log_time: string;
  description: string;
  category: "fruta" | "lanche" | "bebida" | "outro";
  calories: number | null;
  protein_g: number | null;
  created_at: string;
}

export interface BodyWeightLog {
  id: string;
  log_date: string;
  weight_kg: number;
  notes: string | null;
  created_at: string;
}

export interface BodyMeasurement {
  id: string;
  log_date: string;
  waist_cm: number | null;
  chest_cm: number | null;
  hips_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  neck_cm: number | null;
  notes: string | null;
  created_at: string;
}

export interface ProfileDocument {
  id: string;
  doc_type: "exam" | "nutrition_plan" | "workout_plan" | "other";
  title: string;
  file_url: string | null;
  file_name: string | null;
  valid_from: string | null;
  valid_days: number | null;
  notes: string | null;
  created_at: string;
}

// ─── Database schema ───────────────────────────────────────────────────────

type TableDef<TRow, TInsert = Partial<TRow>, TUpdate = Partial<TRow>> = {
  Row: TRow;
  Insert: TInsert;
  Update: TUpdate;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      medications: TableDef<Medication>;
      medication_logs: TableDef<MedicationLog>;
      lab_exams: TableDef<LabExam>;
      lab_results: TableDef<LabResult>;
      meals: TableDef<Meal>;
      meal_logs: TableDef<MealLog>;
      water_logs: TableDef<WaterLog>;
      muscle_groups: TableDef<MuscleGroup>;
      exercises: TableDef<Exercise>;
      workout_splits: TableDef<WorkoutSplit>;
      split_exercises: TableDef<SplitExercise>;
      workout_sessions: TableDef<WorkoutSession>;
      exercise_logs: TableDef<ExerciseLog>;
      weight_history: TableDef<WeightHistory>;
      blood_pressure_logs: TableDef<BloodPressureLog>;
      quick_food_logs: TableDef<QuickFoodLog>;
      body_weight_logs: TableDef<BodyWeightLog>;
      body_measurements: TableDef<BodyMeasurement>;
      profile_documents: TableDef<ProfileDocument>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
