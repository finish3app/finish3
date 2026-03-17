"use client";

import React, { useState, useMemo } from "react";
import { useDashboard } from "@/contexts/dashboard-context";
import { LinearTaskRow } from "@/components/linear-ui/linear-task-row";
import { TaskCreationDialog } from "@/components/task-creation-dialog";
import { Inbox, Plus, Search } from "lucide-react";

export default function InboxPage() {
  const { getInboxTasks, toggleComplete, moveToToday, moveBack, deleteTask, spaces, taskOrigins } = useDashboard();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const inboxTasks = getInboxTasks();

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return inboxTasks;
    const q = searchQuery.toLowerCase();
    return inboxTasks.filter(
      (t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
    );
  }, [inboxTasks, searchQuery]);

  const getMoveBackLabel = (task: typeof inboxTasks[0]): string | undefined => {
    const origin = taskOrigins[task.id];
    if (origin?.from === "space" && origin.spaceId) {
      const space = spaces.find((s) => s.id === origin.spaceId);
      return space ? `${space.emoji} ${space.name}` : "Space";
    }
    return undefined;
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 md:py-12 bg-white min-h-screen">
      
      {/* Header Row */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-8">
        
        {/* Left Side: Icon, Title, Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Inbox className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Inbox</h1>
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gray-100 text-[11px] font-semibold text-gray-500">
              {inboxTasks.length}
            </span>
          </div>
        </div>

        {/* Right Side: Search & Add Button */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search inbox..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-sm bg-gray-50 border border-transparent hover:bg-gray-100 focus:bg-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-md outline-none transition-all placeholder:text-gray-400 text-gray-900"
            />
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="group flex items-center gap-2 h-9 px-3.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 opacity-80" />
            Add task
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-6">
        {filtered.length > 0 ? (
          <div>
            <div className="flex items-center gap-3 text-xs font-medium text-gray-400 uppercase tracking-wider px-3 pb-2 border-b border-gray-100 mb-2">
              <div className="w-5" /> {/* Checkbox spacer */}
              <div className="flex-1">Task</div>
              <div className="w-24 text-right pr-1">Priority</div>
              <div className="w-6" /> {/* Actions spacer */}
            </div>

            <div className="space-y-0.5">
              {filtered.map((task) => (
                <LinearTaskRow
                  key={task.id}
                  task={task}
                  onToggleComplete={toggleComplete}
                  onMoveToToday={moveToToday}
                  onMoveBack={getMoveBackLabel(task) ? moveBack : undefined}
                  moveBackLabel={getMoveBackLabel(task)}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-200 rounded-xl bg-white mt-12 w-full max-w-2xl mx-auto">
            <div className="text-center px-4 flex flex-col items-center">
              
              <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-6">
                <Inbox className="h-5 w-5 text-gray-400" strokeWidth={2} />
              </div>
              
              <h3 className="text-[15px] font-semibold text-gray-900 mb-1.5">Inbox is empty</h3>
              <div className="text-[13px] text-gray-500 flex flex-col items-center mb-6 leading-relaxed">
                <p>Tasks that don't belong to "Today" will appear here.</p>
                <p>Capture everything on your mind.</p>
              </div>
              
              <button
                type="button"
                className="inline-flex items-center justify-center h-8 px-4 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 shadow-sm rounded-md transition-all"
                onClick={() => setDialogOpen(true)}
              >
                Create task
              </button>
            </div>
          </div>
        )}
      </div>

      <TaskCreationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
