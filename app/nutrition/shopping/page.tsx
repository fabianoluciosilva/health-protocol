"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingCart, Check } from "lucide-react";
import { useState } from "react";

interface Item {
  name: string;
  qty: string;
  done?: boolean;
}

interface Category {
  label: string;
  icon: string;
  items: Item[];
}

const SHOPPING_LIST: Category[] = [
  {
    label: "Proteínas",
    icon: "🥩",
    items: [
      { name: "Filé de frango", qty: "2 kg" },
      { name: "Carne bovina magra (patinho/alcatra)", qty: "800 g" },
      { name: "Tilápia ou peixe branco", qty: "800 g" },
      { name: "Salmão", qty: "360 g" },
      { name: "Atum em lata (ao natural)", qty: "4 latas" },
      { name: "Ovos", qty: "2 dúzias" },
      { name: "Whey Protein", qty: "conforme estoque" },
      { name: "Presunto de peru", qty: "200 g" },
    ],
  },
  {
    label: "Laticínios",
    icon: "🥛",
    items: [
      { name: "Iogurte grego integral", qty: "2 kg (8 potes 250g)" },
      { name: "Queijo minas frescal", qty: "400 g" },
      { name: "Queijo cottage", qty: "300 g" },
      { name: "Queijo light fatiado", qty: "200 g" },
      { name: "Ricota", qty: "200 g" },
    ],
  },
  {
    label: "Carboidratos",
    icon: "🌾",
    items: [
      { name: "Arroz integral", qty: "1 kg" },
      { name: "Batata-doce", qty: "1,5 kg" },
      { name: "Pão integral (low-carb se possível)", qty: "2 pacotes" },
      { name: "Granola sem açúcar", qty: "400 g" },
      { name: "Tapioca (goma)", qty: "500 g" },
    ],
  },
  {
    label: "Vegetais",
    icon: "🥦",
    items: [
      { name: "Brócolis", qty: "600 g" },
      { name: "Abobrinha", qty: "6 unid" },
      { name: "Couve-flor", qty: "1 unid" },
      { name: "Espinafre (folhas)", qty: "200 g" },
      { name: "Couve manteiga", qty: "1 maço" },
      { name: "Chuchu", qty: "3 unid" },
      { name: "Pepino", qty: "4 unid" },
      { name: "Tomate", qty: "500 g" },
      { name: "Mix salada verde (alface, rúcula)", qty: "500 g" },
      { name: "Alho", qty: "1 cabeça" },
      { name: "Cebola", qty: "4 unid" },
    ],
  },
  {
    label: "Frutas",
    icon: "🍌",
    items: [
      { name: "Banana", qty: "1 cacho" },
      { name: "Maçã", qty: "6 unid" },
      { name: "Frutas vermelhas (morango/mirtilo)", qty: "400 g" },
    ],
  },
  {
    label: "Gorduras boas",
    icon: "🫒",
    items: [
      { name: "Azeite de oliva extra virgem", qty: "500 ml" },
      { name: "Castanhas-do-pará", qty: "200 g" },
      { name: "Amendoim sem sal", qty: "200 g" },
      { name: "Amêndoas", qty: "150 g" },
    ],
  },
  {
    label: "Temperos e outros",
    icon: "🧂",
    items: [
      { name: "Cúrcuma (açafrão)", qty: "50 g" },
      { name: "Gengibre fresco", qty: "1 raiz" },
      { name: "Canela em pó", qty: "1 pote" },
      { name: "Sal rosa himalaia", qty: "1 pote" },
      { name: "Café (sem açúcar)", qty: "250 g" },
      { name: "Limão", qty: "6 unid" },
    ],
  },
  {
    label: "Hidratação",
    icon: "💧",
    items: [
      { name: "Água mineral (3+ L/dia)", qty: "21 L/semana" },
      { name: "Chá verde (sachês)", qty: "1 caixa" },
    ],
  },
];

export default function ShoppingPage() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const total = SHOPPING_LIST.reduce((acc, c) => acc + c.items.length, 0);
  const done = checked.size;

  return (
    <div className="min-h-screen bg-bg-base pb-24">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-bg-elevated bg-bg-base/95 px-4 pb-3 pt-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <Link href="/nutrition" className="rounded-full p-1.5 text-gray-400 active:bg-bg-card">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <h1 className="flex items-center gap-2 text-base font-bold text-white">
                <ShoppingCart className="h-4 w-4 text-accent-green" />
                Lista de Compras
              </h1>
              <p className="text-xs text-gray-500">Semana completa — protocolo de saúde</p>
            </div>
            <div className="rounded-full bg-bg-card px-3 py-1 text-xs font-semibold text-gray-300">
              {done}/{total}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-elevated">
            <div
              className="h-full rounded-full bg-accent-green transition-all duration-300"
              style={{ width: total ? `${(done / total) * 100}%` : "0%" }}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4 p-4">
          {SHOPPING_LIST.map((cat) => (
            <div key={cat.label} className="rounded-2xl bg-bg-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-bg-elevated px-4 py-2.5">
                <span className="text-base">{cat.icon}</span>
                <span className="text-sm font-semibold text-gray-200">{cat.label}</span>
                <span className="ml-auto text-xs text-gray-500">
                  {cat.items.filter((it) => checked.has(`${cat.label}:${it.name}`)).length}/
                  {cat.items.length}
                </span>
              </div>
              <div className="divide-y divide-bg-elevated">
                {cat.items.map((item) => {
                  const key = `${cat.label}:${item.name}`;
                  const isDone = checked.has(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggle(key)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-bg-elevated"
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          isDone
                            ? "border-accent-green bg-accent-green"
                            : "border-gray-600 bg-transparent"
                        }`}
                      >
                        {isDone && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span
                          className={`block text-sm transition-colors ${
                            isDone ? "text-gray-500 line-through" : "text-white"
                          }`}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs text-gray-500">{item.qty}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {done === total && total > 0 && (
            <div className="rounded-2xl bg-accent-green/10 border border-accent-green/30 p-4 text-center text-sm text-accent-green">
              ✓ Lista completa! Boas compras.
            </div>
          )}

          <p className="text-center text-xs text-gray-600 pb-2">
            Baseado no cardápio semanal do protocolo de saúde.
            <br />
            Priorize alimentos sem ultraprocessados e sem açúcar adicionado.
          </p>
        </div>
      </div>
    </div>
  );
}
