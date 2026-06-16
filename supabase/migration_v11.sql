-- Migration v11: composição corporal (avaliação física / bioimpedância / Shaped)
-- Amplia body_measurements para guardar os dados da avaliação da nutricionista.
-- Execute em: https://supabase.com/dashboard/project/kwrfaesckdywplxaeezl/sql

ALTER TABLE public.body_measurements
  ADD COLUMN IF NOT EXISTS forearm_cm          DECIMAL(5,1),
  ADD COLUMN IF NOT EXISTS calf_cm             DECIMAL(5,1),
  ADD COLUMN IF NOT EXISTS body_fat_pct        DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS lean_mass_kg        DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS fat_mass_kg         DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS body_water_l        DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS body_water_pct      DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS rmr_kcal            INTEGER,
  ADD COLUMN IF NOT EXISTS waist_height_ratio  DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS waist_hip_ratio     DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS conicity_index      DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS shaped_score        INTEGER,
  ADD COLUMN IF NOT EXISTS source              TEXT DEFAULT 'manual';
