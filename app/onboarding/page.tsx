"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronRight, SkipForward } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile } = useProfile();
  const [step, setStep] = useState<"welcome" | "generating" | "done">("welcome");
  const [generated, setGenerated] = useState<string | null>(null);

  const markDone = async () => {
    if (profile?.id) {
      await supabase
        .from("profiles")
        .update({ onboarding_done: true })
        .eq("id", profile.id);
    }
    router.push("/medications");
    router.refresh();
  };

  const handleGenerate = async () => {
    setStep("generating");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = (await res.json()) as { message: string };
      setGenerated(data.message ?? "Geração concluída.");
    } catch {
      setGenerated("Erro ao gerar recomendações. Verifique a configuração da API.");
    }
    setStep("done");
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 pb-8 pt-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-purple/10">
            <Sparkles className="h-8 w-8 text-accent-purple" />
          </div>
          <h1 className="text-2xl font-bold text-white">Bem-vindo!</h1>

          {step === "welcome" && (
            <p className="mx-auto max-w-xs text-sm text-gray-400">
              Deseja gerar receitas e treinos personalizados com base no seu perfil?
            </p>
          )}
          {step === "generating" && (
            <p className="text-sm text-gray-400">Gerando recomendações…</p>
          )}
        </div>

        {step === "generating" && (
          <div className="flex items-center justify-center py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-bg-elevated border-t-accent-purple" />
          </div>
        )}

        {step === "done" && generated && (
          <div className="max-h-96 overflow-y-auto rounded-2xl bg-bg-card p-4 text-left text-sm text-gray-300 whitespace-pre-wrap">
            {generated}
          </div>
        )}

        {step === "welcome" && (
          <div className="space-y-3">
            <button
              onClick={handleGenerate}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-purple py-3 text-sm font-semibold text-white active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4" />
              Gerar Receitas e Treinos
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={markDone}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-bg-card py-3 text-sm text-gray-400 active:scale-[0.98]"
            >
              <SkipForward className="h-4 w-4" />
              Pular por agora
            </button>
          </div>
        )}

        {step === "done" && (
          <button
            onClick={markDone}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-blue py-3 text-sm font-semibold text-white active:scale-[0.98]"
          >
            Começar a usar
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
