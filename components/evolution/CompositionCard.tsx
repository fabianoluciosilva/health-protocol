"use client";

import type { BodyMeasurement } from "@/lib/supabase/types";

interface Props {
  logs: BodyMeasurement[];
}

type Key =
  | "body_fat_pct" | "lean_mass_kg" | "fat_mass_kg"
  | "body_water_l" | "body_water_pct" | "rmr_kcal"
  | "waist_height_ratio" | "waist_hip_ratio" | "conicity_index" | "shaped_score";

const FIELDS: { key: Key; label: string; unit: string; decimals: number; lowerIsBetter?: boolean; higherIsBetter?: boolean }[] = [
  { key: "body_fat_pct",       label: "% Gordura",        unit: "%",    decimals: 1, lowerIsBetter: true },
  { key: "lean_mass_kg",       label: "Massa magra",      unit: "kg",   decimals: 1, higherIsBetter: true },
  { key: "fat_mass_kg",        label: "Massa gorda",      unit: "kg",   decimals: 1, lowerIsBetter: true },
  { key: "body_water_pct",     label: "Água corporal",    unit: "%",    decimals: 1 },
  { key: "rmr_kcal",           label: "Gasto repouso",    unit: "kcal", decimals: 0 },
  { key: "waist_height_ratio", label: "Cintura/estatura", unit: "",     decimals: 2, lowerIsBetter: true },
  { key: "waist_hip_ratio",    label: "Cintura/quadril",  unit: "",     decimals: 2, lowerIsBetter: true },
  { key: "conicity_index",     label: "Índice conicidade",unit: "",     decimals: 2, lowerIsBetter: true },
];

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

export default function CompositionCard({ logs }: Props) {
  // Só considera registros que tenham algum dado de composição
  const withComp = logs.filter(
    (l) => l.body_fat_pct != null || l.lean_mass_kg != null || l.fat_mass_kg != null || l.shaped_score != null
  );
  if (withComp.length === 0) return null;

  const sorted = [...withComp].sort((a, b) => a.log_date.localeCompare(b.log_date));
  const current = sorted[sorted.length - 1];
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;

  return (
    <div className="space-y-3 rounded-2xl bg-bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-200">Composição corporal</span>
        <span className="text-xs text-gray-500">
          {previous ? `${fmtDate(previous.log_date)} → ${fmtDate(current.log_date)}` : fmtDate(current.log_date)}
        </span>
      </div>

      {current.shaped_score != null && (
        <div className="flex items-center justify-between rounded-xl bg-bg-elevated px-3 py-2">
          <span className="text-xs text-gray-400">Shaped Score</span>
          <span className="text-base font-bold text-white">{current.shaped_score}<span className="text-xs font-normal text-gray-500">/100</span></span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {FIELDS.map(({ key, label, unit, decimals, lowerIsBetter, higherIsBetter }) => {
          const cur = current[key];
          const prev = previous?.[key];
          if (cur == null) return null;
          const delta = cur != null && prev != null ? Number(cur) - Number(prev) : null;
          const good =
            delta == null || delta === 0 ? null
            : lowerIsBetter ? delta < 0
            : higherIsBetter ? delta > 0
            : null;
          return (
            <div key={key} className="rounded-xl bg-bg-elevated px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
              <div className="mt-0.5 text-sm font-semibold text-white">
                {Number(cur).toFixed(decimals)}{unit && <span className="ml-0.5 text-[11px] font-normal text-gray-500">{unit}</span>}
              </div>
              {delta != null && delta !== 0 && (
                <div className={`text-[10px] font-medium ${good === true ? "text-accent-green" : good === false ? "text-accent-red" : "text-gray-500"}`}>
                  {delta > 0 ? "+" : ""}{delta.toFixed(decimals)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
