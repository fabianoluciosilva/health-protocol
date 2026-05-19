"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes("Email not confirmed")) {
          setError("E-mail não confirmado. Confirme no painel do Supabase.");
        } else {
          setError("E-mail ou senha incorretos");
        }
        setLoading(false);
        return;
      }

      // Hard navigation garante que o cookie de sessão seja lido pelo middleware
      window.location.href = "/medications";
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-blue/10">
            <Heart className="h-8 w-8 text-accent-blue" />
          </div>
          <h1 className="text-2xl font-bold text-white">Protocolo de Saúde</h1>
          <p className="text-sm text-gray-500">Faça login para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl bg-bg-card py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl bg-bg-card py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue"
            />
          </div>

          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent-blue py-3 text-sm font-semibold text-white disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Não tem conta?{" "}
          <Link href="/signup" className="font-medium text-accent-blue">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
