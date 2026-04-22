-- ============================================
-- FocusFlow Database Schema
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard → Your Project → SQL Editor → New Query
-- ============================================

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date DATE,
  reminder_time TIME,
  progress INT DEFAULT 0,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'todo',
  project_id UUID,
  tags TEXT[] DEFAULT '{}',
  subtasks JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL,
  completed_dates DATE[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,
  current_progress INT DEFAULT 0,
  unlocked_at TIMESTAMPTZ,
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- Row Level Security — each user only sees their own data
-- ============================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_time TIME;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tasks" ON tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own projects" ON projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own notes" ON notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own habits" ON habits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own achievements" ON achievements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
