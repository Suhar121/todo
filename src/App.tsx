/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Task, Project, Note, Priority, AppUser, Habit, AchievementProgress } from './types';
import {
  loadTasks, saveTasks,
  loadProjects, saveProjects,
  loadNotes, saveNotes,
  loadHabits, saveHabits,
  loadAchievements, saveAchievements,
  generateId,
} from './lib/storage';
import { ACHIEVEMENTS } from './lib/achievements';
import { Sidebar } from './components/Sidebar';
import { TaskBoard } from './components/TaskBoard';
import { HabitTracker } from './components/HabitTracker';
import { UniversalInput } from './components/UniversalInput';
import { ToastContainer, ToastItem, ToastType } from './components/Toast';
import { motion } from 'motion/react';
import { LogIn, User as UserIcon, Sun, Moon, Menu, Layout } from 'lucide-react';
import { getGreeting } from './lib/utils';

const SIMPLE_LOGIN_USERNAME = 'suhar';
const SIMPLE_LOGIN_PASSWORD = 'suharshr@9906';
const SIMPLE_LOGIN_STORAGE_KEY = 'focusflow-local-user';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);

  // UI state
  const [activeView, setActiveView] = useState('inbox');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // ===========================
  // TOAST SYSTEM
  // ===========================
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ===========================
  // THEME
  // ===========================
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDarkTheme = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDarkMode(shouldUseDarkTheme);
    document.documentElement.classList.toggle('dark', shouldUseDarkTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  // ===========================
  // AUTH
  // ===========================
  useEffect(() => {
    const savedUser = localStorage.getItem(SIMPLE_LOGIN_STORAGE_KEY);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser) as AppUser);
      } catch {
        localStorage.removeItem(SIMPLE_LOGIN_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  // Load data on login
  useEffect(() => {
    if (user) {
      setTasks(loadTasks());
      setProjects(loadProjects());
      setNotes(loadNotes());
      setHabits(loadHabits());
      setAchievements(loadAchievements());
    } else {
      setTasks([]);
      setProjects([]);
      setNotes([]);
      setHabits([]);
      setAchievements([]);
    }
  }, [user]);

  // ===========================
  // KEYBOARD SHORTCUTS
  // ===========================
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K to focus universal input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('universal-input')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ===========================
  // TASK CRUD
  // ===========================
  const addTask = useCallback((data: {
    title: string;
    priority?: Priority;
    dueDate?: string;
    projectId?: string;
    description?: string;
    tags?: string[];
  }) => {
    const task: Task = {
      id: generateId(),
      title: data.title,
      description: data.description || '',
      dueDate: data.dueDate,
      priority: data.priority || 'medium',
      status: 'todo',
      projectId: data.projectId,
      userId: user!.uid,
      tags: data.tags || [],
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks(prev => {
      const updated = [task, ...prev];
      saveTasks(updated);
      return updated;
    });
    showToast('Task created', 'success');
    setTimeout(() => evaluateAchievements(), 100);
  }, [user, showToast]);

  const updateTask = useCallback((id: string, data: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(t =>
        t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
      );
      saveTasks(updated);
      return updated;
    });
    // Evaluate achievements when task status changes
    if (data.status) {
      setTimeout(() => evaluateAchievements(), 100);
    }
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveTasks(updated);
      return updated;
    });
    showToast('Task deleted', 'info');
  }, [showToast]);

  // ===========================
  // PROJECT CRUD
  // ===========================
  const addProject = useCallback((name: string) => {
    const project: Project = {
      id: generateId(),
      name,
      color: `hsl(${Math.floor(Math.random() * 360)}, 65%, 55%)`,
      userId: user!.uid,
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => {
      const updated = [...prev, project];
      saveProjects(updated);
      return updated;
    });
    showToast(`Project "${name}" created`, 'success');
    setTimeout(() => evaluateAchievements(), 100);
  }, [user, showToast]);

  const updateProject = useCallback((id: string, data: Partial<Project>) => {
    setProjects(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...data } : p);
      saveProjects(updated);
      return updated;
    });
  }, []);

  const deleteProject = useCallback((id: string) => {
    const projectName = projects.find(p => p.id === id)?.name;
    // Remove projectId from tasks in this project
    setTasks(prev => {
      const updated = prev.map(t =>
        t.projectId === id ? { ...t, projectId: undefined } : t
      );
      saveTasks(updated);
      return updated;
    });
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveProjects(updated);
      return updated;
    });
    if (activeView === `project-${id}`) {
      setActiveView('inbox');
    }
    showToast(`Project "${projectName}" deleted`, 'info');
  }, [showToast, activeView, projects]);

  // ===========================
  // NOTE CRUD
  // ===========================
  const addNote = useCallback((content: string) => {
    const note: Note = {
      id: generateId(),
      content,
      userId: user!.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => {
      const updated = [note, ...prev];
      saveNotes(updated);
      return updated;
    });
    showToast('Note saved', 'success');
  }, [user, showToast]);

  const updateNote = useCallback((id: string, content: string) => {
    setNotes(prev => {
      const updated = prev.map(n =>
        n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n
      );
      saveNotes(updated);
      return updated;
    });
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => {
      const updated = prev.filter(n => n.id !== id);
      saveNotes(updated);
      return updated;
    });
    showToast('Note deleted', 'info');
  }, [showToast]);

  // ===========================
  // HABIT CRUD
  // ===========================
  const addHabit = useCallback((name: string, emoji: string, color: string) => {
    const habit: Habit = {
      id: generateId(),
      name,
      emoji,
      color,
      userId: user!.uid,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };
    setHabits(prev => {
      const updated = [habit, ...prev];
      saveHabits(updated);
      return updated;
    });
    showToast(`Habit "${name}" created`, 'success');
    // Check achievements
    setTimeout(() => evaluateAchievements(), 100);
  }, [user, showToast]);

  const deleteHabit = useCallback((id: string) => {
    setHabits(prev => {
      const updated = prev.filter(h => h.id !== id);
      saveHabits(updated);
      return updated;
    });
    showToast('Habit deleted', 'info');
  }, [showToast]);

  const toggleHabitDay = useCallback((habitId: string, dateStr: string) => {
    setHabits(prev => {
      const updated = prev.map(h => {
        if (h.id !== habitId) return h;
        const has = h.completedDates.includes(dateStr);
        return {
          ...h,
          completedDates: has
            ? h.completedDates.filter(d => d !== dateStr)
            : [...h.completedDates, dateStr],
        };
      });
      saveHabits(updated);
      return updated;
    });
    // Evaluate achievements after state updates
    setTimeout(() => evaluateAchievements(), 100);
  }, []);

  // ===========================
  // ACHIEVEMENT EVALUATION
  // ===========================
  const evaluateAchievements = useCallback(() => {
    // Read latest data from localStorage for accuracy
    const latestTasks = loadTasks();
    const latestHabits = loadHabits();
    const latestProjects = loadProjects();
    const latestNotes = loadNotes();
    const currentAchievements = loadAchievements();

    const completedTaskCount = latestTasks.filter(t => t.status === 'completed').length;
    const habitCount = latestHabits.length;

    // Calculate max streak across all habits
    const getStreakForHabit = (dates: string[]) => {
      const sorted = [...new Set(dates)].sort().reverse();
      if (sorted.length === 0) return 0;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
      let streak = 0;
      const start = sorted[0] === today ? 0 : 1;
      for (let i = start; i < 365; i++) {
        const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
        if (dates.includes(d)) streak++;
        else break;
      }
      return streak;
    };

    const maxStreak = Math.max(0, ...latestHabits.map(h => getStreakForHabit(h.completedDates)));

    // Check if all habits checked in today
    const today = new Date().toISOString().split('T')[0];
    const allCheckedToday = latestHabits.length > 0 && latestHabits.every(h => h.completedDates.includes(today));

    // Progress map
    const progressMap: Record<string, number> = {
      first_task: completedTaskCount,
      five_tasks: completedTaskCount,
      twenty_five_tasks: completedTaskCount,
      centurion: completedTaskCount,
      first_habit: habitCount,
      five_habits: habitCount,
      streak_3: maxStreak,
      streak_7: maxStreak,
      streak_14: maxStreak,
      streak_30: maxStreak,
      project_starter: latestProjects.length,
      note_taker: latestNotes.length,
      completionist: allCheckedToday ? 1 : 0,
    };

    let changed = false;
    const updated = ACHIEVEMENTS.map(def => {
      const existing = currentAchievements.find(a => a.id === def.id);
      const newCurrent = Math.min(progressMap[def.id] ?? 0, def.maxProgress);
      const wasUnlocked = !!existing?.unlockedAt;
      const isNowUnlocked = newCurrent >= def.maxProgress;

      if (!existing || existing.current !== newCurrent || (!wasUnlocked && isNowUnlocked)) {
        changed = true;
      }

      return {
        id: def.id,
        current: newCurrent,
        unlockedAt: isNowUnlocked ? (existing?.unlockedAt || new Date().toISOString()) : undefined,
      } as AchievementProgress;
    });

    if (changed) {
      saveAchievements(updated);
      setAchievements(updated);
    }
  }, []);

  // ===========================
  // LOGIN
  // ===========================
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (usernameInput.trim() !== SIMPLE_LOGIN_USERNAME || passwordInput !== SIMPLE_LOGIN_PASSWORD) {
      setLoginError('Invalid username or password.');
      return;
    }

    const localUser: AppUser = {
      uid: SIMPLE_LOGIN_USERNAME,
      username: SIMPLE_LOGIN_USERNAME,
      email: `${SIMPLE_LOGIN_USERNAME}@local.focusflow`,
      displayName: 'Suhar',
      photoURL: undefined,
    };

    setUser(localUser);
    localStorage.setItem(SIMPLE_LOGIN_STORAGE_KEY, JSON.stringify(localUser));
    setUsernameInput('');
    setPasswordInput('');
  };

  const handleLogout = () => {
    setUser(null);
    setActiveView('inbox');
    localStorage.removeItem(SIMPLE_LOGIN_STORAGE_KEY);
  };

  // ===========================
  // RENDER: LOADING
  // ===========================
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 animate-pulse">
            <Layout size={20} />
          </div>
          <div className="text-xs text-zinc-400 font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  // ===========================
  // RENDER: LOGIN
  // ===========================
  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-sm w-full text-center space-y-8"
        >
          {/* Logo */}
          <div className="space-y-3">
            <div className="w-14 h-14 mx-auto bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/25">
              <Layout size={28} strokeWidth={2} />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              FocusFlow
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
              AI-powered productivity. Tasks, ideas, and focused work — all in one place.
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Username"
              autoComplete="username"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm transition-shadow"
            />
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm transition-shadow"
            />
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
            >
              <LogIn size={18} />
              Sign in
            </button>
          </form>

          {loginError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-rose-600 dark:text-rose-400 font-medium"
            >
              {loginError}
            </motion.p>
          )}

          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Demo: <span className="font-mono font-bold text-zinc-500 dark:text-zinc-400">suhar</span> / <span className="font-mono font-bold text-zinc-500 dark:text-zinc-400">suharshr@9906</span>
          </p>

          {/* Feature pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
            {['Tasks', 'Ideas', 'AI Capture', 'Projects'].map(item => (
              <span
                key={item}
                className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900"
              >
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ===========================
  // RENDER: MAIN APP
  // ===========================
  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950 overflow-hidden font-sans">
      <Sidebar
        projects={projects}
        tasks={tasks}
        activeView={activeView}
        setActiveView={setActiveView}
        user={user}
        onLogout={handleLogout}
        onAddProject={addProject}
        onUpdateProject={updateProject}
        onDeleteProject={deleteProject}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-900 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-8 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 z-20">
          <div className="flex items-center gap-3 flex-1">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors md:hidden text-zinc-500 dark:text-zinc-400"
            >
              <Menu size={20} />
            </button>

            <UniversalInput
              user={user}
              projects={projects}
              onAddTask={addTask}
              onAddNote={addNote}
            />
          </div>

          <div className="flex items-center gap-2 pl-4 shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 dark:text-zinc-500"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center overflow-hidden text-white text-xs font-bold shadow-sm">
              {user.displayName?.[0]?.toUpperCase() || <UserIcon size={14} />}
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeView === 'habits' ? (
            <HabitTracker
              habits={habits}
              achievements={achievements}
              onAddHabit={addHabit}
              onDeleteHabit={deleteHabit}
              onToggleHabitDay={toggleHabitDay}
            />
          ) : (
            <TaskBoard
              key={activeView}
              view={activeView}
              tasks={tasks}
              notes={notes}
              projects={projects}
              user={user}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onAddNote={addNote}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
            />
          )}
        </div>
      </main>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
