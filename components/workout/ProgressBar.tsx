import { cn } from "@/lib/utils/cn";

interface Props {
  done: number;
  total: number;
  className?: string;
}

export default function ProgressBar({ done, total, className }: Props) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-xs text-gray-400">
        <span><span className="font-semibold text-white">{done}</span> de {total} exercícios</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-bg-elevated">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-purple transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
