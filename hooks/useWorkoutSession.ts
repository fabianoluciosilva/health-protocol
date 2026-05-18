"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WorkoutSession } from "@/lib/supabase/types";
import { formatDateISO } from "@/lib/utils/workout";

export function useWorkoutSession(date: Date, splitId: string | undefined) {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const todayStr = formatDateISO(date);

  const loadSession = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("workout_sessions")
      .select("*")
      .eq("session_date", todayStr)
      .maybeSingle();
    setSession(data as WorkoutSession | null);
    setLoading(false);
  }, [supabase, todayStr]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const startSession = useCallback(async () => {
    if (!splitId) return null;
    const { data, error } = await supabase
      .from("workout_sessions")
      .upsert(
        {
          session_date: todayStr,
          split_id: splitId,
          started_at: new Date().toISOString(),
          completed: false,
        },
        { onConflict: "session_date" }
      )
      .select()
      .single();
    if (!error) setSession(data as WorkoutSession);
    return data as WorkoutSession | null;
  }, [supabase, splitId, todayStr]);

  const completeSession = useCallback(async () => {
    if (!session) return;
    await supabase
      .from("workout_sessions")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("id", session.id);
    await loadSession();
  }, [supabase, session, loadSession]);

  return { session, loading, startSession, completeSession, reload: loadSession };
}
