"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Props {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  className?: string;
}

export default function WeightInput({ value, onChange, step = 2.5, min = 0, className }: Props) {
  const dec = () => onChange(Math.max(min, Math.round((value - step) * 10) / 10));
  const inc = () => onChange(Math.round((value + step) * 10) / 10);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        onClick={dec}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-elevated text-gray-300 active:scale-90"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="flex-1 rounded-xl bg-bg-elevated py-2 text-center">
        <span className="text-xl font-bold tabular-nums text-white">{value}</span>
        <span className="ml-1 text-sm text-gray-400">kg</span>
      </div>
      <button
        onClick={inc}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-elevated text-gray-300 active:scale-90"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
