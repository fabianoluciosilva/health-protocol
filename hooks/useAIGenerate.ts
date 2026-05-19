"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

export type GenerateType = "nutrition" | "workout";

export function isRenewalDue(lastAt: string | null, months: number): boolean {
  if (!lastAt) return true;
  const due = new Date(lastAt);
  due.setMonth(due.getMonth() + months);
  return new Date() >= due;
}

export function useAIGenerate(type: GenerateType) {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const generate = useCallback(
    async (profile: Profile) => {
      setGenerating(true);
      setError(null);
      setResult(null);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, type }),
        });
        const data = (await res.json()) as { message: string };

        if (!res.ok) {
          setError(data.message ?? "Erro ao gerar.");
          setGenerating(false);
          return null;
        }

        // Marcar como gerado e gravar timestamp
        const now = new Date().toISOString();
        if (type === "nutrition") {
          await supabase
            .from("profiles")
            .update({ ai_nutrition_generated: true, last_diet_generated_at: now })
            .eq("id", profile.id);
        } else {
          await supabase
            .from("profiles")
            .update({ ai_workout_generated: true, last_workout_generated_at: now })
            .eq("id", profile.id);
        }

        setResult(data.message);
        setGenerating(false);
        return data.message;
      } catch {
        setError("Erro de conexão. Tente novamente.");
        setGenerating(false);
        return null;
      }
    },
    [supabase, type]
  );

  return { generating, result, error, generate };
}
