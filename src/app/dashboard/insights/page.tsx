"use client";

import React, { useMemo } from "react";
import { useDashboard } from "@/contexts/dashboard-context";
import { useAuth } from "@/contexts/auth-context";
import { canViewFullInsights } from "@/lib/subscription";
import { calculateStreakStatus } from "@/lib/streak";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, CheckCircle2, Flame, Target, TrendingUp, Lock, Crown } from "lucide-react";
import { useRouter } from "next/navigation";
import { isThisWeek } from "date-fns";

export default function InsightsPage() {
  const { tasks, streak } = useDashboard();
  const { profile } = useAuth();
  const router = useRouter();
  const hasFull = canViewFullInsights(profile);

  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.is_completed);
    const thisWeek = completed.filter((t) => t.completed_at && isThisWeek(new Date(t.completed_at)));
    const todayCompleted = completed.filter(
      (t) => t.completed_at && new Date(t.completed_at).toDateString() === new Date().toDateString()
    );
    const dailyTop3Today = todayCompleted.filter((t) => t.is_daily_top_3);
    const todayProgress = dailyTop3Today.length;

    const streakStatus = calculateStreakStatus(streak);

    return {
      weeklyCount: thisWeek.length,
      allTimeCount: completed.length,
      todayProgress,
      todayTotal: tasks.filter((t) => t.is_daily_top_3).length,
      currentStreak: streakStatus.current,
      longestStreak: Math.max(streak?.longest_streak || 0, streakStatus.current),
    };
  }, [tasks, streak]);

  const statCards = [
    {
      label: "This Week",
      value: stats.weeklyCount,
      icon: TrendingUp,
      gradient: "from-blue-400 to-indigo-500",
      free: true,
    },
    {
      label: "Today's Top 3",
      value: `${stats.todayProgress}/3`,
      icon: Target,
      gradient: "from-amber-400 to-orange-500",
      free: false,
    },
    {
      label: "All Time",
      value: stats.allTimeCount,
      icon: CheckCircle2,
      gradient: "from-green-400 to-emerald-500",
      free: false,
    },
    {
      label: "Current Streak",
      value: `${stats.currentStreak} days`,
      icon: Flame,
      gradient: "from-orange-400 to-red-500",
      free: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-sm">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Insights</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {statCards.map((stat) => {
          const locked = !stat.free && !hasFull;

          return (
            <Card key={stat.label} className={`relative overflow-hidden ${locked ? "opacity-70" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">
                      {locked ? "—" : stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upgrade CTA for free users */}
      {!hasFull && (
        <Card className="border-amber-500/20 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10">
          <CardContent className="p-6 text-center">
            <Crown className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground mb-1">Unlock Full Insights</h3>
            <p className="text-sm text-muted-foreground mb-4">
              See all-time stats, trends, streak history, and more with Pro.
            </p>
            <Button variant="brand" onClick={() => router.push("/dashboard/settings")}>
              Upgrade to Pro — $7/mo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Longest streak */}
      {hasFull && stats.longestStreak > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Flame className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Longest Streak</p>
                <p className="text-xl font-bold">{stats.longestStreak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
