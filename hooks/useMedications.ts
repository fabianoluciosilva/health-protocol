"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Medication } from "@/lib/supabase/types";

type MedInput = Omit<Medication, "id" | "created_at">;

export function useMedications(activeOnly = true) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    const q = supabase.from("medications").select("*").order("time_1", { ascending: true });
    const { data } = activeOnly ? await q.eq("active", true) : await q;
    setMedications((data ?? []) as Medication[]);
    setLoading(false);
  }, [supabase, activeOnly]);

  useEffect(() => { load(); }, [load]);

  const addMedication = useCallback(async (input: MedInput) => {
    await supabase.from("medications").insert(input);
    await load();
  }, [supabase, load]);

  const updateMedication = useCallback(async (id: string, input: Partial<MedInput>) => {
    await supabase.from("medications").update(input).eq("id", id);
    await load();
  }, [supabase, load]);

  const removeMedication = useCallback(async (id: string) => {
    await supabase.from("medications").delete().eq("id", id);
    await load();
  }, [supabase, load]);

  return { medications, loading, addMedication, updateMedication, removeMedication };
}
