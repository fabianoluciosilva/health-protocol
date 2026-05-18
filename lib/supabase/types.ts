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

export interface LabExam {
  id: string;
  exam_date: string;
  lab_name: string | null;
  created_at: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
