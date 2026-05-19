-- Migration v4a: regras de medicamentos + ceia + onboarding_done
-- EXECUTE ANTES de criar o usuário de auth e antes do v4b
-- URL: https://supabase.com/dashboard/project/kwrfaesckdywplxaeezl/sql

-- ─── 1. Regras de medicamentos ───────────────────────────────────────────────

-- Anastrozol: semanal, toda terça-feira (week_day=3), manhã
UPDATE medications
SET frequency   = 'weekly',
    week_day    = 3,
    time_1      = '08:00',
    time_2      = NULL,
    start_date  = '2026-05-19'
WHERE name ILIKE '%anastrozol%';

-- Deposteron: a cada 10 dias, referência 19/05 (terça), manhã
UPDATE medications
SET frequency   = 'every_10_days',
    week_day    = NULL,
    time_1      = '08:00',
    time_2      = NULL,
    start_date  = '2026-05-19'
WHERE name ILIKE '%deposteron%';

-- ─── 2. Nova refeição: Ceia (23h) ────────────────────────────────────────────

-- Atualizar constraint de meal_type para incluir 'ceia'
ALTER TABLE meals DROP CONSTRAINT IF EXISTS meals_meal_type_check;
ALTER TABLE meals ADD CONSTRAINT meals_meal_type_check
  CHECK (meal_type IN ('breakfast','lunch','snack','dinner','ceia'));

ALTER TABLE meal_logs DROP CONSTRAINT IF EXISTS meal_logs_meal_type_check;
ALTER TABLE meal_logs ADD CONSTRAINT meal_logs_meal_type_check
  CHECK (meal_type IN ('breakfast','lunch','snack','dinner','ceia'));

-- Inserir Ceia para todos os dias da semana
INSERT INTO meals (day_of_week, meal_type, meal_time, option_a, option_b, option_c,
                   calories_est, protein_g, notes, tags)
SELECT
  d,
  'ceia',
  '23:00',
  'Iogurte grego 150g + 1 col mel',
  '1 fatia pão integral + cream cheese light',
  'Whey protein 1 scoop com leite morno',
  180,
  18,
  'Refeição leve pré-sono',
  ARRAY['casa']
FROM generate_series(1, 7) AS d;

-- ─── 3. Coluna onboarding_done em profiles ───────────────────────────────────

-- DEFAULT TRUE: usuário existente já está "onboarded"
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN DEFAULT TRUE;
-- Novos usuários criados futuramente receberão FALSE
ALTER TABLE profiles ALTER COLUMN onboarding_done SET DEFAULT FALSE;
-- Garantir que o registro existente seja marcado como concluído
UPDATE profiles SET onboarding_done = TRUE WHERE onboarding_done IS NULL;
