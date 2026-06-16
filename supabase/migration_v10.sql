-- Migration v10: medidas corporais com 1 registro por dia (upsert)
-- Mantém o histórico de datas diferentes; cadastrar na mesma data substitui o registro.
-- Execute em: https://supabase.com/dashboard/project/kwrfaesckdywplxaeezl/sql

-- 1) Remover duplicatas por (user_id, log_date), mantendo o registro mais recente
DELETE FROM public.body_measurements a
USING public.body_measurements b
WHERE a.user_id = b.user_id
  AND a.log_date = b.log_date
  AND (a.created_at < b.created_at
       OR (a.created_at = b.created_at AND a.id < b.id));

-- 2) Garantir unicidade por usuário + data (permite upsert onConflict user_id,log_date)
ALTER TABLE public.body_measurements
  DROP CONSTRAINT IF EXISTS body_measurements_user_date_key;
ALTER TABLE public.body_measurements
  ADD CONSTRAINT body_measurements_user_date_key UNIQUE (user_id, log_date);
