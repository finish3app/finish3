"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useDashboard } from "@/contexts/dashboard-context";
import { cn } from "@/lib/utils";
import { isPro } from "@/lib/subscription";
import {
  Sun, Inbox, CheckCircle2, BarChart3,
  Settings, LogOut, Flame, ChevronLeft, ChevronRight, Crown,
  Plus, ChevronDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const mainNavItems = [
  { href: "/dashboard", label: "Today", icon: Sun },
  { href: "/dashboard/inbox", label: "Inbox", icon: Inbox },
  { href: "/dashboard/completed", label: "Completed", icon: CheckCircle2 },
  { href: "/dashboard/insights", label: "Insights", icon: BarChart3 },
];

export function DashboardSidebar({ mobileOpen, onMobileClose }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const { streak, spaces, getDailyTop3, getCompletedTasks } = useDashboard();

  const todayCount = getDailyTop3().length;
  const completedCount = getCompletedTasks().length;

  const navigate = (href: string) => {
    router.push(href);
    onMobileClose?.();
  };

  const workspaceName = profile?.workspace_name || "My Workspace";



  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-sidebar-background border-r border-sidebar-border flex flex-col transition-all duration-300",
          collapsed ? "w-[68px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:relative"
        )}
      >
        {/* Header — Workspace Dropdown */}
        <div className={cn("flex items-center h-16 px-4 border-b border-sidebar-border", collapsed && "justify-center")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 -mx-1.5 hover:bg-sidebar-accent/50 transition-colors w-full",
                  collapsed && "justify-center"
                )}
              >
                <span className="text-[15px] font-semibold text-sidebar-foreground truncate">{workspaceName}</span>
                {!collapsed && (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto flex-shrink-0" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem
                onClick={() => navigate("/dashboard/settings")}
                className="cursor-pointer"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={signOut}
                className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Streak */}
        {streak && streak.current_streak > 0 && (
          <div className={cn("px-4 py-3", collapsed && "px-2 flex justify-center")}>
            <div className="flex items-center gap-2 text-sm">
              <Flame className="h-4 w-4 text-orange-500 animate-streak-pulse" />
              {!collapsed && (
                <span className="text-sidebar-foreground font-medium">
                  {streak.current_streak} day streak
                </span>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-thin">
          
          {/* MAIN GROUP */}
          <div>
            {!collapsed && (
              <div className="px-3 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  MAIN
                </span>
              </div>
            )}
            <div className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

                return (
                  <button
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <item.icon className={cn("h-[18px] w-[18px] flex-shrink-0", isActive ? "text-amber-600" : "text-gray-400")} />
                    {!collapsed && 
                      <div className="flex flex-1 items-center justify-between">
                        <span>{item.label}</span>
                        {item.href === "/dashboard/completed" && completedCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-[10px] font-medium text-gray-500">{completedCount}</span>
                        )}
                        {item.href === "/dashboard" && todayCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-100/50 text-[10px] font-medium text-amber-600">{todayCount}</span>
                        )}
                      </div>
                    }
                  </button>
                );
              })}
            </div>
          </div>

          {/* SPACES GROUP */}
          <div>
            {!collapsed && (
              <div className="px-3 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  SPACES
                </span>
              </div>
            )}
            <div className="space-y-1">
              {spaces.map((space) => (
                <button
                  key={space.id}
                  onClick={() => navigate(`/dashboard/spaces/${space.id}`)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === `/dashboard/spaces/${space.id}`
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <span className="text-base flex-shrink-0 h-[18px] w-[18px] flex items-center justify-center">{space.emoji}</span>
                  {!collapsed && <span className="truncate flex-1 text-left">{space.name}</span>}
                </button>
              ))}
              <button
                onClick={() => navigate("/dashboard/spaces")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-sidebar-accent/50 transition-colors",
                  collapsed && "justify-center px-0"
                )}
              >
                <Plus className="h-[18px] w-[18px] flex-shrink-0" />
                {!collapsed && <span>Add Space</span>}
              </button>
            </div>
          </div>

        </nav>

        {/* Upgrade banner for free users */}
        {!isPro(profile) && !collapsed && (
          <div className="px-3 pb-3">
            <button
              onClick={() => navigate("/dashboard/settings")}
              className="w-full p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                <Crown className="h-4 w-4" />
                Upgrade to Pro
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-left">
                Unlimited spaces, labels & more
              </p>
            </button>
          </div>
        )}



        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-background border border-border items-center justify-center hover:bg-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>
    </>
  );
}
