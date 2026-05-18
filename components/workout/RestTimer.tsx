"use client";

import { cn } from "@/lib/utils/cn";
import { formatTimer } from "@/lib/utils/timer";

interface Props {
  remaining: number;
  total: number;
  pct: number;
  active: boolean;
  onSkip: () => void;
}

export default function RestTimer({ remaining, total, pct, active, onSkip }: Props) {
  if (!active && remaining === 0) return null;

  return (
    <div className="rounded-2xl border border-accent-blue/30 bg-bg-card p-4 text-center">
      <div className="mb-2 text-[11px] uppercase tracking-widest text-gray-400">Descansando</div>
      <div className="text-4xl font-bold tabular-nums text-white">{formatTimer(remaining)}</div>
      <div className="mt-1 text-xs text-gray-500">de {formatTimer(total)}</div>
      <div className="my-3 h-2 w-full overflow-hidden rounded-full bg-bg-elevated">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            pct >= 80 ? "bg-accent-green" : pct >= 50 ? "bg-accent-yellow" : "bg-accent-orange"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <button
        onClick={onSkip}
        className="rounded-lg bg-bg-elevated px-4 py-1.5 text-xs text-gray-400 active:scale-95"
      >
        Pular descanso
      </button>
    </div>
  );
}
