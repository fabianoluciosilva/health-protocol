"use client";

import { CATEGORIES } from "@/lib/utils/exams";
import { cn } from "@/lib/utils/cn";

interface Props {
  active: string;
  onChange: (key: string) => void;
  counts?: Partial<Record<string, number>>;
}

export default function CategoryFilter({ active, onChange, counts }: Props) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {CATEGORIES.map((c) => {
        const isActive = active === c.key;
        const count = counts?.[c.key];
        return (
          <button
            key={c.key}
            onClick={() => onChange(c.key)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition",
              isActive ? "bg-accent-blue text-white" : "bg-bg-card text-gray-400"
            )}
          >
            {c.label}
            {typeof count === "number" && count > 0 && (
              <span className={cn("ml-1 text-[10px]", isActive ? "text-white/80" : "text-gray-500")}>
                ({count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
