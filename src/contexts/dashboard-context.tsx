"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import type { Task, CustomSpace, Label, DailyStreak } from "@/lib/types";
import { toast } from "sonner";
import { TaskOrigin, getTaskOrigins, setTaskOrigin, removeTaskOrigin } from "@/lib/task-origins";
import { getMissedWeekdays } from "@/lib/streak";
import { prefetchAllSpaceBlocks } from "@/hooks/use-space-blocks";

interface DashboardContextType {
  // Data
  tasks: Task[];
  spaces: CustomSpace[];
  labels: Label[];
  streak: DailyStreak | null;
  taskOrigins: Record<string, TaskOrigin>;
  loading: boolean;

  // Task actions
  addTask: (task: Partial<Task>) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (task: Task) => Promise<void>;
  moveToToday: (task: Task) => Promise<boolean>;
  moveToInbox: (task: Task) => Promise<boolean>;
  moveBack: (task: Task) => Promise<boolean>;
  getDailyTop3: () => Task[];
  getInboxTasks: () => Task[];
  getCompletedTasks: () => Task[];

  // Space actions
  addSpace: (name: string, emoji: string) => Promise<CustomSpace | null>;
  updateSpace: (id: string, updates: Partial<CustomSpace>) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;

  // Label actions
  addLabel: (name: string, color: string) => Promise<Label | null>;

  // Refresh
  refresh: () => Promise<void>;

  // Dialog states
  taskDialogOpen: boolean;
  setTaskDialogOpen: (open: boolean) => void;
  taskDialogProps: Record<string, unknown>;
  setTaskDialogProps: (props: Record<string, unknown>) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [spaces, setSpaces] = useState<CustomSpace[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [streak, setStreak] = useState<DailyStreak | null>(null);
  const [taskOrigins, setTaskOriginsState] = useState<Record<string, TaskOrigin>>({});
  const [loading, setLoading] = useState(true);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDialogProps, setTaskDialogProps] = useState<Record<string, unknown>>({});
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [tasksRes, spacesRes, labelsRes, streakRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("custom_spaces").select("*").eq("user_id", user.id).eq("is_archived", false).order("created_at"),
        supabase.from("labels").select("*").eq("user_id", user.id).order("name"),
        supabase.from("daily_streaks").select("*").eq("user_id", user.id).single(),
      ]);

      if (tasksRes.data) setTasks(tasksRes.data as Task[]);
      if (spacesRes.data) {
        setSpaces(spacesRes.data as CustomSpace[]);
        // Pre-fetch blocks for ALL spaces into the global cache
        const spaceIds = (spacesRes.data as CustomSpace[]).map(s => s.id);
        prefetchAllSpaceBlocks(spaceIds);
      }
      if (labelsRes.data) setLabels(labelsRes.data as Label[]);
      if (streakRes.data) setStreak(streakRes.data as DailyStreak);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    fetchData();
    setTaskOriginsState(getTaskOrigins());
  }, [fetchData]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // --- Task Actions ---

  const addTask = async (taskData: Partial<Task>): Promise<Task | null> => {
    if (!user) return null;
    let { data, error } = await supabase
      .from("tasks")
      .insert({ ...taskData, user_id: user.id })
      .select()
      .single();

    // Fallback: if block_id FK constraint fails, retry without block_id
    if (error && error.message?.includes("block_id")) {
      const { block_id: _, ...taskDataWithoutBlock } = taskData as any;
      const result = await supabase
        .from("tasks")
        .insert({ ...taskDataWithoutBlock, user_id: user.id })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("addTask error:", error.message, error.details, error.hint, error.code);
      toast.error("Failed to create task");
      return null;
    }

    const newTask = data as Task;
    setTasks((prev) => [newTask, ...prev]);
    toast.success("Task created!");
    return newTask;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));

    const { error } = await supabase.from("tasks").update(updates).eq("id", id);
    if (error) {
      toast.error("Failed to update task");
      await fetchData(); // Revert
    }
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    
    // Clean up origin tracking
    removeTaskOrigin(id);
    setTaskOriginsState(getTaskOrigins());

    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete task");
      await fetchData();
    } else {
      toast.success("Task deleted");
    }
  };

  const playSuccessSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext })?.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch {
      // Sound not available
    }
  }, []);

  const toggleComplete = async (task: Task) => {
    const isCompleting = !task.is_completed;
    const updates: Partial<Task> = {
      is_completed: isCompleting,
      status: isCompleting ? "completed" : "pending",
      completed_at: isCompleting ? new Date().toISOString() : null,
    };

    // Optimistic
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...updates } : t)));

    if (isCompleting) {
      playSuccessSound();
      toast.success("Task completed! 🎉");
    }

    const { error } = await supabase.from("tasks").update(updates).eq("id", task.id);
    if (error) {
      toast.error("Failed to update task");
      await fetchData();
    }

    // Update streak if completing a daily top 3
    if (isCompleting && task.is_daily_top_3) {
      await updateStreak();
    }
  };

  const updateStreak = async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];

    if (streak) {
      if (streak.last_completed_date === today) {
        // Already updated today
        return;
      }

      const missed = streak.last_completed_date 
        ? getMissedWeekdays(streak.last_completed_date, today) 
        : 0;

      let newStreak = streak.current_streak;
      if (missed === 0 || missed === 1) {
        newStreak += 1;
      } else {
        newStreak = 1; // Grace period expired, reset streak
      }

      const longestStreak = Math.max(newStreak, streak.longest_streak);
      await supabase
        .from("daily_streaks")
        .update({ current_streak: newStreak, longest_streak: longestStreak, last_completed_date: today })
        .eq("user_id", user.id);

      setStreak({ ...streak, current_streak: newStreak, longest_streak: longestStreak, last_completed_date: today });
    } else {
      const { data } = await supabase
        .from("daily_streaks")
        .insert({ user_id: user.id, current_streak: 1, longest_streak: 1, last_completed_date: today })
        .select()
        .single();
      if (data) setStreak(data as DailyStreak);
    }
  };

  const moveToToday = async (task: Task): Promise<boolean> => {
    const dailyCount = getDailyTop3().length;
    if (dailyCount >= 3) {
      toast.error("You already have 3 tasks in Today's list. Complete or remove one first.");
      return false;
    }

    // Origin tracking: If from Inbox, mark origin. If from Space, keep space_id so no origin needed.
    if (!task.space_id) {
      setTaskOrigin(task.id, { from: "inbox" });
      setTaskOriginsState(getTaskOrigins());
    }

    const updates: Partial<Task> = {
      is_daily_top_3: true,
      is_completed: false,
      completed_at: null,
      created_at: new Date().toISOString(), // Move to today's list
    };

    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...updates } : t)));

    const { error } = await supabase.from("tasks").update(updates).eq("id", task.id);
    if (error) {
      toast.error("Failed to move to Today");
      await fetchData();
      return false;
    }
    
    toast.success("Moved to Today");
    return true;
  };

  const moveToInbox = async (task: Task): Promise<boolean> => {
    // Keep origin tracking of Space
    if (task.space_id) {
      setTaskOrigin(task.id, { 
        from: "space", 
        spaceId: task.space_id, 
        blockId: task.block_id || null 
      });
      setTaskOriginsState(getTaskOrigins());
    }

    const updates: Partial<Task> = {
      is_daily_top_3: false,
      space_id: null,
      block_id: null,
    };

    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...updates } : t)));

    // Attempt to update
    let { error } = await supabase.from("tasks").update(updates).eq("id", task.id);
    
    // Fallback if block_id doesn't exist in schema
    if (error && error.message.includes("block_id")) {
      const { block_id: _, ...updatesWithoutBlock } = updates as any;
      const result = await supabase.from("tasks").update(updatesWithoutBlock).eq("id", task.id);
      error = result.error;
    }

    if (error) {
      toast.error("Failed to move to Inbox");
      await fetchData();
      return false;
    }

    toast.success("Moved to Inbox");
    return true;
  };

  const moveBack = async (task: Task): Promise<boolean> => {
    let updates: Partial<Task> = { is_daily_top_3: false };
    
    // Check local storage for origin
    const origin = taskOrigins[task.id];

    if (task.space_id) {
      // Scenario A: Today task that came from a Space. It still has space_id on the task.
      // Database update only needs is_daily_top_3 = false. It will return to the Space query.
    } else if (origin?.from === "space") {
      // Scenario B: Inbox task that came from a Space.
      updates = {
        is_daily_top_3: false,
        space_id: origin.spaceId,
        block_id: origin.blockId,
      };
    } else if (origin?.from === "inbox") {
      // Scenario C: Today task that came from Inbox.
      // Updates just needs is_daily_top_3 = false. It will return to Inbox query.
    } else {
      // No origin known, can't move back effectively.
      toast.error("No original location found.");
      return false;
    }

    // Prepare optimistic update
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...updates } : t)));

    let { error } = await supabase.from("tasks").update(updates).eq("id", task.id);
    
    if (error && error.message.includes("block_id")) {
      const { block_id: _, ...updatesWithoutBlock } = updates as any;
      const result = await supabase.from("tasks").update(updatesWithoutBlock).eq("id", task.id);
      error = result.error;
    }

    if (error) {
      toast.error("Failed to move task back");
      await fetchData();
      return false;
    }

    // Success, remove origin tracking
    removeTaskOrigin(task.id);
    setTaskOriginsState(getTaskOrigins());
    
    toast.success("Task moved back");
    return true;
  };

  const getDailyTop3 = useCallback(() => {
    return tasks.filter((t) => t.is_daily_top_3 && !t.is_completed);
  }, [tasks]);

  const getInboxTasks = useCallback(() => {
    return tasks.filter((t) => !t.is_daily_top_3 && !t.is_completed && !t.space_id);
  }, [tasks]);

  const getCompletedTasks = useCallback(() => {
    return tasks.filter((t) => t.is_completed).sort((a, b) =>
      new Date(b.completed_at || b.updated_at).getTime() - new Date(a.completed_at || a.updated_at).getTime()
    );
  }, [tasks]);

  // --- Space Actions ---

  const addSpace = async (name: string, emoji: string): Promise<CustomSpace | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("custom_spaces")
      .insert({ user_id: user.id, name, emoji })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create space");
      return null;
    }

    const newSpace = data as CustomSpace;
    setSpaces((prev) => [...prev, newSpace]);
    toast.success("Space created!");
    return newSpace;
  };

  const updateSpace = async (id: string, updates: Partial<CustomSpace>) => {
    setSpaces((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    const { error } = await supabase.from("custom_spaces").update(updates).eq("id", id);
    if (error) {
      toast.error("Failed to update space");
      await fetchData();
    }
  };

  const deleteSpace = async (id: string) => {
    setSpaces((prev) => prev.filter((s) => s.id !== id));
    const { error } = await supabase.from("custom_spaces").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete space");
      await fetchData();
    } else {
      toast.success("Space deleted");
    }
  };

  // --- Label Actions ---

  const addLabel = async (name: string, color: string): Promise<Label | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("labels")
      .insert({ user_id: user.id, name, color })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create label");
      return null;
    }

    const newLabel = data as Label;
    setLabels((prev) => [...prev, newLabel]);
    return newLabel;
  };

  return (
    <DashboardContext.Provider
      value={{
        tasks, spaces, labels, streak, loading, taskOrigins,
        addTask, updateTask, deleteTask, toggleComplete,
        moveToToday, moveToInbox, moveBack,
        getDailyTop3, getInboxTasks, getCompletedTasks,
        addSpace, updateSpace, deleteSpace,
        addLabel,
        refresh,
        taskDialogOpen, setTaskDialogOpen,
        taskDialogProps, setTaskDialogProps,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
