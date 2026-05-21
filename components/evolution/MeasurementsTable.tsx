"use client";

import type { BodyMeasurement } from "@/lib/supabase/types";

interface Props {
  logs: BodyMeasurement[];
}

type MeasureKey = "waist_cm" | "chest_cm" | "hips_cm" | "arm_cm" | "thigh_cm" | "neck_cm";

const FIELDS: { key: MeasureKey; label: string; icon: string; lowerIsBetter?: boolean }[] = [
  { key: "waist_cm",  label: "Cintura",  icon: "📏", lowerIsBetter: true },
  { key: "chest_cm",  label: "Peito",    icon: "💪" },
  { key: "hips_cm",   label: "Quadril",  icon: "📐", lowerIsBetter: true },
  { key: "arm_cm",    label: "Braço",    icon: "💪" },
  { key: "thigh_cm",  label: "Coxa",     icon: "🦵" },
  { key: "neck_cm",   label: "Pescoço",  icon: "📏" },
];

export default function MeasurementsTable({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl bg-bg-card text-sm text-gray-500">
        Nenhuma medida corporal registrada.
      </div>
    );
  }

  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
  const current = sorted[sorted.length - 1];
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;

  return (
    <div className="space-y-3 rounded-2xl bg-bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-200">Medidas Corporais</span>
        {previous && (
          <span className="text-xs text-gray-500">
            {formatDate(previous.log_date)} → {formatDate(current.log_date)}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-bg-elevated">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-bg-elevated bg-bg-elevated/50">
              <th className="px-3 py-2 text-left font-medium text-gray-500">Medida</th>
              {previous && <th className="px-3 py-2 text-right font-medium text-gray-500">Anterior</th>}
              <th className="px-3 py-2 text-right font-medium text-gray-500">Atual</th>
              {previous && <th className="px-3 py-2 text-right font-medium text-gray-500">Δ</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-bg-elevated">
            {FIELDS.map(({ key, label, icon, lowerIsBetter }) => {
              const cur = current[key];
              const prev = previous?.[key];
              if (cur == null && prev == null) return null;
              const delta = cur != null && prev != null ? Number(cur) - Number(prev) : null;
              const good = delta !== null ? (lowerIsBetter ? delta < 0 : delta > 0) : null;

              return (
                <tr key={key} className="transition-colors hover:bg-bg-elevated/30">
                  <td className="px-3 py-2.5 text-gray-300">
                    <span className="mr-1.5">{icon}</span>{label}
                  </td>
                  {previous && (
                    <td className="px-3 py-2.5 text-right text-gray-500">
                      {prev != null ? `${Number(prev).toFixed(1)} cm` : "—"}
                    </td>
                  )}
                  <td className="px-3 py-2.5 text-right font-semibold text-white">
                    {cur != null ? `${Number(cur).toFixed(1)} cm` : "—"}
                  </td>
                  {previous && (
                    <td className="px-3 py-2.5 text-right">
                      {delta !== null ? (
                        <span className={`font-semibold ${
                          good === true ? "text-accent-green"
                          : good === false ? "text-accent-red"
                          : "text-gray-500"
                        }`}>
                          {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                        </span>
                      ) : "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sorted.length > 2 && (
        <p className="text-center text-[10px] text-gray-600">
          {sorted.length} medições registradas · mais antiga: {formatDate(sorted[0].log_date)}
        </p>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}
