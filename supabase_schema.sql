-- ### PandaClender Supabase Schema ###
-- To use this file:
-- 1. Go to your Supabase project dashboard.
-- 2. Navigate to the "SQL Editor".
-- 3. Click "New query" and paste the entire content of this file.
-- 4. Click "Run".

-- --- TASKS TABLE ---
-- Stores individual tasks for users.

CREATE TABLE public.tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
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
    CONSTRAINT tasks_pkey PRIMARY KEY (id),
    CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own tasks.
CREATE POLICY "Enable read access for user's own tasks"
ON public.tasks FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own tasks.
CREATE POLICY "Enable insert for user's own tasks"
ON public.tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tasks.
CREATE POLICY "Enable update for user's own tasks"
ON public.tasks FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own tasks.
CREATE POLICY "Enable delete for user's own tasks"
ON public.tasks FOR DELETE
USING (auth.uid() = user_id);


-- --- HABITS TABLE ---
-- Stores recurring habits for users.

CREATE TABLE public.habits (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    icon text NULL,
    time_of_day text NULL,
    completed_days text[] NULL DEFAULT ARRAY[]::text[],
    CONSTRAINT habits_pkey PRIMARY KEY (id),
    CONSTRAINT habits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- Policies for habits table
CREATE POLICY "Enable read access for user's own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for user's own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for user's own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for user's own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);


-- --- USER PROGRESS TABLE ---
-- Stores gamification and customization data for each user.

CREATE TABLE public.user_progress (
    user_id uuid NOT NULL,
    points integer NOT NULL DEFAULT 0,
    level integer NOT NULL DEFAULT 1,
    streak integer NOT NULL DEFAULT 0,
    achievements jsonb NULL,
    purchased_themes text[] NULL,
    active_theme text NULL,
    purchased_sound_packs text[] NULL,
    purchased_confetti_packs text[] NULL,
    active_power_up jsonb NULL,
    api_keys text[] NULL,
    CONSTRAINT user_progress_pkey PRIMARY KEY (user_id),
    CONSTRAINT user_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Policies for user_progress table
CREATE POLICY "Enable read access for user's own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for user's own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for user's own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for user's own progress" ON public.user_progress FOR DELETE USING (auth.uid() = user_id);