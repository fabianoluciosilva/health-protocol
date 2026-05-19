"use client";

import { Sparkles, X, RefreshCw } from "lucide-react";

interface Props {
  type: "nutrition" | "workout";
  generating: boolean;
  result: string | null;
  error: string | null;
  renewalDue?: boolean;
  onGenerate: () => void;
  onDismiss: () => void;
}

const LABELS = {
  nutrition: {
    title: "Gerar Dieta Personalizada",
    auto: "Sua dieta ainda não foi gerada pela IA.",
    renewal: "Sua dieta está pronta para ser renovada.",
    btn: "Gerar Nova Dieta",
    btnRenew: "Renovar Dieta",
    icon: "🥗",
  },
  workout: {
    title: "Gerar Treino Personalizado",
    auto: "Seu treino ainda não foi gerado pela IA.",
    renewal: "Seu treino está pronto para ser renovado.",
    btn: "Gerar Novo Treino",
    btnRenew: "Renovar Treino",
    icon: "💪",
  },
};

export default function AIGenerateOverlay({
  type,
  generating,
  result,
  error,
  renewalDue = false,
  onGenerate,
  onDismiss,
}: Props) {
  const L = LABELS[type];

  if (generating) {
    return (
      <div className="rounded-2xl border border-accent-purple/30 bg-accent-purple/5 p-5">
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-bg-elevated border-t-accent-purple" />
          <p className="text-sm font-medium text-accent-purple">
            Gerando com IA… pode levar alguns segundos
          </p>
          <p className="text-xs text-gray-500">
            Cruzando perfil, restrições e documentos anexados
          </p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-accent-green/30 bg-accent-green/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-green" />
            <span className="text-sm font-semibold text-accent-green">{L.title} — Concluído</span>
          </div>
          <button onClick={onDismiss} className="rounded-lg p-1 text-gray-500 active:bg-bg-elevated">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto rounded-xl bg-bg-elevated p-3 text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
          {result}
        </div>
        <button
          onClick={onGenerate}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-bg-elevated py-2 text-xs text-gray-400 active:scale-95"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Gerar novamente
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
        <p className="text-sm text-red-400">{error}</p>
        <div className="flex gap-2">
          <button onClick={onGenerate}
            className="flex-1 rounded-xl bg-red-500/20 py-2 text-sm text-red-400 active:scale-95">
            Tentar novamente
          </button>
          <button onClick={onDismiss}
            className="flex-1 rounded-xl bg-bg-elevated py-2 text-sm text-gray-400 active:scale-95">
            Fechar
          </button>
        </div>
      </div>
    );
  }

  // Banner padrão (primeiro acesso ou renovação vencida)
  return (
    <div className="rounded-2xl border border-accent-purple/30 bg-accent-purple/5 p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{L.icon}</span>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold text-white">{L.title}</p>
          <p className="text-xs text-gray-400">
            {renewalDue ? L.renewal : L.auto}{" "}
            Será personalizado com base no seu perfil, restrições e documentos.
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onGenerate}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent-purple py-2.5 text-sm font-semibold text-white active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4" />
          {renewalDue ? L.btnRenew : L.btn}
        </button>
        <button
          onClick={onDismiss}
          className="rounded-xl bg-bg-elevated px-3 py-2.5 text-xs text-gray-400 active:scale-95"
        >
          Depois
        </button>
      </div>
    </div>
  );
}
