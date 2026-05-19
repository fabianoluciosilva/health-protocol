-- Migration v5: restrições de perfil + controle de IA + ciclos de renovação
-- Execute em: https://supabase.com/dashboard/project/kwrfaesckdywplxaeezl/sql

-- Req 2: restrições alimentares e de mobilidade
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS food_restrictions    TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mobility_restrictions TEXT;

-- Req 3: controle de geração por IA
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_nutrition_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_workout_generated   BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_diet_generated_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_workout_generated_at TIMESTAMPTZ;

-- Req 4: ciclos de renovação (1 ou 3 meses)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS diet_renewal_months    INT DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS workout_renewal_months INT DEFAULT 1;

-- Usuário existente: marcar IA como ainda não gerada (vai acionar no primeiro acesso)
UPDATE profiles SET
  ai_nutrition_generated  = FALSE,
  ai_workout_generated    = FALSE,
  diet_renewal_months     = 1,
  workout_renewal_months  = 1
WHERE ai_nutrition_generated IS NULL;
