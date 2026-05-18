"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw, Frown } from "lucide-react";
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
  onRemove: () => Promise<void> | void;
}

export default function MealCard({ meal, log, now, tagFilter, onLogOption, onLogNoAppetite, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [noAppetiteOpen, setNoAppetiteOpen] = useState(false);

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
  const taken = !!log && (log.option_chosen != null || log.no_appetite);
  const tu = timeUntilLabel(now, time);

  return (
    <article className={cn(
      "space-y-3 rounded-2xl border bg-bg-card p-4",
      taken ? "border-accent-green/40" : "border-bg-elevated"
    )}>
      <header className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-gray-500">
            <span aria-hidden>{label.icon}</span> {label.label} · {time}
          </div>
          {taken ? (
            <div className="mt-1 flex items-center gap-2 text-sm text-accent-green">
              <Check className="h-4 w-4" strokeWidth={3} />
              {log!.no_appetite
                ? `Sem fome: ${log!.notes ?? "registrado"}`
                : log!.option_chosen === "skip"
                ? "Pulou esta refeição"
                : `Opção ${(log!.option_chosen ?? "").toString().toUpperCase()} · ${log!.calories_actual ?? meal.calories_est ?? 0} kcal · ${log!.protein_actual ?? meal.protein_g ?? 0}g prot`}
            </div>
          ) : (
            <div className="mt-1 text-xs text-gray-400">{tu}</div>
          )}
        </div>
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
