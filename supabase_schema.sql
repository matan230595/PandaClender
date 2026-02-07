-- ### PandaClender Supabase Schema ###
-- Run this in your Supabase SQL Editor to set up the database.

-- 1. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NULL,
    priority text NOT NULL,
    due_date timestamp with time zone NOT NULL,
    creation_date timestamp with time zone NOT NULL DEFAULT now(),
    completed boolean NOT NULL DEFAULT false,
    sub_tasks jsonb NULL DEFAULT '[]'::jsonb,
    category text NULL,
    reminders jsonb NULL,
    energy_level text NULL,
    snoozed_until timestamp with time zone NULL,
    CONSTRAINT tasks_pkey PRIMARY KEY (id)
);

-- Enable RLS for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policies for tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
CREATE POLICY "Users can view their own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
CREATE POLICY "Users can insert their own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);


-- 2. HABITS TABLE
CREATE TABLE IF NOT EXISTS public.habits (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    icon text NULL,
    time_of_day text NULL,
    completed_days text[] NULL DEFAULT ARRAY[]::text[],
    CONSTRAINT habits_pkey PRIMARY KEY (id)
);

-- Enable RLS for habits
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- Policies for habits
DROP POLICY IF EXISTS "Users can view their own habits" ON public.habits;
CREATE POLICY "Users can view their own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own habits" ON public.habits;
CREATE POLICY "Users can insert their own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own habits" ON public.habits;
CREATE POLICY "Users can update their own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own habits" ON public.habits;
CREATE POLICY "Users can delete their own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- Indexes for habits
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);


-- 3. USER PROFILE PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.user_profile_progress (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points integer NOT NULL DEFAULT 0,
    level integer NOT NULL DEFAULT 1,
    streak integer NOT NULL DEFAULT 0,
    achievements jsonb NULL DEFAULT '[]'::jsonb,
    purchased_themes text[] NULL DEFAULT ARRAY['default']::text[],
    active_theme text NULL DEFAULT 'default',
    purchased_sound_packs text[] NULL DEFAULT ARRAY['none']::text[],
    purchased_confetti_packs text[] NULL DEFAULT ARRAY[]::text[],
    active_power_up jsonb NULL,
    api_keys text[] NULL DEFAULT ARRAY[]::text[],
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_profile_progress_pkey PRIMARY KEY (user_id)
);

-- Enable RLS for user_profile_progress
ALTER TABLE public.user_profile_progress ENABLE ROW LEVEL SECURITY;

-- Policies for user_profile_progress
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_profile_progress;
CREATE POLICY "Users can view their own progress" ON public.user_profile_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own progress" ON public.user_profile_progress;
CREATE POLICY "Users can insert their own progress" ON public.user_profile_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_profile_progress;
CREATE POLICY "Users can update their own progress" ON public.user_profile_progress FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own progress" ON public.user_profile_progress;
CREATE POLICY "Users can delete their own progress" ON public.user_profile_progress FOR DELETE USING (auth.uid() = user_id);

-- Indexes for user_profile_progress
CREATE INDEX IF NOT EXISTS idx_user_profile_progress_user_id ON public.user_profile_progress(user_id);
