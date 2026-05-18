"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pill, Salad, Dumbbell, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/medications", label: "Remédios", icon: Pill },
  { href: "/nutrition", label: "Nutrição", icon: Salad },
  { href: "/workout", label: "Treino", icon: Dumbbell },
  { href: "/profile", label: "Perfil", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-bg-elevated bg-bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-xs transition-colors",
                active ? "text-accent-blue" : "text-gray-500"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className={cn("text-[10px] font-medium", active && "text-accent-blue")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
