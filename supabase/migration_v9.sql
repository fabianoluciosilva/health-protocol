-- Migration v9: campos de anamnese para IA personalizada
-- Execute em: https://supabase.com/dashboard/project/kwrfaesckdywplxaeezl/sql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fitness_goal          TEXT DEFAULT 'perda_de_peso',
  ADD COLUMN IF NOT EXISTS training_experience   TEXT DEFAULT 'iniciante',
  ADD COLUMN IF NOT EXISTS training_days_per_week INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS available_equipment   TEXT DEFAULT 'academia',
  ADD COLUMN IF NOT EXISTS health_conditions     TEXT;
