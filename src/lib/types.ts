export type SubscriptionStatus = "free" | "pro" | "cancelled";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  timezone: string;
  workspace_name: string | null;
  onboarding_completed: boolean;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  space_id: string | null;
  block_id: string | null;
  title: string;
  description: string | null;
  priority: 1 | 2 | 3;
  status: "pending" | "in_progress" | "completed";
  is_daily_top_3: boolean;
  is_completed: boolean;
  estimated_duration: number | null;
  actual_duration: number | null;
  due_date: string | null;
  reminder_time: string | null;
  label_ids: string[];
  completed_at: string | null;
  origin_space_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomSpace {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  description: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpaceBlock {
  id: string;
  space_id: string;
  user_id: string;
  type: "text" | "heading" | "task_list" | "task_item" | "divider";
  content: Record<string, unknown>;
  parent_id: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Label {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_focus_duration: number;
  preferred_break_duration: number;
  sound_enabled: boolean;
  success_sound_volume: number;
  theme_preferences: { theme: string };
  notification_settings: { push: boolean; email: boolean };
  updated_at: string;
}

export interface DailyStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  updated_at: string;
}
