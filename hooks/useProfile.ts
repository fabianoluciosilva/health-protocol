"use client";

import { useEffect, useState, useCallback } from "react";
import type { Profile } from "@/lib/supabase/types";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) { setProfile(null); setLoading(false); return; }
      const data = await res.json();
      setProfile(data as Profile);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (patch: Partial<Profile>) => {
      if (!profile) return;
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) return;
        const data = await res.json();
        setProfile(data as Profile);
      } catch {}
    },
    [profile]
  );

  return { profile, loading, update, reload: load };
}
