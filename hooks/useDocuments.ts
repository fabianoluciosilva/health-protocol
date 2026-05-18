"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ProfileDocument } from "@/lib/supabase/types";

export function useDocuments() {
  const [docs, setDocs] = useState<ProfileDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profile_documents")
      .select("*")
      .order("created_at", { ascending: false });
    setDocs((data ?? []) as ProfileDocument[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const uploadAndSave = useCallback(
    async (
      file: File,
      doc_type: ProfileDocument["doc_type"],
      title: string,
      valid_from?: string,
      valid_days?: number,
      notes?: string
    ) => {
      const path = `${Date.now()}_${file.name.replace(/\s/g, "_")}`;
      const { data: upData, error } = await supabase.storage
        .from("documents")
        .upload(path, file, { upsert: false });

      let file_url: string | null = null;
      let file_name: string | null = file.name;

      if (!error && upData) {
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(upData.path);
        file_url = urlData.publicUrl;
      }

      await supabase.from("profile_documents").insert({
        doc_type,
        title,
        file_url,
        file_name,
        valid_from: valid_from ?? null,
        valid_days: valid_days ?? null,
        notes: notes ?? null,
      });
      await load();
    },
    [supabase, load]
  );

  const removeDoc = useCallback(async (id: string, file_url: string | null) => {
    if (file_url) {
      const path = file_url.split("/documents/")[1];
      if (path) await supabase.storage.from("documents").remove([path]);
    }
    await supabase.from("profile_documents").delete().eq("id", id);
    await load();
  }, [supabase, load]);

  return { docs, loading, uploadAndSave, removeDoc };
}

export function daysRemaining(validFrom: string, validDays: number): number {
  const [y, m, d] = validFrom.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(start.getTime() + validDays * 86_400_000);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / 86_400_000);
}
