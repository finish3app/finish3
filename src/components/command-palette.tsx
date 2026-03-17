"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/contexts/dashboard-context";
import { Command } from "cmdk";
import {
  Sun, Inbox, CheckCircle2, LayoutGrid, BarChart3, Settings,
  Plus, Search,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { tasks, spaces, setTaskDialogOpen } = useDashboard();

  // Listen for ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const navigate = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  const pendingTasks = useMemo(() => tasks.filter((t) => !t.is_completed).slice(0, 10), [tasks]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg animate-scale-in">
        <Command className="rounded-xl border bg-popover shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 border-b">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Command.Input
              placeholder="Search tasks, spaces, actions..."
              className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
              <Command.Item
                onSelect={() => { setOpen(false); setTaskDialogOpen(true); }}
                className="flex items-center gap-2 px-2 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-accent"
              >
                <Plus className="h-4 w-4" /> New Task
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
              {[
                { label: "Today", icon: Sun, path: "/dashboard" },
                { label: "Inbox", icon: Inbox, path: "/dashboard/inbox" },
                { label: "Completed", icon: CheckCircle2, path: "/dashboard/completed" },
                { label: "Spaces", icon: LayoutGrid, path: "/dashboard/spaces" },
                { label: "Insights", icon: BarChart3, path: "/dashboard/insights" },
                { label: "Settings", icon: Settings, path: "/dashboard/settings" },
              ].map((item) => (
                <Command.Item
                  key={item.path}
                  onSelect={() => navigate(item.path)}
                  className="flex items-center gap-2 px-2 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-accent"
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </Command.Item>
              ))}
            </Command.Group>

            {spaces.length > 0 && (
              <Command.Group heading="Spaces" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
                {spaces.map((space) => (
                  <Command.Item
                    key={space.id}
                    onSelect={() => navigate(`/dashboard/spaces/${space.id}`)}
                    className="flex items-center gap-2 px-2 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-accent"
                  >
                    <span>{space.emoji}</span> {space.name}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {pendingTasks.length > 0 && (
              <Command.Group heading="Tasks" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
                {pendingTasks.map((task) => (
                  <Command.Item
                    key={task.id}
                    className="flex items-center gap-2 px-2 py-2 rounded-md text-sm cursor-pointer aria-selected:bg-accent"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="truncate">{task.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
