import { Task, Project, Note, Habit, AchievementProgress } from '../types';

const KEYS = {
  TASKS: 'focusflow-tasks',
  PROJECTS: 'focusflow-projects',
  NOTES: 'focusflow-notes',
  HABITS: 'focusflow-habits',
  ACHIEVEMENTS: 'focusflow-achievements',
};

function load<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

export const loadTasks = (): Task[] => load<Task>(KEYS.TASKS);
export const saveTasks = (tasks: Task[]): void => save(KEYS.TASKS, tasks);

export const loadProjects = (): Project[] => load<Project>(KEYS.PROJECTS);
export const saveProjects = (projects: Project[]): void => save(KEYS.PROJECTS, projects);

export const loadNotes = (): Note[] => load<Note>(KEYS.NOTES);
export const saveNotes = (notes: Note[]): void => save(KEYS.NOTES, notes);

export const loadHabits = (): Habit[] => load<Habit>(KEYS.HABITS);
export const saveHabits = (habits: Habit[]): void => save(KEYS.HABITS, habits);

export const loadAchievements = (): AchievementProgress[] => load<AchievementProgress>(KEYS.ACHIEVEMENTS);
export const saveAchievements = (achievements: AchievementProgress[]): void => save(KEYS.ACHIEVEMENTS, achievements);

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
