-- Health Protocol — Schema completo (todos os módulos)
-- Módulo 1: Medicamentos | Módulo 2: Nutrição | Módulo 3: Musculação

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
  ('Vitamina B12',     518.0, 'ng/L',  300.0,   NULL,  'blood'),
  -- Hormônios completos
  ('DHT',              26.0, 'ng/dL',  16.0,   79.0,  'hormonal'),
  ('SHBG',             43.0, 'nmol/L', 18.0,   54.0,  'hormonal'),
  ('LH',                4.3, 'UI/L',   NULL,    9.0,  'hormonal'),
  ('FSH',               4.5, 'UI/L',   NULL,   10.0,  'hormonal'),
  ('Prolactina',       15.0, 'µg/L',   NULL,   20.0,  'hormonal'),
  -- Lipídeos completos
  ('VLDL',             26.0, 'mg/dL',  NULL,   30.0,  'lipid'),
  ('Não-HDL',         172.0, 'mg/dL',  NULL,  130.0,  'lipid'),
  -- Músculo e metabolismo
  ('CK Total',        217.0, 'U/L',    38.0,  174.0,  'metabolic'),
  ('Ferro',            85.0, 'µg/dL',  65.0,  175.0,  'blood'),
  ('Ureia',            35.0, 'mg/dL',  10.0,   50.0,  'renal'),
  -- Bilirrubinas
  ('Bilirrubina Direta',   0.09, 'mg/dL', 0.00, 0.30, 'hepatic'),
  ('Bilirrubina Indireta', 0.07, 'mg/dL', 0.20, 0.80, 'hepatic'),
  ('Bilirrubina Total',    0.16, 'mg/dL', 0.20, 1.10, 'hepatic'),
  -- Hemograma
  ('Hemoglobina',      13.4, 'g/dL',   13.3,  16.5,  'blood'),
  ('Hematócrito',      42.8, '%',       39.2,  49.0,  'blood'),
  ('Leucócitos',     4880.0, '/mm3',  3650.0, 8120.0, 'blood'),
  ('Plaquetas',     246000.0,'mm3',  151000.0,304000.0,'blood'),
  -- Fosfatase Alcalina
  ('Fosfatase Alcalina', 52.0, 'U/L',  40.0,  129.0,  'hepatic')
) AS m(marker, value, unit, ref_min, ref_max, category)
WHERE e.exam_date = '2026-01-17'
AND NOT EXISTS (SELECT 1 FROM lab_results WHERE exam_id = e.id);

-- ============================================================
-- MÓDULO 2 — Nutrição
-- ============================================================

CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snack', 'dinner')),
  meal_time TIME NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  calories_est INTEGER,
  protein_g INTEGER,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snack', 'dinner')),
  option_chosen TEXT CHECK (option_chosen IN ('a', 'b', 'c', 'skip')),
  no_appetite BOOLEAN DEFAULT false,
  notes TEXT,
  calories_actual INTEGER,
  protein_actual INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date DATE NOT NULL UNIQUE,
  ml_consumed INTEGER NOT NULL DEFAULT 0,
  goal_ml INTEGER NOT NULL DEFAULT 3000,
  is_training_day BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE meals DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- MÓDULO 2 — SEEDS: Cardápio semanal
-- day_of_week: 1=Dom 2=Seg 3=Ter 4=Qua 5=Qui 6=Sex 7=Sab
-- ============================================================

INSERT INTO meals (day_of_week, meal_type, meal_time, option_a, option_b, option_c, calories_est, protein_g, notes, tags)
SELECT * FROM (VALUES
  -- SEGUNDA (2) -------------------------------------------------------
  (2,'breakfast','08:30'::TIME,
   '3 ovos mexidos + 2 fatias pão integral + café sem açúcar',
   'Iogurte grego integral 200g + 1 scoop whey + frutas vermelhas',
   'Omelete 3 ovos + queijo minas frescal + café sem açúcar',
   420, 35, 'Tomar Dapagliflozina antes. Olmecor e Vit D junto.', ARRAY['casa']),
  (2,'lunch','12:30'::TIME,
   'Frango grelhado 200g + arroz integral 2 col + salada verde',
   'Carne bovina magra 200g + batata-doce 150g + legumes',
   'Atum 150g + 2 col arroz integral + brócolis refogado',
   550, 45, 'Sempre incluir proteína. Evitar suco de fruta.', ARRAY['casa','viagem']),
  (2,'snack','16:00'::TIME,
   '1 scoop whey + água + 1 banana',
   'Iogurte grego 150g + granola sem açúcar 30g',
   '2 ovos cozidos + 1 maçã',
   220, 25, NULL, ARRAY['casa','rapido']),
  (2,'dinner','20:00'::TIME,
   'Frango 180g + couve-flor ou chuchu + salada',
   'Omelete 3 ovos + queijo + legumes refogados',
   'Peixe grelhado 200g + legumes no vapor',
   480, 40, 'Tomar Glifage XR APÓS o jantar.', ARRAY['casa']),

  -- TERÇA (3) ---------------------------------------------------------
  (3,'breakfast','08:30'::TIME,
   '3 ovos mexidos + 2 fatias pão integral + café sem açúcar',
   'Crepioca (2 ovos + 2 col tapioca) + queijo minas + café',
   'Iogurte grego 200g + 1 scoop whey + frutas vermelhas',
   410, 34, 'Tomar Dapagliflozina antes.', ARRAY['casa']),
  (3,'lunch','12:30'::TIME,
   'Frango grelhado 200g + arroz integral 2 col + salada verde',
   'Patinho moído 200g + batata-doce 150g + couve refogada',
   'Salmão 180g + arroz integral 2 col + legumes',
   560, 44, NULL, ARRAY['casa','viagem']),
  (3,'snack','16:00'::TIME,
   '1 scoop whey + água + 1 banana',
   'Queijo cottage 150g + 4 torradas integrais',
   '1 punhado castanhas + 1 fruta',
   200, 22, NULL, ARRAY['casa','rapido']),
  (3,'dinner','20:00'::TIME,
   'Tilápia 200g + abobrinha + salada verde',
   'Frango desfiado 180g + legumes refogados',
   'Omelete 3 ovos + espinafre + queijo light',
   460, 40, 'Glifage XR após o jantar.', ARRAY['casa']),

  -- QUARTA (4) --------------------------------------------------------
  (4,'breakfast','08:30'::TIME,
   '3 ovos mexidos + 2 fatias pão integral + café',
   'Iogurte grego 200g + 1 scoop whey + frutas vermelhas',
   'Omelete 3 ovos + presunto de peru + café',
   420, 35, 'Tomar Dapagliflozina antes.', ARRAY['casa']),
  (4,'lunch','12:30'::TIME,
   'Frango grelhado 200g + arroz integral 2 col + salada',
   'Carne bovina 200g + batata-doce 150g + legumes',
   'Atum 150g + 2 col arroz integral + brócolis',
   550, 44, NULL, ARRAY['casa','viagem']),
  (4,'snack','16:00'::TIME,
   '1 scoop whey + água + 1 maçã',
   'Iogurte grego 150g + granola sem açúcar 30g',
   '2 ovos cozidos + pepino',
   210, 24, NULL, ARRAY['casa','rapido']),
  (4,'dinner','20:00'::TIME,
   'Frango 180g + abobrinha grelhada + salada',
   'Peixe 200g + legumes no vapor',
   'Omelete 3 ovos + queijo + salada',
   470, 40, 'Glifage XR após o jantar.', ARRAY['casa']),

  -- QUINTA (5) --------------------------------------------------------
  (5,'breakfast','08:30'::TIME,
   '3 ovos mexidos + 2 fatias pão integral + café',
   'Crepioca 2 ovos + queijo + café',
   'Iogurte grego 200g + 1 scoop whey + frutas',
   420, 35, 'Tomar Dapagliflozina antes.', ARRAY['casa']),
  (5,'lunch','12:30'::TIME,
   'Frango grelhado 200g + arroz integral 2 col + salada',
   'Filé de peixe 200g + batata-doce 150g + legumes',
   'Carne magra 200g + arroz integral + couve',
   550, 44, NULL, ARRAY['casa','viagem']),
  (5,'snack','16:00'::TIME,
   '1 scoop whey + água + 1 banana',
   'Iogurte grego 150g + amendoim 30g',
   '2 ovos cozidos + 1 fruta',
   220, 25, NULL, ARRAY['casa','rapido']),
  (5,'dinner','20:00'::TIME,
   'Tilápia 200g + legumes no vapor + salada',
   'Frango 180g + couve-flor + salada verde',
   'Omelete 3 ovos + ricota + legumes',
   460, 39, 'Glifage XR após o jantar.', ARRAY['casa']),

  -- SEXTA (6) ---------------------------------------------------------
  (6,'breakfast','08:30'::TIME,
   '3 ovos mexidos + 2 fatias pão integral + café',
   'Iogurte grego 200g + 1 scoop whey + frutas',
   'Omelete 3 ovos + queijo + café',
   420, 35, 'Tomar Dapagliflozina antes.', ARRAY['casa']),
  (6,'lunch','12:30'::TIME,
   'Frango grelhado 200g + arroz integral 2 col + salada',
   'Salmão 180g + legumes + arroz integral',
   'Carne bovina 200g + batata-doce 150g + salada',
   560, 44, NULL, ARRAY['casa','viagem']),
  (6,'snack','16:00'::TIME,
   '1 scoop whey + água + 1 fruta',
   'Iogurte grego 150g + granola 30g',
   '1 punhado castanhas + 1 banana',
   210, 23, NULL, ARRAY['casa','rapido']),
  (6,'dinner','20:00'::TIME,
   'Frango 180g + abobrinha grelhada + salada',
   'Omelete 3 ovos + queijo light + legumes',
   'Peixe 200g + legumes refogados',
   470, 40, 'Glifage XR após o jantar.', ARRAY['casa']),

  -- SÁBADO (7) --------------------------------------------------------
  (7,'breakfast','09:00'::TIME,
   '3 ovos mexidos + 2 fatias pão integral + café',
   'Iogurte grego 200g + 1 scoop whey + frutas vermelhas',
   'Tapioca 2 col + queijo + presunto de peru + café',
   430, 34, 'Tomar Dapagliflozina antes.', ARRAY['casa','viagem']),
  (7,'lunch','13:00'::TIME,
   'Frango grelhado 200g + arroz integral 2 col + salada',
   'Carne bovina 200g + batata-doce + legumes',
   'Peixe 180g + arroz integral + salada verde',
   560, 44, 'Refeição em família: manter proteína e evitar frituras.', ARRAY['casa','viagem']),
  (7,'snack','16:30'::TIME,
   '1 scoop whey + água + 1 fruta',
   'Queijo cottage 150g + torradas integrais',
   'Iogurte grego 150g',
   200, 22, NULL, ARRAY['casa','rapido']),
  (7,'dinner','20:00'::TIME,
   'Frango 180g + legumes no vapor + salada',
   'Omelete 3 ovos + espinafre + queijo',
   'Peixe 200g + abobrinha + salada',
   460, 39, 'Glifage XR após o jantar.', ARRAY['casa']),

  -- DOMINGO (1) -------------------------------------------------------
  (1,'breakfast','09:30'::TIME,
   '3 ovos mexidos + 2 fatias pão integral + café',
   'Iogurte grego 200g + 1 scoop whey + frutas',
   'Crepioca 2 ovos + queijo minas + café',
   430, 34, 'Tomar Dapagliflozina antes.', ARRAY['casa']),
  (1,'lunch','13:30'::TIME,
   'Frango grelhado 200g + arroz integral 2 col + salada',
   'Carne bovina magra 200g + batata-doce + legumes',
   'Filé de tilápia 200g + arroz integral + brócolis',
   560, 44, 'Refeição familiar: manter o protocolo mesmo nos fins de semana.', ARRAY['casa']),
  (1,'snack','17:00'::TIME,
   '1 scoop whey + água + 1 banana',
   'Iogurte grego 150g + granola sem açúcar',
   '2 ovos cozidos + 1 fruta',
   220, 25, NULL, ARRAY['casa','rapido']),
  (1,'dinner','20:30'::TIME,
   'Frango 180g + legumes refogados + salada verde',
   'Omelete 3 ovos + queijo + legumes',
   'Sopa proteica (frango + legumes) sem macarrão',
   460, 39, 'Glifage XR após o jantar.', ARRAY['casa'])
) AS v(day_of_week, meal_type, meal_time, option_a, option_b, option_c, calories_est, protein_g, notes, tags)
WHERE NOT EXISTS (SELECT 1 FROM meals);

-- ============================================================
-- MÓDULO 3 — Musculação
-- ============================================================

CREATE TABLE IF NOT EXISTS muscle_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#888888'
);

CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group_id UUID REFERENCES muscle_groups(id),
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '10-12',
  rest_seconds INTEGER NOT NULL DEFAULT 90,
  technique_tip TEXT,
  youtube_video_id TEXT,
  youtube_channel TEXT DEFAULT '',
  knee_safe BOOLEAN DEFAULT true,
  equipment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL UNIQUE CHECK (day_of_week BETWEEN 1 AND 7),
  split_name TEXT NOT NULL,
  split_description TEXT,
  is_rest_day BOOLEAN DEFAULT false,
  rest_type TEXT CHECK (rest_type IN ('active', 'complete')),
  color TEXT DEFAULT '#2874A6',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS split_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id UUID REFERENCES workout_splits(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date DATE NOT NULL UNIQUE,
  split_id UUID REFERENCES workout_splits(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  weight_kg DECIMAL(6,2),
  sets_done INTEGER,
  reps_done TEXT,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS weight_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  weight_kg DECIMAL(6,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(exercise_id, log_date)
);

ALTER TABLE muscle_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE workout_splits DISABLE ROW LEVEL SECURITY;
ALTER TABLE split_exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE weight_history DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- MÓDULO 3 — SEEDS: Grupos musculares
-- ============================================================

INSERT INTO muscle_groups (name, color)
SELECT * FROM (VALUES
  ('Peito',          '#2874A6'),
  ('Costas',         '#1E8449'),
  ('Ombros',         '#7D3C98'),
  ('Tríceps',        '#D35400'),
  ('Bíceps',         '#C0392B'),
  ('Posterior',      '#117A65'),
  ('Glúteo',         '#0E6655'),
  ('Abdômen',        '#B7950B'),
  ('Panturrilha',    '#616A6B')
) AS v(name, color)
WHERE NOT EXISTS (SELECT 1 FROM muscle_groups);

-- ============================================================
-- MÓDULO 3 — SEEDS: Exercícios (adaptados para joelho)
-- ============================================================

INSERT INTO exercises (name, muscle_group_id, sets, reps, rest_seconds, technique_tip, knee_safe, equipment)
SELECT v.name, mg.id, v.sets, v.reps, v.rest_seconds, v.technique_tip, v.knee_safe, v.equipment
FROM (VALUES
  -- PEITO
  ('Supino Reto com Barra',         'Peito',      4, '8-10',  180, 'Escápulas retraídas. Barra desce até 2cm do peito. Expire no esforço — nunca prenda a respiração.',            true,  'Barra + Halter'),
  ('Supino Inclinado com Halteres', 'Peito',      3, '10-12', 90,  'Inclinação 30°. Cotovelos a 45° do corpo. Movimento controlado na descida.',                                  true,  'Halteres'),
  ('Crucifixo com Halteres',        'Peito',      3, '12-15', 60,  'Cotovelos levemente fletidos. Não force o alongamento com histórico de ombro.',                               true,  'Halteres'),
  ('Crossover no Cabo',             'Peito',      3, '15',    60,  'Puxada para baixo e ao centro. Foco na contração total. Mantenha postura ereta.',                             true,  'Cabo'),
  -- COSTAS
  ('Puxada Frontal no Pulley',      'Costas',     4, '10-12', 120, 'Barra desce até a altura do queixo. Retração escapular antes de puxar. Não inclinar demais o tronco.',        true,  'Pulley'),
  ('Remada Curvada com Barra',      'Costas',     4, '8-10',  180, 'Tronco a 45°. Barra no abdômen. Cotovelos próximos ao corpo. Expire no esforço.',                            true,  'Barra'),
  ('Remada Serrote com Haltere',    'Costas',     3, '12',    90,  'Apoio firme no banco. Haltere sobe até o quadril. Foco na retração escapular.',                              true,  'Haltere'),
  ('Pullover no Cabo',              'Costas',     3, '12-15', 60,  'Cotovelos ligeiramente fletidos. Puxada do arco. Bom para finalização.',                                     true,  'Cabo'),
  -- OMBROS
  ('Desenvolvimento com Halteres',  'Ombros',     4, '10',    120, 'Sem hiperextensão lombar. Halteres acima dos ombros. Expire no empurrão.',                                   true,  'Halteres'),
  ('Elevação Lateral com Haltere',  'Ombros',     4, '15',    60,  'Cotovelos levemente fletidos. Subir até paralelo ao chão. Não balançar o tronco.',                           true,  'Halteres'),
  ('Elevação Frontal com Haltere',  'Ombros',     3, '12',    60,  'Alternado ou simultâneo. Altura máxima: ombro. Evitar hiperextensão.',                                       true,  'Halteres'),
  ('Face Pull no Cabo',             'Ombros',     3, '15',    60,  'Corda à altura dos olhos. Cotovelos acima dos ombros. Ótimo para saúde do manguito.',                        true,  'Cabo'),
  -- TRÍCEPS
  ('Tríceps Pulley Barra Reta',     'Tríceps',    4, '12',    90,  'Cotovelos fixos no corpo. Extensão completa. Controle na subida.',                                           true,  'Pulley'),
  ('Tríceps Testa com Haltere',     'Tríceps',    3, '10',    90,  'Cotovelos apontados para cima. Não deixar os cotovelos abrirem. Descida controlada.',                        true,  'Halteres'),
  ('Tríceps Coice com Haltere',     'Tríceps',    3, '12',    60,  'Tronco paralelo ao chão. Extensão completa do cotovelo. Pausa na contração.',                               true,  'Haltere'),
  -- BÍCEPS
  ('Rosca Direta com Barra',        'Bíceps',     4, '10',    90,  'Cotovelos fixos. Barra sobe até o ombro. Descida lenta (2 segundos). Não balançar.',                        true,  'Barra'),
  ('Rosca Alternada com Haltere',   'Bíceps',     3, '12',    90,  'Supinação no topo. Alternado. Costas retas contra a parede se necessário.',                                 true,  'Halteres'),
  ('Rosca Concentrada',             'Bíceps',     3, '12',    60,  'Cotovelo apoiado na coxa. Movimento isolado. Foco total na contração.',                                      true,  'Haltere'),
  -- POSTERIOR/GLÚTEO (knee-safe)
  ('Stiff com Barra',               'Posterior',  4, '10',    120, 'Joelhos levemente fletidos. Quadril recua. Costas neutras. Descer até sentir o alongamento posterior.',     true,  'Barra'),
  ('Hip Thrust com Barra',          'Glúteo',     4, '12',    120, 'Ombros no banco. Barra no quadril com almofada. Extensão total do quadril. Pausa no topo.',                 true,  'Barra + Banco'),
  ('Levantamento Terra Romeno',     'Posterior',  3, '10',    180, 'Barra próxima ao corpo. Quadril recua. Coluna neutra. NÃO é agachamento — não dobrar joelhos demais.',      true,  'Barra'),
  ('Cadeira Flexora',               'Posterior',  3, '15',    60,  'Amplitude completa. Sem balanço de quadril. Concentrar na fase excêntrica.',                                 true,  'Máquina'),
  ('Elevação de Panturrilha em Pé', 'Panturrilha',3, '20',    45,  'Amplitude total. Pausa no topo e no fundo. Sem balançar.',                                                   true,  'Máquina/Degrau'),
  -- ABDÔMEN
  ('Prancha Isométrica',            'Abdômen',    3, '40s',   60,  'Quadril neutro — sem levantar ou afundar. Respiração contínua. Progredir o tempo gradualmente.',            true,  'Peso corporal'),
  ('Crunch Abdominal no Cabo',      'Abdômen',    3, '15',    60,  'Quadril fixo. Flexão do tronco pura. Cotovelos próximos ao joelho.',                                         true,  'Cabo')
) AS v(name, muscle_group_name, sets, reps, rest_seconds, technique_tip, knee_safe, equipment)
JOIN muscle_groups mg ON mg.name = v.muscle_group_name
WHERE NOT EXISTS (SELECT 1 FROM exercises);

-- ============================================================
-- MÓDULO 3 — SEEDS: Divisão semanal (PPL adaptado joelho)
-- 1=Dom 2=Seg 3=Ter 4=Qua 5=Qui 6=Sex 7=Sab
-- ============================================================

INSERT INTO workout_splits (day_of_week, split_name, split_description, is_rest_day, rest_type, color)
SELECT * FROM (VALUES
  (1, 'Descanso',         'Recuperação completa. Hidratação e sono.',              true,  'complete', '#616A6B'),
  (2, 'Peito + Tríceps',  'Empurrar horizontal. Foco em peito e tríceps.',         false, NULL,       '#2874A6'),
  (3, 'Costas + Bíceps',  'Puxar vertical e horizontal. Foco em dorsal e bíceps.', false, NULL,       '#1E8449'),
  (4, 'Posterior + Glúteo','Posterior de coxa e glúteo (adaptado para joelho).',   false, NULL,       '#117A65'),
  (5, 'Ombros',           'Deltoides e trapézio. Foco em volume de ombros.',       false, NULL,       '#7D3C98'),
  (6, 'Full Upper',       'Peito + Costas + Ombros (volume reduzido).',            false, NULL,       '#D35400'),
  (7, 'Descanso Ativo',   'Caminhada leve ou mobilidade. Sem carga.',              true,  'active',   '#B7950B')
) AS v(day_of_week, split_name, split_description, is_rest_day, rest_type, color)
WHERE NOT EXISTS (SELECT 1 FROM workout_splits);

-- ============================================================
-- MÓDULO 3 — SEEDS: Exercícios por divisão
-- ============================================================

INSERT INTO split_exercises (split_id, exercise_id, order_index)
SELECT ws.id, e.id, v.order_index
FROM (VALUES
  -- SEGUNDA: Peito + Tríceps (day_of_week=2)
  (2, 'Supino Reto com Barra',          1),
  (2, 'Supino Inclinado com Halteres',  2),
  (2, 'Crucifixo com Halteres',         3),
  (2, 'Crossover no Cabo',              4),
  (2, 'Tríceps Pulley Barra Reta',      5),
  (2, 'Tríceps Testa com Haltere',      6),
  (2, 'Tríceps Coice com Haltere',      7),
  -- TERÇA: Costas + Bíceps (day_of_week=3)
  (3, 'Puxada Frontal no Pulley',       1),
  (3, 'Remada Curvada com Barra',       2),
  (3, 'Remada Serrote com Haltere',     3),
  (3, 'Pullover no Cabo',               4),
  (3, 'Rosca Direta com Barra',         5),
  (3, 'Rosca Alternada com Haltere',    6),
  (3, 'Rosca Concentrada',              7),
  -- QUARTA: Posterior + Glúteo (day_of_week=4)
  (4, 'Stiff com Barra',                1),
  (4, 'Hip Thrust com Barra',           2),
  (4, 'Levantamento Terra Romeno',      3),
  (4, 'Cadeira Flexora',                4),
  (4, 'Elevação de Panturrilha em Pé',  5),
  -- QUINTA: Ombros (day_of_week=5)
  (5, 'Desenvolvimento com Halteres',   1),
  (5, 'Elevação Lateral com Haltere',   2),
  (5, 'Elevação Frontal com Haltere',   3),
  (5, 'Face Pull no Cabo',              4),
  (5, 'Prancha Isométrica',             5),
  (5, 'Crunch Abdominal no Cabo',       6),
  -- SEXTA: Full Upper (day_of_week=6)
  (6, 'Supino Reto com Barra',          1),
  (6, 'Puxada Frontal no Pulley',       2),
  (6, 'Desenvolvimento com Halteres',   3),
  (6, 'Rosca Direta com Barra',         4),
  (6, 'Tríceps Pulley Barra Reta',      5)
) AS v(day_of_week, exercise_name, order_index)
JOIN workout_splits ws ON ws.day_of_week = v.day_of_week
JOIN exercises e ON e.name = v.exercise_name
WHERE NOT EXISTS (SELECT 1 FROM split_exercises);
