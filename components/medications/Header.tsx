"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { dateLabelBR, dayNameBR, greetingBR } from "@/lib/utils/medications";

interface Props {
  name: string;
  date: Date;
}

export default function Header({ name, date }: Props) {
  return (
    <header className="flex items-start justify-between">
      <div>
        <h1 className="text-xl font-semibold text-white">
          {greetingBR(date)}, {name} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-0.5 text-xs text-gray-400">
          Hoje é {dayNameBR(date)} · {dateLabelBR(date)}
        </p>
      </div>
      <Link
        href="/profile"
        className="rounded-xl bg-bg-card p-2 text-gray-400 active:scale-95"
        aria-label="Perfil"
      >
        <Settings className="h-5 w-5" />
      </Link>
    </header>
  );
}
