"use client";

import type { MarkerTimeline } from "@/hooks/useExamHistory";

interface Props {
  timelines: MarkerTimeline[];
}

const STATUS_COLOR: Record<string, string> = {
  high: "text-accent-red",
  low: "text-accent-blue",
  normal: "text-accent-green",
};

const STATUS_LABEL: Record<string, string> = {
  high: "Alto",
  low: "Baixo",
  normal: "Normal",
};

export default function LabTrendTable({ timelines }: Props) {
  if (timelines.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl bg-bg-card text-sm text-gray-500">
        Nenhum exame laboratorial registrado.
      </div>
    );
  }

  const byCategory = timelines.reduce<Record<string, MarkerTimeline[]>>((acc, t) => {
    const cat = t.category || "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(byCategory).map(([cat, items]) => (
        <div key={cat} className="rounded-2xl bg-bg-card overflow-hidden">
          <div className="border-b border-bg-elevated px-4 py-2.5">
            <span className="text-sm font-semibold text-gray-200">{cat}</span>
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-bg-elevated bg-bg-elevated/30">
                <th className="px-3 py-2 text-left font-medium text-gray-500">Marcador</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Anterior</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Atual</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Tendência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-elevated">
              {items.map((t) => {
                const cur = t.points[t.points.length - 1];
                const prev = t.points.length > 1 ? t.points[t.points.length - 2] : null;
                const delta = prev ? cur.value - prev.value : null;
                const refText =
                  t.ref_min != null && t.ref_max != null
                    ? `${t.ref_min}–${t.ref_max}`
                    : t.ref_max != null
                    ? `<${t.ref_max}`
                    : t.ref_min != null
                    ? `>${t.ref_min}`
                    : null;

                return (
                  <tr key={t.marker} className="hover:bg-bg-elevated/20 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-gray-200">{t.marker}</div>
                      {refText && (
                        <div className="text-[10px] text-gray-600">ref: {refText} {t.unit}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-500">
                      {prev ? (
                        <>
                          <span>{prev.value}</span>
                          <span className={`ml-1 text-[10px] ${STATUS_COLOR[prev.status]}`}>
                            {STATUS_LABEL[prev.status]}
                          </span>
                        </>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={`font-semibold ${STATUS_COLOR[cur.status]}`}>
                        {cur.value} {t.unit}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {delta !== null ? (
                        <TrendArrow value={cur.value} prev={prev!.value} status={cur.status} prevStatus={prev!.status} />
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function TrendArrow({
  value,
  prev,
  status,
  prevStatus,
}: {
  value: number;
  prev: number;
  status: string;
  prevStatus: string;
}) {
  const delta = value - prev;
  const improved =
    (status === "normal" && prevStatus !== "normal") ||
    (status === "normal" && prevStatus === "normal" && delta === 0);
  const worsened = status !== "normal" && prevStatus === "normal";

  if (Math.abs(delta) < 0.001) {
    return <span className="text-gray-500">→</span>;
  }

  const arrow = delta > 0 ? "↑" : "↓";
  const color = improved ? "text-accent-green" : worsened ? "text-accent-red" : "text-gray-400";

  return (
    <span className={`font-bold ${color}`}>
      {arrow} {Math.abs(delta) < 10 ? Math.abs(delta).toFixed(1) : Math.round(Math.abs(delta))}
    </span>
  );
}
