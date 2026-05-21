"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import InstallBanner from "@/components/InstallBanner";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = pathname === "/onboarding" || pathname === "/login" || pathname === "/signup";

  return (
    <>
      <main className={`mx-auto max-w-md ${hideChrome ? "" : "pb-24"}`}>
        {children}
      </main>
      {!hideChrome && <BottomNav />}
      {!hideChrome && <InstallBanner />}
    </>
  );
}
