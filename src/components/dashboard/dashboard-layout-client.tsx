"use client";

import React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { DashboardProvider, useDashboard } from "@/contexts/dashboard-context";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MobileTabBar } from "@/components/dashboard/mobile-tab-bar";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { TaskCreationDialog } from "@/components/task-creation-dialog";
import { Loader2 } from "lucide-react";

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!loading && profile && !profile.onboarding_completed) {
      router.replace("/onboarding");
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.svg" alt="Logo" className="w-10 h-10 rounded-xl" />
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user || (profile && !profile.onboarding_completed)) return null;

  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { taskDialogOpen, setTaskDialogOpen } = useDashboard();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10">
          {children}
        </div>
      </main>
      <MobileTabBar />
      <CommandPalette />
      <KeyboardShortcuts />
      <TaskCreationDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} />
    </div>
  );
}
