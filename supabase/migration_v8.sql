-- Migration v8: análise de IA nos exames laboratoriais
-- Execute em: https://supabase.com/dashboard/project/kwrfaesckdywplxaeezl/sql

ALTER TABLE public.lab_exams ADD COLUMN IF NOT EXISTS ai_analysis JSONB;
