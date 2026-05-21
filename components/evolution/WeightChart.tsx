"use client";

import type { BodyWeightLog } from "@/lib/supabase/types";

interface Props {
  logs: BodyWeightLog[];
}

export default function WeightChart({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl bg-bg-card text-sm text-gray-500">
        Nenhum registro de peso encontrado.
      </div>
    );
  }

  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
  const latest = sorted[sorted.length - 1];
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const first = sorted[0];
  const delta = previous ? latest.weight_kg - previous.weight_kg : null;
  const totalDelta = latest.weight_kg - first.weight_kg;

  const values = sorted.map((l) => Number(l.weight_kg));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const W = 300;
  const H = 80;
  const padX = 12;
  const padY = 10;

  const toX = (i: number) =>
    sorted.length === 1
      ? W / 2
      : padX + (i / (sorted.length - 1)) * (W - 2 * padX);
  const toY = (v: number) =>
    H - padY - ((v - minVal) / range) * (H - 2 * padY);

  const polyPoints = sorted.map((l, i) => `${toX(i)},${toY(Number(l.weight_kg))}`).join(" ");

  return (
    <div className="space-y-3 rounded-2xl bg-bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-200">Evolução do Peso</span>
        <span className="text-xs text-gray-500">{sorted.length} registros</span>
      </div>

      {/* Destaque atual */}
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-white">
          {Number(latest.weight_kg).toFixed(1)}
          <span className="ml-1 text-base font-normal text-gray-400">kg</span>
        </span>
        {delta !== null && (
          <span className={`mb-1 text-sm font-semibold ${delta < 0 ? "text-accent-green" : delta > 0 ? "text-accent-red" : "text-gray-400"}`}>
            {delta > 0 ? "+" : ""}{delta.toFixed(1)} kg vs anterior
          </span>
        )}
      </div>

      {/* Gráfico SVG */}
      {sorted.length > 1 && (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
          {/* Linha de fundo sutil */}
          <line x1={padX} y1={toY(minVal)} x2={W - padX} y2={toY(minVal)} stroke="#ffffff08" strokeWidth="1" />
          <line x1={padX} y1={toY(maxVal)} x2={W - padX} y2={toY(maxVal)} stroke="#ffffff08" strokeWidth="1" />

          {/* Linha de evolução */}
          <polyline
            points={polyPoints}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pontos */}
          {sorted.map((l, i) => (
            <circle
              key={l.id}
              cx={toX(i)}
              cy={toY(Number(l.weight_kg))}
              r={i === sorted.length - 1 ? 4 : 2.5}
              fill={i === sorted.length - 1 ? "#3B82F6" : "#1e3a5f"}
              stroke={i === sorted.length - 1 ? "#93C5FD" : "none"}
              strokeWidth="1.5"
            />
          ))}
        </svg>
      )}

      {/* Datas dos extremos */}
      {sorted.length > 1 && (
        <div className="flex justify-between text-[10px] text-gray-600">
          <span>{formatDate(first.log_date)}</span>
          <span className={`font-semibold ${totalDelta < 0 ? "text-accent-green" : totalDelta > 0 ? "text-accent-red" : "text-gray-500"}`}>
            {totalDelta > 0 ? "+" : ""}{totalDelta.toFixed(1)} kg no período
          </span>
          <span>{formatDate(latest.log_date)}</span>
        </div>
      )}

      {/* Lista compacta dos últimos 5 */}
      {sorted.length > 1 && (
        <div className="space-y-1 border-t border-bg-elevated pt-3">
          {[...sorted].reverse().slice(0, 5).map((l, i) => {
            const prev = [...sorted].reverse()[i + 1];
            const d = prev ? Number(l.weight_kg) - Number(prev.weight_kg) : null;
            return (
              <div key={l.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{formatDate(l.log_date)}</span>
                <div className="flex items-center gap-2">
                  {d !== null && (
                    <span className={`text-[10px] ${d < 0 ? "text-accent-green" : d > 0 ? "text-accent-red" : "text-gray-500"}`}>
                      {d > 0 ? "+" : ""}{d.toFixed(1)}
                    </span>
                  )}
                  <span className="font-semibold text-white">{Number(l.weight_kg).toFixed(1)} kg</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}
