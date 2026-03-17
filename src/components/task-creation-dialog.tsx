"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDashboard } from "@/contexts/dashboard-context";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Signal, SignalHigh, SignalMedium, SignalLow,
  Tag, X, ChevronRight, Plus, Check, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";

interface TaskCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: (task: Task) => void;
  isDailyTop3?: boolean;
  maxTasks?: number;
  currentTaskCount?: number;
  spaceId?: string;
  spaceName?: string;
  spaceEmoji?: string;
  blockId?: string;
  onCreated?: () => void;
}

const PRIORITY_OPTIONS = [
  { value: "none", label: "No priority", icon: Signal, colorClass: "text-gray-400", dbValue: 3 },
  { value: "urgent", label: "Urgent", icon: SignalHigh, colorClass: "text-red-500", dbValue: 1 },
  { value: "high", label: "High", icon: SignalHigh, colorClass: "text-orange-500", dbValue: 1 },
  { value: "medium", label: "Medium", icon: SignalMedium, colorClass: "text-amber-500", dbValue: 2 },
  { value: "low", label: "Low", icon: SignalLow, colorClass: "text-blue-500", dbValue: 3 },
] as const;

const LABEL_COLORS = ["#EF4444", "#F97316", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280"];

export function TaskCreationDialog({
  open,
  onOpenChange,
  onTaskCreated,
  isDailyTop3,
  maxTasks = 3,
  currentTaskCount,
  spaceId,
  spaceName,
  spaceEmoji,
  blockId,
  onCreated,
}: TaskCreationDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priorityObj, setPriorityObj] = useState<typeof PRIORITY_OPTIONS[number]>(PRIORITY_OPTIONS[0]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addTask, labels, addLabel, getDailyTop3 } = useDashboard();

  // If currentTaskCount is passed, use it, else compute for Today
  const actualTaskCount = currentTaskCount ?? (isDailyTop3 ? getDailyTop3().length : 0);
  const isAtLimit = isDailyTop3 && actualTaskCount >= maxTasks;

  const titleInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dropdown states
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);

  // Custom label states
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);

  const priorityRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      if (isAtLimit) {
        // use a timeout to bypass the set-state-in-effect warning safely on open
        setTimeout(() => setError(`You can only have ${maxTasks} Daily Top 3 tasks.`), 0);
      } else {
        setTimeout(() => titleInputRef.current?.focus(), 80);
      }
    } else {
      // Reset on close
      setTitle("");
      setDescription("");
      setPriorityObj(PRIORITY_OPTIONS[0]);
      setSelectedLabelIds([]);
      setError(null);
      setPriorityOpen(false);
      setLabelsOpen(false);
      setIsCreatingLabel(false);
      setNewLabelName("");
    }
  }, [open, isAtLimit, maxTasks]);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (priorityOpen && priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
        setPriorityOpen(false);
      }
      if (labelsOpen && labelsRef.current && !labelsRef.current.contains(e.target as Node)) {
        setLabelsOpen(false);
        setIsCreatingLabel(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [priorityOpen, labelsOpen]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [description]);

  const handleSubmit = async () => {
    if (isAtLimit) {
      setError(`You can only have ${maxTasks} Daily Top 3 tasks.`);
      return;
    }
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const taskData = {
      title: title.trim(),
      description: description.trim() || null,
      priority: priorityObj.dbValue as 1 | 2 | 3,
      is_daily_top_3: isDailyTop3 || false,
      space_id: spaceId || null,
      block_id: blockId || null,
      label_ids: selectedLabelIds,
    };

    const task = await addTask(taskData);
    setIsSubmitting(false);

    if (task) {
      onTaskCreated?.(task);
      onCreated?.();
      if (isDailyTop3 && actualTaskCount + 1 < maxTasks) {
        // Multi-create pattern: reset form, keep open, focus title
        setTitle("");
        setDescription("");
        setPriorityObj(PRIORITY_OPTIONS[0]);
        setSelectedLabelIds([]);
        setTimeout(() => titleInputRef.current?.focus(), 80);
      } else {
        onOpenChange(false);
      }
    } else {
      setError("Failed to create task");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      if (priorityOpen) {
        setPriorityOpen(false);
        e.stopPropagation();
      } else if (labelsOpen) {
        setLabelsOpen(false);
        e.stopPropagation();
      }
    }
  };

  const handleCreateLabel = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newLabelName.trim()) return;

    const label = await addLabel(newLabelName.trim(), newLabelColor);
    if (label) {
      setSelectedLabelIds((prev) => [...prev, label.id]);
      setIsCreatingLabel(false);
      setNewLabelName("");
    }
  };

  const CurrentPriorityIcon = priorityObj.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[640px] p-0 gap-0 border border-gray-200 shadow-2xl rounded-xl"
        onInteractOutside={(e) => e.preventDefault()}
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">Create New Task</DialogTitle>

        {/* 1. Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center">
            {isDailyTop3 ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-medium text-xs bg-amber-50 border border-amber-200 text-amber-700">
                Today
              </span>
            ) : spaceId ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-medium text-xs bg-purple-50 border border-purple-200 text-purple-700">
                {spaceEmoji || "📝"} {spaceName || "Space"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-medium text-xs bg-gray-100 border border-gray-200 text-gray-600">
                Inbox
              </span>
            )}

            <ChevronRight className="w-3 h-3 text-gray-400 mx-2" />
            <span className="text-gray-700 font-medium text-xs">
              {isDailyTop3 ? `Task #${actualTaskCount + 1}` : "New task"}
            </span>

            {isDailyTop3 && (
              <div className="flex items-center gap-1 ml-2">
                {Array.from({ length: maxTasks }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      i < actualTaskCount
                        ? "bg-amber-500"
                        : i === actualTaskCount
                        ? "bg-amber-300 animate-pulse"
                        : "bg-gray-200"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. Inputs */}
        <div className="px-5 pt-4 pb-1">
          <input
            ref={titleInputRef}
            type="text"
            className="w-full text-lg font-semibold text-gray-900 placeholder:text-gray-400 border-0 outline-none bg-transparent p-0 focus:ring-0"
            placeholder={isDailyTop3 ? `What's task #${actualTaskCount + 1} for today?` : "Task title"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isAtLimit || isSubmitting}
          />
          <textarea
            ref={textareaRef}
            className="w-full mt-2 text-sm text-gray-600 placeholder:text-gray-400 border-0 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 bg-transparent p-0 resize-none focus:ring-0 min-h-[60px]"
            placeholder="Add description..."
            rows={1}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isAtLimit || isSubmitting}
          />
        </div>

        {/* 3. Expected Error Message */}
        {error && (
          <div className="mx-5 mb-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* 4. Metadata Chips Bar */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-100 flex-wrap relative">
          
          {/* Priority Trigger & Dropdown */}
          <div className="relative" ref={priorityRef}>
            <button
              disabled={isAtLimit || isSubmitting}
              type="button"
              onClick={() => {
                setPriorityOpen(!priorityOpen);
                setLabelsOpen(false);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white",
                priorityObj.value !== "none" ? priorityObj.colorClass : "text-gray-600"
              )}
            >
              <CurrentPriorityIcon className="w-3.5 h-3.5" />
              {priorityObj.value === "none" ? "Priority" : priorityObj.label}
            </button>
            {priorityOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-1 animate-in fade-in slide-in-from-top-1 duration-100">
                <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider px-2 py-1.5">
                  Priority
                </div>
                {PRIORITY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setPriorityObj(opt);
                        setPriorityOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-gray-50",
                        priorityObj.value === opt.value ? "bg-gray-100 font-medium" : ""
                      )}
                    >
                      <Icon className={cn("w-4 h-4", opt.colorClass)} />
                      <span className="text-gray-700">{opt.label}</span>
                      {priorityObj.value === opt.value && (
                        <Check className="w-3.5 h-3.5 text-violet-500 ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Labels Trigger & Dropdown */}
          <div className="relative" ref={labelsRef}>
            <button
              disabled={isAtLimit || isSubmitting}
              type="button"
              onClick={() => {
                setLabelsOpen(!labelsOpen);
                setPriorityOpen(false);
                setIsCreatingLabel(false);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white",
                selectedLabelIds.length > 0 ? "text-violet-600" : "text-gray-600"
              )}
            >
              <Tag className="w-3.5 h-3.5" />
              {selectedLabelIds.length === 0 ? "Labels" : `${selectedLabelIds.length} label(s)`}
            </button>
            
            {labelsOpen && (
              <div className="absolute top-full left-0 mt-1 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-2 animate-in fade-in slide-in-from-top-1 duration-100">
                <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider px-1 py-1">
                  Your Labels
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-0.5 mt-1">
                  {labels.length === 0 && !isCreatingLabel ? (
                    <div className="text-xs text-gray-400 text-center py-2">No labels yet</div>
                  ) : (
                    labels.map((lbl) => {
                      const isSelected = selectedLabelIds.includes(lbl.id);
                      return (
                        <button
                          key={lbl.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedLabelIds(selectedLabelIds.filter((id) => id !== lbl.id));
                            } else {
                              setSelectedLabelIds([...selectedLabelIds, lbl.id]);
                            }
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm",
                            isSelected ? "bg-violet-50 font-medium text-violet-700" : "text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: lbl.color }}
                          />
                          <span className="truncate">{lbl.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Create Label Section */}
                <div className="border-t border-gray-100 pt-2 mt-2">
                  {!isCreatingLabel ? (
                    <button
                      type="button"
                      onClick={() => setIsCreatingLabel(true)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create new label
                    </button>
                  ) : (
                    <div className="space-y-2 px-1">
                      <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                        New label
                      </div>
                      <input
                        autoFocus
                        type="text"
                        placeholder="Label name..."
                        className="w-full h-8 px-2 text-sm border border-gray-200 rounded-md outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateLabel(e)}
                      />
                      <div className="flex gap-1.5 justify-between py-1">
                        {LABEL_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center transition-transform",
                              newLabelColor === color ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : ""
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewLabelColor(color)}
                          >
                            {newLabelColor === color && (
                              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingLabel(false);
                            setNewLabelName("");
                          }}
                          className="flex-1 h-7 text-xs border border-gray-200 rounded hover:bg-gray-50 font-medium text-gray-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateLabel}
                          disabled={!newLabelName.trim()}
                          className="flex-1 h-7 text-xs bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50 font-medium"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selected Label Badges */}
          {selectedLabelIds.map((id) => {
            const label = labels.find((l) => l.id === id);
            if (!label) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedLabelIds(selectedLabelIds.filter((lid) => lid !== id))}
                className="flex items-center gap-1 h-5 px-1.5 rounded-r bg-gray-100 hover:bg-gray-200 text-[10px] font-medium text-gray-700"
                style={{ borderLeft: `3px solid ${label.color}` }}
              >
                {label.name}
                <X className="w-2.5 h-2.5 text-gray-500 hover:text-gray-700" />
              </button>
            );
          })}
        </div>

        {/* 5. Footer Action Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50/30 rounded-b-xl">
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <span className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono text-gray-500">
              ⌘
            </span>{" "}
            +{" "}
            <span className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono text-gray-500">
              ↵
            </span>{" "}
            to create
          </div>

          {isDailyTop3 && (
            <div className="text-xs text-gray-400 font-medium ml-auto mr-4">
              {actualTaskCount >= maxTasks ? "All 3 set!" : `${actualTaskCount} of ${maxTasks}`}
            </div>
          )}

          <button
            type="button"
            disabled={!title.trim() || isSubmitting || isAtLimit}
            onClick={handleSubmit}
            className={cn(
              "flex items-center justify-center gap-2 h-8 px-4 text-sm font-semibold rounded-lg text-white transition-colors",
              !title.trim() || isSubmitting || isAtLimit
                ? "bg-violet-400 opacity-50 cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-700"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isDailyTop3 && actualTaskCount < maxTasks ? (
              actualTaskCount + 1 < maxTasks ? `Create · Next #${actualTaskCount + 2}` : "Create task"
            ) : (
              "Create task"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
