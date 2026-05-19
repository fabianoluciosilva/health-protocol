"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Mail, Lock, User, Calendar, Weight, Ruler, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Step = "account" | "profile";

export default function SignUpPage() {
  const supabase = createClient();
  const [step, setStep] = useState<Step>("account");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Step 2 — profile
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [wakeTime, setWakeTime] = useState("06:00");
  const [sleepTime, setSleepTime] = useState("22:00");

  const handleAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setError(null);
    setStep("profile");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
            birth_date: birthDate,
            weight_kg: parseFloat(weightKg).toString(),
            height_cm: parseFloat(heightCm).toString(),
            wake_time: wakeTime + ":00",
            sleep_time: sleepTime + ":00",
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      window.location.href = "/medications";
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-xl bg-bg-card py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-blue/10">
            <Heart className="h-7 w-7 text-accent-blue" />
          </div>
          <h1 className="text-xl font-bold text-white">Criar conta</h1>
          <div className="flex items-center justify-center gap-2">
            <span className={`h-1.5 w-8 rounded-full transition-colors ${step === "account" ? "bg-accent-blue" : "bg-accent-green"}`} />
            <span className={`h-1.5 w-8 rounded-full transition-colors ${step === "profile" ? "bg-accent-blue" : "bg-bg-elevated"}`} />
          </div>
          <p className="text-xs text-gray-500">
            {step === "account" ? "Passo 1 de 2 — Dados de acesso" : "Passo 2 de 2 — Dados do perfil"}
          </p>
        </div>

        {/* Step 1 — account */}
        {step === "account" && (
          <form onSubmit={handleAccount} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input type="email" placeholder="E-mail" value={email}
                onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                className={inputCls} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input type="password" placeholder="Senha (mín. 6 caracteres)" value={password}
                onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password"
                className={inputCls} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input type="password" placeholder="Confirmar senha" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password"
                className={inputCls} />
            </div>
            {error && <p className="text-center text-sm text-red-400">{error}</p>}
            <button type="submit"
              className="w-full rounded-xl bg-accent-blue py-3 text-sm font-semibold text-white active:scale-[0.98]">
              Próximo →
            </button>
          </form>
        )}

        {/* Step 2 — profile */}
        {step === "profile" && (
          <form onSubmit={handleSignUp} className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input type="text" placeholder="Nome completo" value={name}
                onChange={(e) => setName(e.target.value)} required
                className={inputCls} />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required
                className={inputCls + " text-gray-300"} />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Weight className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input type="number" placeholder="Peso (kg)" value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)} required step="0.1" min="30" max="300"
                  className={inputCls} />
              </div>
              <div className="relative flex-1">
                <Ruler className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input type="number" placeholder="Altura (cm)" value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)} required min="100" max="250"
                  className={inputCls} />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} required
                  className={inputCls + " text-gray-300"} />
              </div>
              <div className="relative flex-1">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} required
                  className={inputCls + " text-gray-300"} />
              </div>
            </div>
            <p className="text-center text-xs text-gray-600">Horário acordar · Horário dormir</p>

            {error && <p className="text-center text-sm text-red-400">{error}</p>}

            <div className="flex gap-2">
              <button type="button" onClick={() => { setStep("account"); setError(null); }}
                className="flex-1 rounded-xl bg-bg-card py-3 text-sm text-gray-400 active:scale-[0.98]">
                ← Voltar
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 rounded-xl bg-accent-blue py-3 text-sm font-semibold text-white disabled:opacity-50 active:scale-[0.98]">
                {loading ? "Criando…" : "Criar conta"}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-gray-500">
          Já tem conta?{" "}
          <Link href="/login" className="text-accent-blue font-medium">Fazer login</Link>
        </p>
      </div>
    </div>
  );
}
