import type { Metadata } from "next";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";

export const metadata: Metadata = {
  title: "Dashboard — Finish3",
  description: "Your daily productivity dashboard. Focus on your top 3 tasks.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
