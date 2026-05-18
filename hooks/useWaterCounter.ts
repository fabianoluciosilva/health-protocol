"use client";

import { useCallback, useEffect, useState } from "react";

const KEY_PREFIX = "water-log";

function todayKey(d = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${KEY_PREFIX}:${yyyy}-${mm}-${dd}`;
}

export function useWaterCounter(goalMl = 3000) {
  const [ml, setMl] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(todayKey()) : null;
    setMl(raw ? Number(raw) || 0 : 0);
    setReady(true);
  }, []);

  const persist = useCallback((v: number) => {
    setMl(v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(todayKey(), String(v));
    }
  }, []);

  const add = useCallback((amount: number) => persist(Math.max(0, ml + amount)), [ml, persist]);
  const reset = useCallback(() => persist(0), [persist]);

  const pct = Math.min(100, Math.round((ml / goalMl) * 100));

  return { ml, goalMl, pct, add, reset, ready };
}
