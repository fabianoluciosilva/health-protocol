"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playBeep } from "@/lib/utils/timer";

export function useRestTimer() {
  const [active, setActive] = useState(false);
  const [total, setTotal] = useState(90);
  const [remaining, setRemaining] = useState(90);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActive(false);
  }, []);

  const start = useCallback(
    (seconds: number) => {
      stop();
      setTotal(seconds);
      setRemaining(seconds);
      setActive(true);
    },
    [stop]
  );

  const skip = useCallback(() => {
    stop();
    setRemaining(0);
  }, [stop]);

  useEffect(() => {
    if (!active) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current!);
          setActive(false);
          playBeep();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [active]);

  const pct = total > 0 ? Math.round(((total - remaining) / total) * 100) : 100;

  return { active, remaining, total, pct, start, stop, skip };
}
