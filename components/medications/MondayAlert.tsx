import { AlertTriangle } from "lucide-react";

interface Props {
  count: number;
}

export default function MondayAlert({ count }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
      <div className="text-sm">
        <div className="font-semibold text-amber-200">DIA CHEIO — {count} medicamentos hoje</div>
        <div className="mt-0.5 text-xs text-amber-100/80">
          Segunda inclui Mounjaro, Vitamina D, Anastrozol e a rotina diária.
        </div>
      </div>
    </div>
  );
}
