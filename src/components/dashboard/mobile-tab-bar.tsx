"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sun, Inbox, LayoutGrid, User } from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "Today", icon: Sun },
  { href: "/dashboard/inbox", label: "Inbox", icon: Inbox },
  { href: "/dashboard/spaces", label: "Spaces", icon: LayoutGrid },
  { href: "/dashboard/settings", label: "Account", icon: User },
];

export function MobileTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background/80 backdrop-blur-xl border-t border-border safe-area-bottom">
      <nav className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = tab.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(tab.href);

          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors",
                isActive
                  ? "text-amber-500"
                  : "text-muted-foreground"
              )}
            >
              <tab.icon className={cn("h-5 w-5", isActive && "text-amber-500")} />
              <span className={cn("text-[10px] mt-1 font-medium", isActive && "text-amber-500")}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
