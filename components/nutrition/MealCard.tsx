"use client";

import { useMemo, useRef, useState } from "react";
import { Check, RotateCcw, Frown, PenLine } from "lucide-react";
import type { Meal, MealLog, OptionChosen } from "@/lib/supabase/types";
import { MEAL_LABELS, getOptionText } from "@/lib/utils/nutrition";
import { timeUntilLabel } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import NoAppetiteMode from "./NoAppetiteMode";

interface Props {
  meal: Meal;
  log: MealLog | undefined;
  now: Date;
  tagFilter: string;
  onLogOption: (meal: Meal, opt: OptionChosen) => Promise<void> | void;
  onLogNoAppetite: (idx: number) => Promise<void> | void;
  onLogCustom: (description: string, calories: number | null, protein: number | null) => Promise<void> | void;
  onRemove: () => Promise<void> | void;
}

export default function MealCard({ meal, log, now, tagFilter, onLogOption, onLogNoAppetite, onLogCustom, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [noAppetiteOpen, setNoAppetiteOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customDesc, setCustomDesc] = useState("");
  const [customCal, setCustomCal] = useState("");
  const [customProt, setCustomProt] = useState("");
  const descRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    const tags = meal.tags ?? [];
    if (tagFilter === "all" || tags.includes(tagFilter)) {
      return [
        { k: "a" as OptionChosen, text: meal.option_a },
        { k: "b" as OptionChosen, text: meal.option_b },
        { k: "c" as OptionChosen, text: meal.option_c },
      ];
    }
    return [];
  }, [meal, tagFilter]);

  const label = MEAL_LABELS[meal.meal_type];
  const time = meal.meal_time.slice(0, 5);
  const taken = !!log && (log.option_chosen != null || log.no_appetite || (log.notes != null && !log.no_appetite && log.option_chosen == null));
  const isCustom = !!log && !log.no_appetite && log.option_chosen == null && log.notes != null;
  const tu = timeUntilLabel(now, time);

  return (
    <article className={cn(
      "space-y-3 rounded-2xl border bg-bg-card p-4",
      taken ? "border-accent-green/40" : "border-bg-elevated"
    )}>
      <header className="flex items-start gap-3">
        {/* Completion checkbox */}
        <button
          onClick={() => taken ? onRemove() : onLogOption(meal, "a")}
          title={taken ? "Desmarcar refeição" : "Marcar como concluída"}
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all active:scale-90",
            taken
              ? "border-accent-green bg-accent-green"
              : "border-gray-600 bg-transparent"
          )}
        >
          {taken && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
        </button>

        {/* Meal info */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-gray-500">
            <span aria-hidden>{label.icon}</span> {label.label} · {time}
          </div>
          {taken ? (
            <div className="mt-1 text-sm font-medium text-accent-green">
              {log!.no_appetite
                ? `Sem fome: ${log!.notes ?? "registrado"}`
                : isCustom
                ? `${log!.notes} · ${log!.calories_actual ?? 0} kcal · ${log!.protein_actual ?? 0}g prot`
                : log!.option_chosen === "skip"
                ? "Pulou esta refeição"
                : `Opção ${(log!.option_chosen ?? "").toString().toUpperCase()} · ${log!.calories_actual ?? meal.calories_est ?? 0} kcal · ${log!.protein_actual ?? meal.protein_g ?? 0}g prot`}
            </div>
          ) : (
            <div className="mt-1 text-xs text-gray-400">{tu}</div>
          )}
        </div>

        {/* Right side */}
        {taken ? (
          <button
            onClick={() => onRemove()}
            className="rounded-md bg-bg-elevated px-2 py-1 text-[11px] text-gray-400 active:scale-95"
          >
            <RotateCcw className="inline h-3 w-3" /> Refazer
          </button>
        ) : (
          <div className="text-right text-[11px] text-gray-500">
            {meal.calories_est} kcal<br />
            {meal.protein_g}g prot
          </div>
        )}
      </header>

      {!taken && !noAppetiteOpen && (
        <>
          {filteredOptions.length === 0 ? (
            <p className="text-xs italic text-gray-500">
              Sem opção compatível com este filtro. Refeição não tem a tag.
            </p>
          ) : (
            <div className="space-y-2">
              {(expanded ? filteredOptions : filteredOptions.slice(0, 3)).map((o) => (
                <button
                  key={o.k}
                  onClick={() => onLogOption(meal, o.k)}
                  className="flex w-full gap-3 rounded-xl bg-bg-elevated p-2.5 text-left active:scale-[0.98]"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-blue/20 text-xs font-bold text-accent-blue">
                    {o.k.toUpperCase()}
                  </span>
                  <span className="flex-1 text-xs leading-snug text-gray-200">{o.text}</span>
                </button>
              ))}
            </div>
          )}
          {!expanded && filteredOptions.length > 0 && (
            <button onClick={() => setExpanded(true)} className="text-xs text-gray-500">
              ver detalhes
            </button>
          )}
          {/* Option D – custom manual entry */}
          {customOpen ? (
            <div className="space-y-2 rounded-xl bg-bg-elevated p-3">
              <input
                ref={descRef}
                type="text"
                placeholder="O que você comeu?"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                className="w-full rounded-lg bg-bg-base px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue"
                autoFocus
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="kcal"
                  value={customCal}
                  onChange={(e) => setCustomCal(e.target.value)}
                  className="w-full rounded-lg bg-bg-base px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue"
                />
                <input
                  type="number"
                  placeholder="g prot"
                  value={customProt}
                  onChange={(e) => setCustomProt(e.target.value)}
                  className="w-full rounded-lg bg-bg-base px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setCustomOpen(false); setCustomDesc(""); setCustomCal(""); setCustomProt(""); }}
                  className="flex-1 rounded-xl bg-bg-base py-2 text-xs text-gray-400 active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  disabled={!customDesc.trim()}
                  onClick={async () => {
                    if (!customDesc.trim()) return;
                    await onLogCustom(customDesc.trim(), customCal ? Number(customCal) : null, customProt ? Number(customProt) : null);
                    setCustomOpen(false); setCustomDesc(""); setCustomCal(""); setCustomProt("");
                  }}
                  className="flex-1 rounded-xl bg-accent-blue py-2 text-xs font-semibold text-white disabled:opacity-40 active:scale-95"
                >
                  Salvar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setCustomOpen(true); setTimeout(() => descRef.current?.focus(), 50); }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-600 py-2 text-xs font-medium text-gray-400 active:scale-95"
            >
              <PenLine className="h-3.5 w-3.5" />
              D — Informar manualmente
            </button>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onLogOption(meal, "skip")}
              className="flex-1 rounded-xl bg-bg-elevated py-2 text-xs font-medium text-gray-400 active:scale-95"
            >
              Pular
            </button>
            <button
              onClick={() => setNoAppetiteOpen(true)}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-amber-500/20 py-2 text-xs font-medium text-amber-300 active:scale-95"
            >
              <Frown className="h-3.5 w-3.5" /> Sem fome
            </button>
          </div>
        </>
      )}

      {taken && log?.option_chosen && log.option_chosen !== "skip" && (
        <p className="rounded-lg bg-bg-elevated/60 px-3 py-2 text-[11px] leading-snug text-gray-300">
          {getOptionText(meal, log.option_chosen)}
        </p>
      )}

      {noAppetiteOpen && !taken && (
        <NoAppetiteMode
          mealType={meal.meal_type}
          onChoose={async (i) => {
            await onLogNoAppetite(i);
            setNoAppetiteOpen(false);
          }}
          onCancel={() => setNoAppetiteOpen(false)}
        />
      )}
    </article>
  );
}
