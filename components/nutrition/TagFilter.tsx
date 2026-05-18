"use client";

import { TAG_KEYS, TAG_LABELS, type TagKey } from "@/lib/utils/nutrition";
import { cn } from "@/lib/utils/cn";

interface Props {
  active: TagKey | "all";
  onChange: (k: TagKey | "all") => void;
}

export default function TagFilter({ active, onChange }: Props) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      <Pill k="all" label="Todos" icon="" active={active === "all"} onClick={() => onChange("all")} />
      {TAG_KEYS.map((k) => (
        <Pill
          key={k}
          k={k}
          label={TAG_LABELS[k].label}
          icon={TAG_LABELS[k].icon}
          active={active === k}
          onClick={() => onChange(k)}
        />
      ))}
    </div>
  );
}

function Pill({ k, label, icon, active, onClick }: { k: string; label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition",
        active ? "bg-accent-blue text-white" : "bg-bg-card text-gray-400"
      )}
      key={k}
    >
      {icon && <span className="mr-1">{icon}</span>}{label}
    </button>
  );
}
