"use client";

import { Smartphone, X } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export default function InstallBanner() {
  const { canInstall, install, dismiss } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md">
      <div className="flex items-center gap-3 rounded-2xl border border-accent-blue/30 bg-bg-card/95 p-3.5 shadow-xl backdrop-blur">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-blue/10">
          <Smartphone className="h-5 w-5 text-accent-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Instalar como app</p>
          <p className="text-xs text-gray-400">Acesso rápido na tela inicial</p>
        </div>
        <button
          onClick={install}
          className="rounded-xl bg-accent-blue px-3 py-2 text-xs font-bold text-white active:scale-95"
        >
          Instalar
        </button>
        <button
          onClick={dismiss}
          className="rounded-lg p-1.5 text-gray-500 active:bg-bg-elevated"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
