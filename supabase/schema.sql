-- Health Protocol — Módulo 1: Medicamentos
-- Schema completo (perfil + medicamentos + logs + exames)

-- ============================================================
-- TABELAS
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL DEFAULT 'Fabiano',
  birth_date DATE DEFAULT '1979-11-19',
  weight_kg DECIMAL(5,2) DEFAULT 130.0,
  height_cm INTEGER DEFAULT 180,
  wake_time TIME DEFAULT '08:00',
  sleep_time TIME DEFAULT '23:50'
);

CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  dose TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'every_10_days')),
  week_day INTEGER,
  time_1 TIME NOT NULL,
  time_2 TIME,
  notes TEXT,
  color TEXT DEFAULT '#1A5276',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  taken_at TIMESTAMPTZ,
  taken BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(medication_id, scheduled_date, scheduled_time)
);

CREATE TABLE IF NOT EXISTS lab_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_date DATE NOT NULL DEFAULT '2026-01-17',
  lab_name TEXT DEFAULT 'Láfe Laboratório',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES lab_exams(id) ON DELETE CASCADE,
  marker TEXT NOT NULL,
  value DECIMAL(10,3) NOT NULL,
  unit TEXT NOT NULL,
  ref_min DECIMAL(10,3),
  ref_max DECIMAL(10,3),
  status TEXT GENERATED ALWAYS AS (
    CASE
      WHEN ref_min IS NOT NULL AND value < ref_min THEN 'low'
      WHEN ref_max IS NOT NULL AND value > ref_max THEN 'high'
      ELSE 'normal'
    END
  ) STORED,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS — desabilitado (app single-user, sem auth no módulo 1)
-- ============================================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE medications DISABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE lab_exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- SEEDS
-- ============================================================

INSERT INTO profiles (name, birth_date, weight_kg, height_cm, wake_time, sleep_time)
SELECT 'Fabiano', '1979-11-19', 130.0, 180, '08:00', '23:50'
WHERE NOT EXISTS (SELECT 1 FROM profiles);

INSERT INTO medications (name, dose, frequency, week_day, time_1, time_2, notes, color)
SELECT * FROM (VALUES
  ('Olmecor', '40mg', 'daily', NULL::INTEGER, '09:30'::TIME, NULL::TIME, 'Tomar junto com o café da manhã. Controle de pressão arterial.', '#2874A6'),
  ('Dapagliflozina', '10mg', 'daily', NULL, '09:00'::TIME, NULL, 'Tomar antes do café da manhã. Efeito diurético — aumentar ingestão de água.', '#1A5276'),
  ('Glifage XR', '500mg', 'daily', NULL, '20:30'::TIME, NULL, 'SEMPRE após o jantar. Nunca tomar de estômago vazio — risco de hipoglicemia.', '#C0392B'),
  ('Vitamina D', '2000UI', 'weekly', 2, '09:30'::TIME, NULL, 'Toda segunda-feira junto com o café. Monitorar nível (atual: 24 ng/mL).', '#F39C12'),
  ('Mounjaro', '2,5mg', 'weekly', 2, '09:00'::TIME, NULL, 'Toda segunda-feira. Mês 1: 2,5mg → Mês 2: 5mg. Retarda esvaziamento gástrico.', '#8E44AD'),
  ('Anastrozol', '1mg', 'weekly', 2, '10:00'::TIME, NULL, 'Toda segunda-feira. Inicia 18/05. Bloqueador de estrogênio — usar com TRT.', '#6E2F7E'),
  ('Deposteron', '200mg', 'every_10_days', NULL, '10:30'::TIME, NULL, 'A cada 10 dias. Inicia 18/05. TRT — reposição de testosterona.', '#117A65')
) AS v(name, dose, frequency, week_day, time_1, time_2, notes, color)
WHERE NOT EXISTS (SELECT 1 FROM medications);

INSERT INTO lab_exams (exam_date, lab_name)
SELECT '2026-01-17'::DATE, 'Láfe Laboratório'
WHERE NOT EXISTS (SELECT 1 FROM lab_exams);

INSERT INTO lab_results (exam_id, marker, value, unit, ref_min, ref_max, category)
SELECT e.id, m.marker, m.value, m.unit, m.ref_min, m.ref_max, m.category
FROM lab_exams e
CROSS JOIN (VALUES
  ('Glicose',          110.0, 'mg/dL',  70.0,   99.0,  'metabolic'),
  ('HbA1c',              6.0, '%',      NULL,    5.7,  'metabolic'),
  ('Insulina',          31.0, 'mU/L',   NULL,   13.0,  'metabolic'),
  ('HOMA-IR',            8.3, 'índice', NULL,    2.71, 'metabolic'),
  ('Colesterol Total', 225.0, 'mg/dL',  NULL,  190.0,  'lipid'),
  ('LDL',              146.0, 'mg/dL',  NULL,  100.0,  'lipid'),
  ('HDL',               53.0, 'mg/dL',  40.0,   NULL,  'lipid'),
  ('Triglicérides',    134.0, 'mg/dL',  NULL,  150.0,  'lipid'),
  ('TGO',               25.0, 'U/L',    NULL,   50.0,  'hepatic'),
  ('TGP',               75.0, 'U/L',    NULL,   50.0,  'hepatic'),
  ('Gama-GT',           60.0, 'U/L',    12.0,   73.0,  'hepatic'),
  ('Creatinina',         1.18,'mg/dL',   0.70,   1.30, 'renal'),
  ('Ácido Úrico',        7.8, 'mg/dL',   3.4,    7.0,  'renal'),
  ('Ferritina',        640.0, 'µg/L',   26.0,  446.0,  'blood'),
  ('Vitamina D',        24.0, 'ng/mL',  20.0,   60.0,  'hormonal'),
  ('Testosterona',     374.0, 'ng/dL', 240.0,  816.0,  'hormonal'),
  ('Estradiol',          3.4, 'ng/dL',   1.1,    4.3,  'hormonal'),
  ('TSH',                2.6, 'mUI/L',   0.45,   4.5,  'hormonal'),
  ('T4 Livre',           1.3, 'ng/dL',   0.9,    1.7,  'hormonal'),
  ('Vitamina B12',     518.0, 'ng/L',  300.0,   NULL,  'blood')
) AS m(marker, value, unit, ref_min, ref_max, category)
WHERE e.exam_date = '2026-01-17'
AND NOT EXISTS (SELECT 1 FROM lab_results WHERE exam_id = e.id);
