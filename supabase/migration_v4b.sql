-- Migration v4b: habilitar RLS em todas as tabelas
-- EXECUTE SOMENTE APÓS:
--   1. Criar o usuário no Supabase Auth (painel > Authentication > Users > Add user)
--      Email: fabianoluciosilva@gmail.com  Senha: [definir no painel]
--   2. Fazer login no app e confirmar que funciona
--   3. Executar migration_v4a.sql

-- Habilitar RLS
ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_pressure_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_exams              ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results            ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE muscle_groups          ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises              ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_splits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_exercises        ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_history         ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_food_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_weight_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_documents      ENABLE ROW LEVEL SECURITY;

-- Políticas: qualquer usuário autenticado acessa todos os dados
-- (app single-user — não há separação por user_id)
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'profiles','medications','medication_logs','blood_pressure_logs',
    'lab_exams','lab_results','meals','meal_logs','water_logs',
    'muscle_groups','exercises','workout_splits','split_exercises',
    'workout_sessions','exercise_logs','weight_history','quick_food_logs',
    'body_weight_logs','body_measurements','profile_documents'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS auth_all ON %I', t);
    EXECUTE format(
      'CREATE POLICY auth_all ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;

-- Políticas de storage (documentos)
DROP POLICY IF EXISTS docs_insert ON storage.objects;
DROP POLICY IF EXISTS docs_select ON storage.objects;
DROP POLICY IF EXISTS docs_delete ON storage.objects;

CREATE POLICY docs_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY docs_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY docs_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents');
