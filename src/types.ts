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

export interface Project {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
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
