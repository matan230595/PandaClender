-- ### PandaClender Supabase Schema ###
-- To use this file:
-- 1. Go to your Supabase project dashboard.
-- 2. Navigate to the "SQL Editor".
-- 3. Click "New query" and paste the entire content of this file.
-- 4. Click "Run".
-- This script is now idempotent. It will create tables if they don't exist and add missing columns.
-- It is safe to run this multiple times.

-- --- TASKS TABLE ---
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

-- Enable RLS and create policies
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for user's own tasks" ON public.tasks;
CREATE POLICY "Enable read access for user's own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable insert for user's own tasks" ON public.tasks;
CREATE POLICY "Enable insert for user's own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for user's own tasks" ON public.tasks;
CREATE POLICY "Enable update for user's own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for user's own tasks" ON public.tasks;
CREATE POLICY "Enable delete for user's own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);


-- --- HABITS TABLE ---
CREATE TABLE IF NOT EXISTS public.habits (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    icon text NULL,
    time_of_day text NULL,
    completed_days text[] NULL DEFAULT ARRAY[]::text[],
    CONSTRAINT habits_pkey PRIMARY KEY (id)
);

-- Enable RLS and create policies
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for user's own habits" ON public.habits;
CREATE POLICY "Enable read access for user's own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable insert for user's own habits" ON public.habits;
CREATE POLICY "Enable insert for user's own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for user's own habits" ON public.habits;
CREATE POLICY "Enable update for user's own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for user's own habits" ON public.habits;
CREATE POLICY "Enable delete for user's own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);


-- --- USER PROGRESS TABLE ---
CREATE TABLE IF NOT EXISTS public.user_progress (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points integer NOT NULL DEFAULT 0,
    level integer NOT NULL DEFAULT 1,
    streak integer NOT NULL DEFAULT 0,
    achievements jsonb NULL,
    purchased_themes text[] NULL,
    active_theme text NULL,
    purchased_sound_packs text[] NULL,
    purchased_confetti_packs text[] NULL,
    CONSTRAINT user_progress_pkey PRIMARY KEY (user_id)
);

-- Add potentially missing columns to user_progress to fix schema cache issues
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS active_power_up jsonb NULL;
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS api_keys text[] NULL;


-- Enable RLS and create policies
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for user's own progress" ON public.user_progress;
CREATE POLICY "Enable read access for user's own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable insert for user's own progress" ON public.user_progress;
CREATE POLICY "Enable insert for user's own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for user's own progress" ON public.user_progress;
CREATE POLICY "Enable update for user's own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for user's own progress" ON public.user_progress;
CREATE POLICY "Enable delete for user's own progress" ON public.user_progress FOR DELETE USING (auth.uid() = user_id);
