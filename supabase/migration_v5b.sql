-- Migration v5b: trigger para criar perfil automaticamente no signup
-- Execute em: https://supabase.com/dashboard/project/kwrfaesckdywplxaeezl/sql
--
-- IMPORTANTE: Execute ESTE arquivo AGORA para corrigir o erro de RLS no cadastro.

-- Função que cria o perfil usando os dados enviados via raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- roda como superusuário, bypassando RLS
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    birth_date,
    weight_kg,
    height_cm,
    wake_time,
    sleep_time,
    onboarding_done,
    ai_nutrition_generated,
    ai_workout_generated,
    diet_renewal_months,
    workout_renewal_months
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Novo Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'birth_date', CURRENT_DATE::text),
    COALESCE((NEW.raw_user_meta_data->>'weight_kg')::decimal, 70),
    COALESCE((NEW.raw_user_meta_data->>'height_cm')::decimal, 170),
    COALESCE(NEW.raw_user_meta_data->>'wake_time', '06:00:00'),
    COALESCE(NEW.raw_user_meta_data->>'sleep_time', '22:00:00'),
    FALSE,
    FALSE,
    FALSE,
    1,
    1
  )
  ON CONFLICT (id) DO NOTHING;  -- evita erro se perfil já existir
  RETURN NEW;
END;
$$;

-- Trigger: dispara após criação de usuário no auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
