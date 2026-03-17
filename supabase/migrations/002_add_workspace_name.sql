-- Add workspace_name column to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS workspace_name TEXT;
