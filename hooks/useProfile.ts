"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setProfile(null); setLoading(false); return; }

    // Tenta pelo id = auth uuid (caso normal)
    const { data: byId } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    if (byId) {
      setProfile(byId as Profile);
      setLoading(false);
      return;
    }

    // Fallback: perfil semente criado antes do auth (id = uuid aleatório).
    // RLS está desabilitado, então é seguro pegar o perfil mais antigo.
    const { data: oldest } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    setProfile((oldest as Profile | null) ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (patch: Partial<Profile>) => {
      if (!profile) return;
      const { data } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", profile.id)
        .select();
      const rows = (data ?? []) as Profile[];
      if (rows[0]) setProfile(rows[0]);
    },
    [profile, supabase]
  );

  return { profile, loading, update, reload: load };
}
