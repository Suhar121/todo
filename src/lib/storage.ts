import { supabase } from './supabase';
import { Task, Project, Note, Habit, AchievementProgress, Subtask } from '../types';

// ============================================
// ID GENERATOR (used for subtasks etc.)
// ============================================
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// ============================================
// TASKS
// ============================================
export async function loadTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error('loadTasks error:', error); return []; }

  return (data || []).map(row => ({
    id: row.id,
    title: row.title,
    description: row.description || '',
    dueDate: row.due_date || undefined,
    reminderTime: row.reminder_time?.substring(0, 5) || undefined, // format as HH:mm
    progress: typeof row.progress === 'number' ? row.progress : 0,
    priority: row.priority || 'medium',
    status: row.status || 'todo',
    projectId: row.project_id || undefined,
    userId: row.user_id,
    tags: row.tags || [],
    subtasks: (row.subtasks || []) as Subtask[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function saveTasks(_tasks: Task[]): Promise<void> {
  // No-op: Individual operations handle persistence now
}

export async function insertTask(task: Task): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: task.title,
      description: task.description || '',
      due_date: task.dueDate || null,
      reminder_time: task.reminderTime || null,
      progress: task.progress,
      priority: task.priority,
      status: task.status,
      project_id: task.projectId || null,
      user_id: task.userId,
      tags: task.tags,
      subtasks: task.subtasks,
    })
    .select()
    .single();

  if (error) { console.error('insertTask error:', error); return null; }

  return {
    id: data.id,
    title: data.title,
    description: data.description || '',
    dueDate: data.due_date || undefined,
    reminderTime: data.reminder_time?.substring(0, 5) || undefined,
    progress: typeof data.progress === 'number' ? data.progress : 0,
    priority: data.priority,
    status: data.status,
    projectId: data.project_id || undefined,
    userId: data.user_id,
    tags: data.tags || [],
    subtasks: (data.subtasks || []) as Subtask[],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateTaskDb(id: string, data: Partial<Task>): Promise<void> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.dueDate !== undefined) updates.due_date = data.dueDate || null;
  if (data.reminderTime !== undefined) updates.reminder_time = data.reminderTime || null;
  if (data.progress !== undefined) updates.progress = data.progress;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.status !== undefined) updates.status = data.status;
  if (data.projectId !== undefined) updates.project_id = data.projectId || null;
  if (data.tags !== undefined) updates.tags = data.tags;
  if (data.subtasks !== undefined) updates.subtasks = data.subtasks;

  const { error } = await supabase.from('tasks').update(updates).eq('id', id);
  if (error) console.error('updateTask error:', error);
}

export async function deleteTaskDb(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) console.error('deleteTask error:', error);
}

// ============================================
// PROJECTS
// ============================================
export async function loadProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) { console.error('loadProjects error:', error); return []; }

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    color: row.color,
    userId: row.user_id,
    createdAt: row.created_at,
  }));
}

export async function saveProjects(_projects: Project[]): Promise<void> {
  // No-op
}

export async function insertProject(project: Project): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: project.name,
      color: project.color,
      user_id: project.userId,
    })
    .select()
    .single();

  if (error) { console.error('insertProject error:', error); return null; }

  return {
    id: data.id,
    name: data.name,
    color: data.color,
    userId: data.user_id,
    createdAt: data.created_at,
  };
}

export async function updateProjectDb(id: string, data: Partial<Project>): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.color !== undefined) updates.color = data.color;

  const { error } = await supabase.from('projects').update(updates).eq('id', id);
  if (error) console.error('updateProject error:', error);
}

export async function deleteProjectDb(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) console.error('deleteProject error:', error);
}

// ============================================
// NOTES
// ============================================
export async function loadNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error('loadNotes error:', error); return []; }

  return (data || []).map(row => ({
    id: row.id,
    content: row.content,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function saveNotes(_notes: Note[]): Promise<void> {
  // No-op
}

export async function insertNote(note: Note): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      content: note.content,
      user_id: note.userId,
    })
    .select()
    .single();

  if (error) { console.error('insertNote error:', error); return null; }

  return {
    id: data.id,
    content: data.content,
    userId: data.user_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateNoteDb(id: string, content: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('updateNote error:', error);
}

export async function deleteNoteDb(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) console.error('deleteNote error:', error);
}

// ============================================
// HABITS
// ============================================
export async function loadHabits(): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error('loadHabits error:', error); return []; }

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    userId: row.user_id,
    completedDates: (row.completed_dates || []) as string[],
    createdAt: row.created_at,
  }));
}

export async function saveHabits(_habits: Habit[]): Promise<void> {
  // No-op
}

export async function insertHabit(habit: Habit): Promise<Habit | null> {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      name: habit.name,
      emoji: habit.emoji,
      color: habit.color,
      user_id: habit.userId,
      completed_dates: habit.completedDates,
    })
    .select()
    .single();

  if (error) { console.error('insertHabit error:', error); return null; }

  return {
    id: data.id,
    name: data.name,
    emoji: data.emoji,
    color: data.color,
    userId: data.user_id,
    completedDates: data.completed_dates || [],
    createdAt: data.created_at,
  };
}

export async function updateHabitDates(id: string, completedDates: string[]): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ completed_dates: completedDates })
    .eq('id', id);
  if (error) console.error('updateHabitDates error:', error);
}

export async function deleteHabitDb(id: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', id);
  if (error) console.error('deleteHabit error:', error);
}

// ============================================
// ACHIEVEMENTS
// ============================================
export async function loadAchievements(): Promise<AchievementProgress[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*');

  if (error) { console.error('loadAchievements error:', error); return []; }

  return (data || []).map(row => ({
    id: row.achievement_id,
    current: row.current_progress || 0,
    unlockedAt: row.unlocked_at || undefined,
  }));
}

export async function saveAchievements(_achievements: AchievementProgress[]): Promise<void> {
  // No-op
}

export async function upsertAchievements(achievements: AchievementProgress[], userId: string): Promise<void> {
  const rows = achievements.map(a => ({
    user_id: userId,
    achievement_id: a.id,
    current_progress: a.current,
    unlocked_at: a.unlockedAt || null,
  }));

  const { error } = await supabase
    .from('achievements')
    .upsert(rows, { onConflict: 'user_id,achievement_id' });

  if (error) console.error('upsertAchievements error:', error);
}

// ============================================
// USER PROFILE (stored in Supabase user metadata)
// ============================================
export async function getUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
