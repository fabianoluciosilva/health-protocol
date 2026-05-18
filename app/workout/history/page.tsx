"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { WorkoutSession, ExerciseLog } from "@/lib/supabase/types";

interface SessionWithLogs extends WorkoutSession {
  logs: ExerciseLog[];
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionWithLogs[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: sessData } = await supabase
        .from("workout_sessions")
        .select("*, split:workout_splits(*)")
        .eq("completed", true)
        .order("session_date", { ascending: false })
        .limit(30);

      if (!sessData) { setLoading(false); return; }

      const sessIds = (sessData as WorkoutSession[]).map((s) => s.id);
      const { data: logsData } = await supabase
        .from("exercise_logs")
        .select("*, exercise:exercises(name)")
        .in("session_id", sessIds)
        .eq("completed", true);

      const logsBySession = ((logsData ?? []) as ExerciseLog[]).reduce<Record<string, ExerciseLog[]>>(
        (acc, l) => { (acc[l.session_id] ??= []).push(l); return acc; }, {}
      );

      setSessions((sessData as WorkoutSession[]).map((s) => ({ ...s, logs: logsBySession[s.id] ?? [] })));
      setLoading(false);
    })();
  }, [supabase]);

  const formatDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short" });

  const duration = (s: WorkoutSession) => {
    if (!s.started_at || !s.completed_at) return null;
    return Math.round((new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60000);
  };

  return (
    <div className="space-y-4 px-4 pt-4">
      <header className="flex items-center gap-3">
        <Link href="/workout" className="rounded-xl bg-bg-card p-2 text-gray-400 active:scale-95">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold text-white">Histórico de Treinos</h1>
      </header>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-bg-card" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl bg-bg-card p-6 text-center text-sm text-gray-400">
          Nenhum treino concluído ainda.{" "}
          <Link href="/workout" className="text-accent-blue">Iniciar primeiro treino</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const dur = duration(s);
            return (
              <div key={s.id} className="rounded-2xl bg-bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(s.session_date)}
                    </div>
                    <div className="mt-1 font-semibold text-white">
                      {(s as SessionWithLogs & { split?: { split_name: string } }).split?.split_name ?? "Treino"}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-xs text-accent-green">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {s.logs.length} exercícios
                    </div>
                    {dur && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {dur} min
                      </div>
                    )}
                  </div>
                </div>
                {s.logs.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-bg-elevated pt-3">
                    {s.logs.map((l) => (
                      <li key={l.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 truncate flex-1">{l.exercise?.name ?? "—"}</span>
                        <span className="ml-2 shrink-0 font-medium text-white">
                          {l.weight_kg != null ? `${l.weight_kg} kg` : "PC"}
                          {l.sets_done && <span className="text-gray-500"> · {l.sets_done}×{l.reps_done}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
