"use client";

import { Dumbbell, Bed, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { dateLabelBR, dayNameBR, greetingBR } from "@/lib/utils/dates";

interface Props {
  name: string;
  date: Date;
  isTrainingDay: boolean;
  onToggleTraining: (v: boolean) => void;
}

export default function Header({ name, date, isTrainingDay, onToggleTraining }: Props) {
  return (
    <header className="space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">
            {greetingBR(date)}, {name} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-0.5 text-xs text-gray-400">
            {dayNameBR(date)} · {dateLabelBR(date)}
          </p>
        </div>
        <Link
          href="/nutrition/shopping"
          className="flex items-center gap-1.5 rounded-full bg-bg-card px-3 py-1.5 text-xs font-medium text-gray-300 active:scale-95"
        >
          <ShoppingCart className="h-3.5 w-3.5 text-accent-green" />
          Compras
        </Link>
      </div>
      <button
        onClick={() => onToggleTraining(!isTrainingDay)}
        className="inline-flex items-center gap-1.5 rounded-full bg-bg-card px-3 py-1 text-xs font-medium text-white active:scale-95"
      >
        {isTrainingDay ? (
          <>
            <Dumbbell className="h-3.5 w-3.5 text-accent-orange" /> Dia de treino
          </>
        ) : (
          <>
            <Bed className="h-3.5 w-3.5 text-accent-blue" /> Dia de descanso
          </>
        )}
        <span className="ml-1 text-[10px] text-gray-500">tocar para alternar</span>
      </button>
    </header>
  );
}
