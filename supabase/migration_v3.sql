-- Migration v3: lanches rápidos, métricas corporais, documentos
-- Execute no Supabase SQL Editor: https://supabase.com/dashboard/project/kwrfaesckdywplxaeezl/sql

-- 1. Lanches e frutas rápidas
CREATE TABLE IF NOT EXISTS quick_food_logs (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  log_date    DATE         NOT NULL DEFAULT CURRENT_DATE,
  log_time    TIME         NOT NULL DEFAULT CURRENT_TIME,
  description TEXT         NOT NULL,
  category    TEXT         NOT NULL DEFAULT 'outro', -- 'fruta','lanche','bebida','outro'
  calories    INTEGER,
  protein_g   DECIMAL(5,1),
  created_at  TIMESTAMPTZ  DEFAULT now()
);
ALTER TABLE quick_food_logs DISABLE ROW LEVEL SECURITY;

-- 2. Histórico de peso corporal
CREATE TABLE IF NOT EXISTS body_weight_logs (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  log_date    DATE         NOT NULL DEFAULT CURRENT_DATE,
  weight_kg   DECIMAL(5,1) NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ  DEFAULT now(),
  UNIQUE(log_date)
);
ALTER TABLE body_weight_logs DISABLE ROW LEVEL SECURITY;

-- 3. Medidas corporais
CREATE TABLE IF NOT EXISTS body_measurements (
  id         UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  log_date   DATE         NOT NULL DEFAULT CURRENT_DATE,
  waist_cm   DECIMAL(5,1),
  chest_cm   DECIMAL(5,1),
  hips_cm    DECIMAL(5,1),
  arm_cm     DECIMAL(5,1),
  thigh_cm   DECIMAL(5,1),
  neck_cm    DECIMAL(5,1),
  notes      TEXT,
  created_at TIMESTAMPTZ  DEFAULT now()
);
ALTER TABLE body_measurements DISABLE ROW LEVEL SECURITY;

-- 4. Documentos (exames PDF, cardápio, série de treino)
CREATE TABLE IF NOT EXISTS profile_documents (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  doc_type    TEXT        NOT NULL, -- 'exam','nutrition_plan','workout_plan','other'
  title       TEXT        NOT NULL,
  file_url    TEXT,
  file_name   TEXT,
  valid_from  DATE,
  valid_days  INTEGER,    -- para série de treino: 30
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE profile_documents DISABLE ROW LEVEL SECURITY;

-- 5. Storage bucket para documentos
-- Execute separadamente se der erro de permissão:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 'documents', true, 52428800,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao bucket (sem autenticação — app single-user)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname='docs_insert') THEN
    EXECUTE 'CREATE POLICY docs_insert ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''documents'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname='docs_select') THEN
    EXECUTE 'CREATE POLICY docs_select ON storage.objects FOR SELECT USING (bucket_id = ''documents'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND policyname='docs_delete') THEN
    EXECUTE 'CREATE POLICY docs_delete ON storage.objects FOR DELETE USING (bucket_id = ''documents'')';
  END IF;
END $$;
