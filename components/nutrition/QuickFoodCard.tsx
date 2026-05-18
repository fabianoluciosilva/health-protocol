"use client";

import { useState } from "react";
import { Plus, Trash2, Zap } from "lucide-react";
import { useQuickFood } from "@/hooks/useQuickFood";
import type { QuickFoodLog } from "@/lib/supabase/types";
import { cn } from "@/lib/utils/cn";

const CATEGORIES: { key: QuickFoodLog["category"]; label: string; icon: string }[] = [
  { key: "fruta",  label: "Fruta",  icon: "🍎" },
  { key: "lanche", label: "Lanche", icon: "🥪" },
  { key: "bebida", label: "Bebida", icon: "☕" },
  { key: "outro",  label: "Outro",  icon: "🍽️" },
];

interface Props { date: Date }

export default function QuickFoodCard({ date }: Props) {
  const { logs, loading, addFood, removeFood, totalCalories, totalProtein } = useQuickFood(date);
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState<QuickFoodLog["category"]>("lanche");
  const [cal, setCal] = useState("");
  const [prot, setProt] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!desc.trim()) return;
    setSaving(true);
    await addFood(desc.trim(), cat, cal ? Number(cal) : null, prot ? Number(prot) : null);
    setDesc(""); setCal(""); setProt(""); setOpen(false);
    setSaving(false);
  };

  return (
    <div className="rounded-2xl bg-bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent-yellow" />
          <span className="text-sm font-semibold text-white">Frutas e Lanches Rápidos</span>
          {logs.length > 0 && (
            <span className="text-xs text-gray-500">
              {totalCalories} kcal · {totalProtein.toFixed(0)}g prot
            </span>
          )}
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 rounded-xl bg-bg-elevated px-3 py-1.5 text-xs font-medium text-gray-300 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar
        </button>
      </div>

      {open && (
        <div className="border-t border-bg-elevated px-4 pb-4 pt-3 space-y-3">
          {/* Category chips */}
          <div className="flex gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCat(c.key)}
                className={cn(
                  "flex-1 rounded-xl py-1.5 text-xs font-medium transition-colors",
                  cat === c.key ? "bg-accent-blue text-white" : "bg-bg-elevated text-gray-400"
                )}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Descrição (ex: 1 banana prata)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full rounded-xl bg-bg-elevated px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue"
            autoFocus
          />

          <div className="flex gap-2">
            <input
              type="number"
              placeholder="kcal (opcional)"
              value={cal}
              onChange={(e) => setCal(e.target.value)}
              className="w-full rounded-xl bg-bg-elevated px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue"
            />
            <input
              type="number"
              placeholder="g prot"
              value={prot}
              onChange={(e) => setProt(e.target.value)}
              className="w-full rounded-xl bg-bg-elevated px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setOpen(false); setDesc(""); setCal(""); setProt(""); }}
              className="flex-1 rounded-xl bg-bg-elevated py-2 text-xs text-gray-400 active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || !desc.trim()}
              className="flex-1 rounded-xl bg-accent-blue py-2 text-xs font-semibold text-white disabled:opacity-40 active:scale-95"
            >
              {saving ? "Salvando…" : "Adicionar"}
            </button>
          </div>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="border-t border-bg-elevated divide-y divide-bg-elevated">
          {logs.map((log) => {
            const catMeta = CATEGORIES.find((c) => c.key === log.category);
            return (
              <div key={log.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-base shrink-0">{catMeta?.icon ?? "🍽️"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{log.description}</p>
                  {(log.calories || log.protein_g) && (
                    <p className="text-[11px] text-gray-500">
                      {log.calories ? `${log.calories} kcal` : ""}
                      {log.calories && log.protein_g ? " · " : ""}
                      {log.protein_g ? `${log.protein_g}g prot` : ""}
                      {" · "}{log.log_time.slice(0, 5)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeFood(log.id)}
                  className="rounded-lg p-1.5 text-gray-600 active:bg-bg-elevated"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!loading && logs.length === 0 && !open && (
        <div className="border-t border-bg-elevated px-4 py-3 text-center text-xs text-gray-600">
          Nenhum lanche registrado hoje
        </div>
      )}
    </div>
  );
}
