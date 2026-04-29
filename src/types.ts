export type Priority = 'low' | 'medium' | 'high';
export type Status = 'todo' | 'in_progress' | 'completed';
export type Theme = 'light' | 'dark';

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  theme?: Theme;
}

export interface AppUser {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  photoURL?: string;
  workType?: string;
  telegramToken?: string;
  telegramChatId?: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  link?: string;
  status?: 'active' | 'planning' | 'on_hold' | 'completed';
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  reminderTime?: string;
  progress: number; // 0-100
  priority: Priority;
  status: Status;
  projectId?: string;
  userId: string;
  tags: string[];
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIParsedTask {
  title: string;
  dueDate?: string;
  priority?: Priority;
  tags?: string[];
  isTask: boolean;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  userId: string;
  /** ISO date strings of days completed, e.g. ["2026-04-15","2026-04-16"] */
  completedDates: string[];
  createdAt: string;
}

export type AchievementId =
  | 'first_task'
  | 'five_tasks'
  | 'twenty_five_tasks'
  | 'centurion'
  | 'first_habit'
  | 'streak_3'
  | 'streak_7'
  | 'streak_14'
  | 'streak_30'
  | 'five_habits'
  | 'project_starter'
  | 'note_taker'
  | 'completionist';

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
  emoji: string;
  maxProgress: number;
}

export interface AchievementProgress {
  id: AchievementId;
  current: number;
  unlockedAt?: string; // ISO date when unlocked
}
