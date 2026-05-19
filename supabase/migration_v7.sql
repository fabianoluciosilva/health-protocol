-- Migration v7: isolamento de dados por usuário (multi-user)
-- Execute em: https://supabase.com/dashboard/project/kwrfaesckdywplxaeezl/sql

-- 1) Adicionar coluna user_id em todas as tabelas de dados (DEFAULT auth.uid())
ALTER TABLE public.medications          ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.medication_logs      ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.blood_pressure_logs  ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.lab_exams            ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.lab_results          ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.meals                ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.meal_logs            ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.water_logs           ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.workout_splits       ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.split_exercises      ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.workout_sessions     ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.exercise_logs        ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.weight_history       ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.quick_food_logs      ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.body_weight_logs     ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.body_measurements    ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profile_documents    ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2) Backfill: associa todos os dados existentes ao usuário original (Fabiano)
DO $$
DECLARE
  fabiano_id uuid;
BEGIN
  SELECT id INTO fabiano_id FROM auth.users WHERE email = 'fabianoluciosilva@gmail.com' LIMIT 1;
  IF fabiano_id IS NULL THEN
    RAISE EXCEPTION 'Usuário fabianoluciosilva@gmail.com não encontrado em auth.users';
  END IF;

  UPDATE public.medications         SET user_id = fabiano_id WHERE user_id IS NULL;
  UPDATE public.medication_logs     SET user_id = fabiano_id WHERE user_id IS NULL;
  UPDATE public.blood_pressure_logs SET user_id = fabiano_id WHERE user_id IS NULL;
  UPDATE public.lab_exams           SET user_id = fabiano_id WHERE user_id IS NULL;
  UPDATE public.lab_results         SET user_id = fabiano_id WHERE user_id IS NULL;
  UPDATE public.meals               SET user_id = fabiano_id WHERE user_id IS NULL;
  UPDATE public.meal_logs           SET user_id = fabiano_id WHERE user_id IS NULL;
  UPDATE public.water_logs          SET user_id = fabiano_id WHERE user_id IS NULL;
  UPDATE public.workout_splits      SET user_id = fabiano_id WHERE user_id IS NULL;
  UPDATE public.split_exercises     SET user_id = fabiano_id WHERE user_id IS NULL;
  UPDATE public.workout_sessions    SET user_id = fabiano_id WHERE user_id IS NULL;
  UPDATE public.exercise_logs       SET user_id = fabiano_id WHERE user_id IS NULL;
  UPDATE public.weight_history      SET user_id = fabiano_id WHERE user_id IS NULL;
  UPDATE public.quick_food_logs     SET user_id = fabiano_id WHERE user_id IS NULL;
  UPDATE public.body_weight_logs    SET user_id = fabiano_id WHERE user_id IS NULL;
  UPDATE public.body_measurements   SET user_id = fabiano_id WHERE user_id IS NULL;
  UPDATE public.profile_documents   SET user_id = fabiano_id WHERE user_id IS NULL;
END $$;

-- 3) Forçar NOT NULL agora que existe valor em todas as linhas
ALTER TABLE public.medications          ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.medication_logs      ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.blood_pressure_logs  ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.lab_exams            ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.lab_results          ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.meals                ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.meal_logs            ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.water_logs           ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.workout_splits       ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.split_exercises      ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.workout_sessions     ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.exercise_logs        ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.weight_history       ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.quick_food_logs      ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.body_weight_logs     ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.body_measurements    ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.profile_documents    ALTER COLUMN user_id SET NOT NULL;

-- 4) Substituir policies: cada usuário só vê seus próprios dados

-- profiles (id já é o user id)
DROP POLICY IF EXISTS "auth_all" ON public.profiles;
DROP POLICY IF EXISTS "user_isolation" ON public.profiles;
CREATE POLICY "user_isolation" ON public.profiles
  FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Tabelas de dados do usuário
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'medications','medication_logs','blood_pressure_logs','lab_exams','lab_results',
    'meals','meal_logs','water_logs','workout_splits','split_exercises',
    'workout_sessions','exercise_logs','weight_history','quick_food_logs',
    'body_weight_logs','body_measurements','profile_documents'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth_all" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "user_isolation" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "user_isolation" ON public.%I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
      t
    );
  END LOOP;
END $$;

-- Tabelas globais (catálogo de referência) — todos os autenticados podem ler
-- (mantém policy auth_all existente em muscle_groups e exercises)
