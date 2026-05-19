-- Migration v6: remove trigger problemático, garantir colunas do perfil
-- Execute em: https://supabase.com/dashboard/project/kwrfaesckdywplxaeezl/sql

-- Remove o trigger que causava "Database error saving new user"
-- O perfil agora é criado pela rota /api/auth/signup usando service role
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Garantir que todas as colunas do perfil existem (idempotente)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_done boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS food_restrictions text,
  ADD COLUMN IF NOT EXISTS mobility_restrictions text,
  ADD COLUMN IF NOT EXISTS ai_nutrition_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_workout_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_diet_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_workout_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS diet_renewal_months integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS workout_renewal_months integer NOT NULL DEFAULT 1;
