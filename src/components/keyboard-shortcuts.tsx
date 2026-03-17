"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/contexts/dashboard-context";

export function KeyboardShortcuts() {
  const router = useRouter();
  const { setTaskDialogOpen } = useDashboard();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          setTaskDialogOpen(true);
          break;
        case "1":
          e.preventDefault();
          router.push("/dashboard");
          break;
        case "2":
          e.preventDefault();
          router.push("/dashboard/inbox");
          break;
        case "3":
          e.preventDefault();
          router.push("/dashboard/spaces");
          break;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [router, setTaskDialogOpen]);

  return null;
}
