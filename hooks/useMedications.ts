"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Medication } from "@/lib/supabase/types";

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("medications")
        .select("*")
        .eq("active", true)
        .order("time_1", { ascending: true });
      if (!cancelled) {
        setMedications(((data ?? []) as Medication[]));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return { medications, loading };
}
