"use client";

import React, { useState, useMemo } from "react";
import { useDashboard } from "@/contexts/dashboard-context";
import { LinearTaskRow } from "@/components/linear-ui/linear-task-row";
import { CheckCircle2, Search, X, Filter } from "lucide-react";
import { format, isToday, isYesterday, isThisWeek, parseISO, compareDesc } from "date-fns";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FilterType = "all" | "daily-top-3" | "other-tasks";

export default function CompletedPage() {
  const { getCompletedTasks, toggleComplete } = useDashboard();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const router = useRouter();

  const completedTasks = getCompletedTasks();

  const filteredTasks = useMemo(() => {
    let result = completedTasks;

    // Apply Filter Type
    if (filter === "daily-top-3") {
      result = result.filter((t) => t.is_daily_top_3);
    } else if (filter === "other-tasks") {
      result = result.filter((t) => !t.is_daily_top_3);
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [completedTasks, filter, searchQuery]);

  // Group by date
  const groupedTasks = useMemo(() => {
    const buckets: Record<string, typeof filteredTasks> = {};

    filteredTasks.forEach((task) => {
      // Parse ISO string properly if available, else fallback to updated_at
      const dateStr = task.completed_at || task.updated_at;
      const date = dateStr ? parseISO(dateStr) : new Date();
      let label: string;

      if (isToday(date)) label = "Today";
      else if (isYesterday(date)) label = "Yesterday";
      else if (isThisWeek(date)) label = "This Week";
      else label = format(date, "MMMM yyyy");

      if (!buckets[label]) buckets[label] = [];
      buckets[label].push(task);
    });

    // Formatting them into an ordered array
    const sortedGroupLabels = Object.keys(buckets).sort((a, b) => {
      // Constant explicit ordering hierarchy
      const priority: Record<string, number> = {
        "Today": 1,
        "Yesterday": 2,
        "This Week": 3
      };

      const pA = priority[a] || 99;
      const pB = priority[b] || 99;

      if (pA !== pB) return pA - pB;

      // If both are month strings, parse and sort descending
      const dateA = new Date(`1 ${a}`);
      const dateB = new Date(`1 ${b}`);
      return compareDesc(dateA, dateB);
    });

    return sortedGroupLabels.map(label => ({
      label,
      tasks: buckets[label]
    }));
  }, [filteredTasks]);

  const getFilterLabel = () => {
    switch (filter) {
      case "daily-top-3": return "Daily Top 3";
      case "other-tasks": return "Other tasks";
      default: return "All tasks";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 md:py-12 bg-white min-h-screen">
      
      {/* 4. LinearCompletedHeader */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        
        {/* Left Section (Title + Count) */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Completed</h1>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
            {filteredTasks.length}
          </span>
        </div>

        {/* Right Section (Search + Filter) */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-9 pr-8 text-sm bg-gray-50 border border-transparent focus:bg-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-md outline-none transition-colors placeholder:text-gray-400 text-gray-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center gap-1.5 h-8 px-2.5 bg-white border border-dashed border-gray-300 hover:bg-gray-50 text-xs font-medium text-gray-600 rounded-md outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors">
                <Filter className="w-3.5 h-3.5" />
                {getFilterLabel()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setFilter("all")} className={filter === "all" ? "bg-gray-50 font-medium" : ""}>
                All tasks
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilter("daily-top-3")} className={filter === "daily-top-3" ? "bg-gray-50 font-medium" : ""}>
                Daily Top 3
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("other-tasks")} className={filter === "other-tasks" ? "bg-gray-50 font-medium" : ""}>
                Other tasks
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-8 space-y-10">
        
        {filteredTasks.length === 0 ? (
          /* Inline Empty State */
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-200 rounded-lg bg-gray-50/50 w-full max-w-2xl mx-auto">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No completed tasks</h3>
            <p className="text-xs text-gray-500 mb-6 max-w-xs text-center">
              {searchQuery
                ? "No tasks match your search filters."
                : "Tasks you complete will appear here. Get started by finishing your Top 3!"}
            </p>
            {!searchQuery && (
              <button
                type="button"
                className="inline-flex items-center justify-center h-8 px-4 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm rounded-md transition-all"
                onClick={() => router.push("/dashboard")}
              >
                Go to Today
              </button>
            )}
          </div>
        ) : (
          /* Tasks Mapping By Date Grouping */
          groupedTasks.map((group) => (
            <div key={group.label}>
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 pl-2">
                {group.label}
              </h3>
              <div className="space-y-0.5">
                {group.tasks.map((task) => (
                  <LinearTaskRow
                    key={task.id}
                    task={task}
                    onToggleComplete={toggleComplete}
                    isDailyTop3={task.is_daily_top_3}
                    // Explicitly omitted onDelete, onMoveToToday, onMoveBack per spec config
                  />
                ))}
              </div>
            </div>
          ))
        )}
        
      </div>
    </div>
  );
}
