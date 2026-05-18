-- Migration v2: start_date em medicamentos + pressão arterial
-- Execute no Supabase SQL Editor: https://supabase.com/dashboard/project/kwrfaesckdywplxaeezl/sql

-- 1. Adiciona coluna start_date à tabela medications
ALTER TABLE medications ADD COLUMN IF NOT EXISTS start_date DATE;

-- 2. Cria tabela de pressão arterial
CREATE TABLE IF NOT EXISTS blood_pressure_logs (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  log_date    DATE    NOT NULL DEFAULT CURRENT_DATE,
  log_time    TIME    NOT NULL DEFAULT CURRENT_TIME,
  systolic    INTEGER NOT NULL,
  diastolic   INTEGER NOT NULL,
  pulse       INTEGER,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE blood_pressure_logs DISABLE ROW LEVEL SECURITY;

-- 3. Anastrozol: inicia 19/05/2026, parte da manhã
UPDATE medications
SET start_date = '2026-05-19', time_1 = '07:00'
WHERE name ILIKE '%anastrozol%';

-- 4. Deposteron: inicia 19/05/2026, parte da manhã
UPDATE medications
SET start_date = '2026-05-19', time_1 = '07:00'
WHERE name ILIKE '%deposteron%';

-- 5. Vitamina D: dose 50000 UI
UPDATE medications
SET dose = '50000 UI'
WHERE name ILIKE '%vitamina d%' OR name ILIKE '%vitamin%d%';
