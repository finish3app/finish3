"use client";

import React, { useState } from "react";
import { useDashboard } from "@/contexts/dashboard-context";
import { LinearTaskRow } from "@/components/linear-ui/linear-task-row";
import { TaskCreationDialog } from "@/components/task-creation-dialog";
import { Plus, CheckCircle2 } from "lucide-react";
import type { CustomSpace } from "@/lib/types";

export default function TodayPage() {
  const { getDailyTop3, tasks, toggleComplete, moveToInbox, moveBack, deleteTask, spaces, taskOrigins } = useDashboard();
  const [dialogOpen, setDialogOpen] = useState(false);

  const dailyTop3 = getDailyTop3();
  const completedToday = tasks.filter(
    (t) => t.is_daily_top_3 && t.is_completed &&
    t.completed_at && new Date(t.completed_at).toDateString() === new Date().toDateString()
  );
  
  const totalDailyTasks = dailyTop3.concat(completedToday);
  const totalTop3Count = totalDailyTasks.length;
  const completedCount = completedToday.length;

  // Render metrics
  const progress = totalTop3Count > 0 ? (completedCount / totalTop3Count) * 100 : 0;
  const allTasksCompleted = totalTop3Count === 3 && completedCount === 3;

  // Dates handling
  const today = new Date();
  const monthStr = today.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const dayStr = today.getDate().toString();
  const dateSubTitle = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const getMoveBackLabel = (task: typeof tasks[0]): string | undefined => {
    if (task.space_id) {
      const space = spaces.find((s: CustomSpace) => s.id === task.space_id);
      return space ? `${space.emoji} ${space.name}` : "Space";
    }
    const origin = taskOrigins[task.id];
    if (origin?.from === "inbox") return "Inbox";
    return undefined;
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 md:py-12 bg-white min-h-screen">
      
      {/* LinearHeader */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex flex-col items-center justify-center shadow-sm">
            <span className="text-[10px] uppercase font-bold text-red-500 leading-none tracking-wider">{monthStr}</span>
            <span className="text-xl font-bold text-gray-900 leading-none mt-0.5">{dayStr}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Today</h1>
            <p className="text-sm text-gray-500 font-medium">{dateSubTitle}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Daily Progress</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">{completedCount}/{totalTop3Count}</span>
            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-violet-600 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {totalTop3Count > 0 ? (
          <>
            {/* List Header */}
            <div className="flex items-center gap-3 text-xs font-medium text-gray-400 uppercase tracking-wider px-3 pb-2 border-b border-gray-100 mb-2">
              <div className="w-5" /> {/* Checkbox spacer */}
              <div className="w-6 text-center">#</div>
              <div className="flex-1">Task</div>
              <div className="w-24 text-right pr-1">Priority</div>
              <div className="w-6" /> {/* Actions spacer */}
            </div>

            {/* Tasks Array mapping */}
            <div className="space-y-0.5">
              {dailyTop3.map((task, i) => (
                <LinearTaskRow
                  key={task.id}
                  task={task}
                  onToggleComplete={toggleComplete}
                  isDailyTop3
                  index={i}
                  onMoveBack={getMoveBackLabel(task) ? moveBack : undefined}
                  moveBackLabel={getMoveBackLabel(task)}
                  onMoveToInbox={moveToInbox}
                  onDelete={deleteTask}
                />
              ))}

              {completedToday.map((task, i) => (
                <LinearTaskRow
                  key={task.id}
                  task={task}
                  onToggleComplete={toggleComplete}
                  isDailyTop3
                  index={dailyTop3.length + i}
                  onDelete={deleteTask}
                />
              ))}
            </div>

            {/* LinearAddTaskButton */}
            {totalTop3Count < 3 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="group flex items-center gap-3 w-full py-2 px-3 rounded-lg border border-dashed border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
                >
                  <div className="w-5 h-5 flex items-center justify-center rounded-[6px] border border-gray-200 group-hover:border-gray-300 bg-white">
                    <Plus className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
                  </div>
                  Add task #{totalTop3Count + 1}
                </button>
              </div>
            )}
            
            {/* LinearCelebration */}
            {allTasksCompleted && (
              <div className="flex items-center gap-4 py-4 px-5 rounded-lg border border-green-200 bg-green-50/50 mt-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-green-900">All tasks completed</h3>
                  <p className="text-xs text-green-700 mt-0.5">Great work! You've finished your Top 3 for today.</p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* LinearEmptyState */
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
            <div className="text-center max-w-sm mx-auto px-4">
              <h3 className="text-sm font-medium text-gray-900 mb-1">No tasks for today</h3>
              <p className="text-xs text-gray-500 mb-6">What are the 3 most important things you need to get done?</p>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 h-8 text-xs font-medium px-4 shadow-sm rounded-md transition-colors"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Create task
              </button>
            </div>
          </div>
        )}
      </div>

      <TaskCreationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isDailyTop3
        maxTasks={3}
        currentTaskCount={totalTop3Count}
      />
    </div>
  );
}
