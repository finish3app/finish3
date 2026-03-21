"use client";

import React, { useState } from "react";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/dashboard-context";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Check, Undo2, Sun, Inbox, SignalHigh, SignalMedium, SignalLow, Signal } from "lucide-react";

interface LinearTaskRowProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  isDailyTop3?: boolean;
  index?: number;
  onDelete?: (id: string) => void;
  onMoveToToday?: (task: Task) => void;
  onMoveToInbox?: (task: Task) => void;
  onMoveBack?: (task: Task) => void;
  moveBackLabel?: string;
}

const getPriorityDisplay = (priorityLevel: number | undefined) => {
  switch (priorityLevel) {
    case 1:
      return { label: "High", icon: SignalHigh, colorClass: "text-orange-600", bgClass: "bg-orange-50", borderClass: "border-orange-200" };
    case 2:
      return { label: "Medium", icon: SignalMedium, colorClass: "text-amber-600", bgClass: "bg-amber-50", borderClass: "border-amber-200" };
    case 3:
      return { label: "Normal", icon: SignalLow, colorClass: "text-slate-500", bgClass: "bg-slate-50", borderClass: "border-slate-200" };
    default:
      return { label: "None", icon: Signal, colorClass: "text-gray-400", bgClass: "bg-gray-50", borderClass: "border-gray-100" };
  }
};

export function LinearTaskRow({
  task, onToggleComplete, isDailyTop3, index,
  onDelete, onMoveToToday, onMoveToInbox, onMoveBack, moveBackLabel,
}: LinearTaskRowProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const { labels } = useDashboard();
  
  const priority = getPriorityDisplay(task.priority);
  const PriorityIcon = priority.icon;

  const handleToggle = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onToggleComplete(task);
      setIsAnimating(false);
    }, 300);
  };

  // Map task label IDs to actual label objects from context
  const taskLabels = (task.label_ids || [])
    .map(id => labels.find(l => l.id === id))
    .filter((l): l is NonNullable<typeof l> => l !== undefined);

  const hasAnyAction = (!task.is_completed && (!!onMoveBack || !!onMoveToToday || !!onMoveToInbox)) || !!onDelete;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 py-3 px-3 rounded-lg transition-colors border border-transparent",
        "hover:bg-gray-50 hover:border-gray-100",
        task.is_completed && "opacity-60 bg-gray-50/50",
        isAnimating && "scale-[0.99] opacity-50"
      )}
    >
      {/* Checkbox (w-5) */}
      <button
        onClick={handleToggle}
        className={cn(
          "flex-shrink-0 w-5 h-5 rounded-[6px] border flex items-center justify-center transition-all duration-200",
          task.is_completed
            ? "bg-violet-600 border-violet-600 text-white"
            : "border-gray-300 hover:border-gray-400 bg-white shadow-sm"
        )}
      >
        {task.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      </button>

      {/* Index (w-6) */}
      {isDailyTop3 && typeof index === "number" && (
        <div className="hidden sm:block w-6 flex-shrink-0 text-center text-xs font-mono text-gray-400 opacity-50">
          #{index + 1}
        </div>
      )}

      {/* Task Content (flex-1) */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-sm font-medium truncate",
              task.is_completed ? "line-through text-gray-500" : "text-gray-900"
            )}
          >
            {task.title}
          </span>
          
          {/* Labels */}
          {taskLabels.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {taskLabels.map(label => (
                <span
                  key={label.id}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium border"
                  style={{
                    backgroundColor: `${label.color}15`,
                    color: label.color,
                    borderColor: `${label.color}30`
                  }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {task.description && (
          <p className={cn(
            "text-xs truncate mt-0.5",
            task.is_completed ? "text-gray-400" : "text-gray-500"
          )}>
            {task.description}
          </p>
        )}
      </div>

      {/* Priority Badge */}
      <div className="w-16 sm:w-24 flex justify-end flex-shrink-0">
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-medium",
          priority.bgClass, priority.borderClass, priority.colorClass,
          task.is_completed && "opacity-50 grayscale"
        )}>
          <PriorityIcon className="w-3 h-3" />
          <span className="hidden sm:inline">{priority.label}</span>
        </div>
      </div>

      {/* Actions (w-6) */}
      <div className="w-6 flex justify-end flex-shrink-0">
        {hasAnyAction && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {!task.is_completed && onMoveBack && moveBackLabel && (
                <DropdownMenuItem onClick={() => onMoveBack(task)}>
                  <Undo2 className="mr-2 h-4 w-4 text-violet-500" />
                  Move back to {moveBackLabel}
                </DropdownMenuItem>
              )}
              
              {!task.is_completed && onMoveToToday && (
                <DropdownMenuItem onClick={() => onMoveToToday(task)}>
                  <Sun className="mr-2 h-4 w-4 text-amber-500" />
                  Move to Today
                </DropdownMenuItem>
              )}
              
              {!task.is_completed && onMoveToInbox && (
                <DropdownMenuItem onClick={() => onMoveToInbox(task)}>
                  <Inbox className="mr-2 h-4 w-4 text-blue-500" />
                  Move to Inbox
                </DropdownMenuItem>
              )}

              {onDelete && (!task.is_completed && (!!onMoveBack || !!onMoveToToday || !!onMoveToInbox)) && (
                <DropdownMenuSeparator />
              )}

              {onDelete && (
                <DropdownMenuItem
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this task?")) {
                      onDelete(task.id);
                    }
                  }}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
