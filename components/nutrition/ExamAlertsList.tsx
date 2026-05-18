"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { useExamAlerts } from "@/hooks/useExamAlerts";
import { cn } from "@/lib/utils/cn";

export default function ExamAlertsList() {
  const { alerts, loading } = useExamAlerts();
  const [open, setOpen] = useState(true);

  if (loading || alerts.length === 0) return null;

  return (
    <section className="rounded-2xl border border-red-500/30 bg-red-500/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-red-200">
          <AlertTriangle className="h-4 w-4" />
          Alertas dos exames ({alerts.length})
        </div>
        <ChevronDown className={cn("h-4 w-4 text-red-300/60 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <ul className="space-y-3 border-t border-red-500/20 px-4 pb-4 pt-3 text-xs">
          {alerts.map((a) => (
            <li key={a.marker} className="space-y-1.5">
              <div className="font-semibold text-red-200">⚠️ {a.alert}</div>
              <div className="text-gray-300">
                <span className="text-gray-500">Evite:</span> {a.foodsAvoid.join(", ")}
              </div>
              <div className="text-gray-300">
                <span className="text-gray-500">Inclua:</span> {a.foodsInclude.join(", ")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
