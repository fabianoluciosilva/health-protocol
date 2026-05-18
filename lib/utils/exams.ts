import type { LabResult } from "@/lib/supabase/types";

export type ExamColor = "red" | "yellow" | "green" | "blue";

export const CATEGORIES = [
  { key: "all", label: "Todos" },
  { key: "alert", label: "🔴 Atenção" },
  { key: "metabolic", label: "Metabólico" },
  { key: "hormonal", label: "Hormonal" },
  { key: "hepatic", label: "Hepático" },
  { key: "lipid", label: "Lipídios" },
  { key: "renal", label: "Renal" },
  { key: "blood", label: "Sangue" },
] as const;

export function getExamColor(r: LabResult): ExamColor {
  if (r.ref_min == null && r.ref_max == null) return "blue";
  const isHigh = r.ref_max != null && r.value > r.ref_max;
  const isLow = r.ref_min != null && r.value < r.ref_min;
  if (!isHigh && !isLow) return "green";
  const margin = isHigh
    ? (r.value - (r.ref_max as number)) / (r.ref_max as number)
    : ((r.ref_min as number) - r.value) / (r.ref_min as number);
  return margin <= 0.2 ? "yellow" : "red";
}

export function percentDelta(r: LabResult): { sign: "+" | "-" | ""; pct: number } | null {
  if (r.ref_min == null && r.ref_max == null) return null;
  const isHigh = r.ref_max != null && r.value > r.ref_max;
  const isLow = r.ref_min != null && r.value < r.ref_min;
  if (!isHigh && !isLow) return null;
  const pct = isHigh
    ? ((r.value - (r.ref_max as number)) / (r.ref_max as number)) * 100
    : (((r.ref_min as number) - r.value) / (r.ref_min as number)) * 100;
  return { sign: isHigh ? "+" : "-", pct: Math.round(pct) };
}

export function getProgressPct(r: LabResult): number {
  if (r.ref_min == null && r.ref_max == null) return 50;
  const lo = r.ref_min ?? 0;
  const hi = r.ref_max ?? lo * 2;
  const range = hi - lo;
  if (range <= 0) return 50;
  const pad = range * 0.5;
  const min = lo - pad;
  const max = hi + pad;
  const pct = ((r.value - min) / (max - min)) * 100;
  return Math.max(2, Math.min(98, pct));
}

const TIPS: Record<string, string> = {
  "TGP": "Monitorar com protocolo atual. Evitar álcool e ultraprocessados — fígado sob estresse.",
  "TGO": "Fígado dentro do limite. Manter rotina sem álcool.",
  "Gama-GT": "Dentro do range. Manter dieta com baixo álcool e baixa gordura.",
  "HOMA-IR": "Resistência severa à insulina. Glifage + Dapagliflozina estão agindo nisso. Carboidratos sempre com proteína.",
  "Insulina": "Alta — indicador de resistência à insulina. Acompanha o HOMA-IR.",
  "Glicose": "Pré-diabetes. Mounjaro + Dapa + Glifage atuam diretamente neste marcador.",
  "HbA1c": "Levemente acima do ideal. Reflete glicemia dos últimos 3 meses.",
  "Colesterol Total": "Limítrofe — reduzir gorduras saturadas e ultraprocessados.",
  "LDL": "Acima da meta. Considerar revisão dietética e atividade física.",
  "HDL": "Bom — manter atividade física aeróbica.",
  "Triglicérides": "Dentro do limite. Reduzir álcool e açúcar simples para manter.",
  "Creatinina": "Função renal preservada.",
  "Ácido Úrico": "Contribui para inflamação no joelho — hidratação essencial (3L/dia).",
  "Ferritina": "Inflamação crônica — melhora com perda de peso.",
  "Vitamina D": "Abaixo do ideal — suplementação semanal em curso (2000UI).",
  "Vitamina B12": "Boa reserva.",
  "Testosterona": "Baixo para a idade. TRT (Deposteron) iniciando 18/05.",
  "Estradiol": "Dentro do range. Anastrozol controla o aumento durante TRT.",
  "TSH": "Tireoide normal.",
  "T4 Livre": "Dentro do range.",
};

export function getTip(marker: string): string | null {
  return TIPS[marker] ?? null;
}

export function formatValue(v: number): string {
  if (Number.isInteger(v)) return String(v);
  const rounded = Math.round(v * 100) / 100;
  return rounded.toString().replace(".", ",");
}

export function formatRef(r: LabResult): string {
  const f = (v: number | null) => (v == null ? null : formatValue(v));
  const lo = f(r.ref_min);
  const hi = f(r.ref_max);
  if (lo != null && hi != null) return `${lo}–${hi}`;
  if (hi != null) return `até ${hi}`;
  if (lo != null) return `a partir de ${lo}`;
  return "—";
}
