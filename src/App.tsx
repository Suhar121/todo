/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Task, Project, Note, Priority, AppUser, Habit, AchievementProgress } from './types';
import {
  loadTasks, insertTask, updateTaskDb, deleteTaskDb,
  loadProjects, insertProject, updateProjectDb, deleteProjectDb,
  loadNotes, insertNote, updateNoteDb, deleteNoteDb,
  loadHabits, insertHabit, updateHabitDates, deleteHabitDb,
  loadAchievements, upsertAchievements,
  generateId,
} from './lib/storage';
import { supabase } from './lib/supabase';
import { ACHIEVEMENTS } from './lib/achievements';
import { Sidebar } from './components/Sidebar';
import { TaskBoard } from './components/TaskBoard';
import { HabitTracker } from './components/HabitTracker';
import { UniversalInput } from './components/UniversalInput';
import { ToastContainer, ToastItem, ToastType } from './components/Toast';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, User as UserIcon, Sun, Moon, Menu, Layout, Eye, EyeOff, Briefcase, Search, Calendar, Folder, Settings as SettingsIcon, CheckCircle2 } from 'lucide-react';
import { SettingsPanel } from './components/SettingsPanel';
import { getGreeting } from './lib/utils';
import { useTelegramReminders } from './lib/useTelegramReminders';

const WORK_TYPES = [
  { value: 'student', label: 'Student', emoji: '📚' },
  { value: 'developer', label: 'Developer', emoji: '💻' },
  { value: 'designer', label: 'Designer', emoji: '🎨' },
  { value: 'entrepreneur', label: 'Entrepreneur', emoji: '🚀' },
  { value: 'freelancer', label: 'Freelancer', emoji: '✨' },
  { value: 'manager', label: 'Manager', emoji: '📊' },
  { value: 'creator', label: 'Content Creator', emoji: '🎬' },
  { value: 'marketer', label: 'Marketer', emoji: '📢' },
  { value: 'researcher', label: 'Researcher', emoji: '🔬' },
  { value: 'other', label: 'Other', emoji: '🌍' },
];

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Form fields
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [workTypeInput, setWorkTypeInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
  // TOASTS
  // ===========================
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
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
  // AUTH (Supabase)
  // ===========================
  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Clean up URL after OAuth callback (remove tokens from address bar)
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        
        if (session?.user) {
          const u = session.user;
          const meta = u.user_metadata || {};
          setUser({
            uid: u.id,
            username: meta.display_name || u.email?.split('@')[0] || 'User',
            email: u.email || '',
            displayName: meta.display_name || u.email?.split('@')[0] || 'User',
            photoURL: meta.avatar_url,
            workType: meta.work_type,
            telegramToken: meta.telegram_token,
            telegramChatId: meta.telegram_chat_id,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Check existing session against the server
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        supabase.auth.signOut();
        setUser(null);
      } else {
        const meta = user.user_metadata || {};
        setUser({
          uid: user.id,
          username: meta.display_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          displayName: meta.display_name || user.email?.split('@')[0] || 'User',
          photoURL: meta.avatar_url,
          workType: meta.work_type,
          telegramToken: meta.telegram_token,
          telegramChatId: meta.telegram_chat_id,
        });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data when user logs in
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      setTasks([]);
      setProjects([]);
      setNotes([]);
      setHabits([]);
      setAchievements([]);
    }
  }, [user]);

  const loadAllData = async () => {
    const [t, p, n, h, a] = await Promise.all([
      loadTasks(),
      loadProjects(),
      loadNotes(),
      loadHabits(),
      loadAchievements(),
    ]);
    setTasks(t);
    setProjects(p);
    setNotes(n);
    setHabits(h);
    setAchievements(a);
  };

  // ===========================
  // KEYBOARD SHORTCUTS
  // ===========================
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('universal-input')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ===========================
  // TELEGRAM REMINDERS
  // ===========================
  useTelegramReminders(user, tasks);

  // ===========================
  // TASK CRUD
  // ===========================
  const addTask = useCallback(async (data: {
    title: string;
    priority?: Priority;
    dueDate?: string;
    reminderTime?: string;
    projectId?: string;
    description?: string;
    tags?: string[];
  }) => {
    if (!user) return;
    const task: Task = {
      id: generateId(), // Temp ID, Supabase will assign real one
      title: data.title,
      description: data.description || '',
      dueDate: data.dueDate,
      reminderTime: data.reminderTime,
      progress: 0,
      priority: data.priority || 'medium',
      status: 'todo',
      projectId: data.projectId,
      userId: user.uid,
      tags: data.tags || [],
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const inserted = await insertTask(task);
    if (inserted) {
      setTasks(prev => [inserted, ...prev]);
      showToast('Task created', 'success');
      setTimeout(() => evaluateAchievements(), 200);
    } else {
      showToast('Failed to create task', 'error');
    }
  }, [user, showToast]);

  const updateTask = useCallback(async (id: string, data: Partial<Task>) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
    ));
    await updateTaskDb(id, data);
    if (data.status) {
      setTimeout(() => evaluateAchievements(), 200);
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await deleteTaskDb(id);
    showToast('Task deleted', 'info');
  }, [showToast]);

  // ===========================
  // PROJECT CRUD
  // ===========================
  const addProject = useCallback(async (name: string) => {
    if (!user) return;
    const project: Project = {
      id: generateId(),
      name,
      color: `hsl(${Math.floor(Math.random() * 360)}, 65%, 55%)`,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };

    const inserted = await insertProject(project);
    if (inserted) {
      setProjects(prev => [...prev, inserted]);
      showToast(`Project "${name}" created`, 'success');
      setTimeout(() => evaluateAchievements(), 200);
    }
  }, [user, showToast]);

  const updateProject = useCallback(async (id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    await updateProjectDb(id, data);
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    await deleteProjectDb(id);
    showToast('Project deleted', 'info');
  }, [showToast]);

  // ===========================
  // NOTE CRUD
  // ===========================
  const addNote = useCallback(async (content: string) => {
    if (!user) return;
    const note: Note = {
      id: generateId(),
      content,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const inserted = await insertNote(note);
    if (inserted) {
      setNotes(prev => [inserted, ...prev]);
      showToast('Note saved', 'success');
    }
  }, [user, showToast]);

  const updateNote = useCallback(async (id: string, content: string) => {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n
    ));
    await updateNoteDb(id, content);
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    await deleteNoteDb(id);
    showToast('Note deleted', 'info');
  }, [showToast]);

  // ===========================
  // HABIT CRUD
  // ===========================
  const addHabit = useCallback(async (name: string, emoji: string, color: string) => {
    if (!user) return;
    const habit: Habit = {
      id: generateId(),
      name,
      emoji,
      color,
      userId: user.uid,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };

    const inserted = await insertHabit(habit);
    if (inserted) {
      setHabits(prev => [inserted, ...prev]);
      showToast(`Habit "${name}" created`, 'success');
      setTimeout(() => evaluateAchievements(), 200);
    }
  }, [user, showToast]);

  const deleteHabit = useCallback(async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    await deleteHabitDb(id);
    showToast('Habit deleted', 'info');
  }, [showToast]);

  const toggleHabitDay = useCallback(async (habitId: string, dateStr: string) => {
    let newDates: string[] = [];
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const has = h.completedDates.includes(dateStr);
      newDates = has
        ? h.completedDates.filter(d => d !== dateStr)
        : [...h.completedDates, dateStr];
      return { ...h, completedDates: newDates };
    }));
    await updateHabitDates(habitId, newDates);
    setTimeout(() => evaluateAchievements(), 200);
  }, []);

  // ===========================
  // ACHIEVEMENT EVALUATION
  // ===========================
  const evaluateAchievements = useCallback(async () => {
    if (!user) return;

    const [latestTasks, latestHabits, latestProjects, latestNotes, currentAchievements] = await Promise.all([
      loadTasks(), loadHabits(), loadProjects(), loadNotes(), loadAchievements(),
    ]);

    const completedTaskCount = latestTasks.filter(t => t.status === 'completed').length;
    const habitCount = latestHabits.length;

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
    const today = new Date().toISOString().split('T')[0];
    const allCheckedToday = latestHabits.length > 0 && latestHabits.every(h => h.completedDates.includes(today));

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
      await upsertAchievements(updated, user.uid);
      setAchievements(updated);
    }
  }, [user]);

  // ===========================
  // AUTH HANDLERS
  // ===========================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: emailInput.trim(),
      password: passwordInput,
    });

    setAuthLoading(false);

    if (error) {
      setAuthError(error.message);
      return;
    }

    setEmailInput('');
    setPasswordInput('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!displayNameInput.trim()) {
      setAuthError('Please enter your name.');
      return;
    }
    if (!workTypeInput) {
      setAuthError('Please select what you do.');
      return;
    }
    if (passwordInput.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setAuthLoading(true);

    const { error } = await supabase.auth.signUp({
      email: emailInput.trim(),
      password: passwordInput,
      options: {
        data: {
          display_name: displayNameInput.trim(),
          work_type: workTypeInput,
        },
      },
    });

    setAuthLoading(false);

    if (error) {
      setAuthError(error.message);
      return;
    }

    setEmailInput('');
    setPasswordInput('');
    setDisplayNameInput('');
    setWorkTypeInput('');
    showToast('Account created! Welcome to FocusFlow 🎉', 'success');
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setAuthLoading(true);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveView('inbox');
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
  // RENDER: AUTH (Login / Register)
  // ===========================
  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-sm w-full text-center space-y-6"
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
              {authMode === 'login'
                ? 'Welcome back. Sign in to continue.'
                : 'Create your account and start being productive.'
              }
            </p>
          </div>

          {/* Auth tabs */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1">
            <button
              onClick={() => { setAuthMode('login'); setAuthError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMode === 'login'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('register'); setAuthError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMode === 'register'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-3">
            <AnimatePresence mode="wait">
              {authMode === 'register' && (
                <motion.div
                  key="register-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {/* Display Name */}
                  <input
                    type="text"
                    value={displayNameInput}
                    onChange={e => setDisplayNameInput(e.target.value)}
                    placeholder="Full Name"
                    autoComplete="name"
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm transition-shadow"
                  />

                  {/* Work Type */}
                  <div className="text-left">
                    <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
                      <Briefcase size={10} />
                      What do you do?
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {WORK_TYPES.map(wt => (
                        <button
                          key={wt.value}
                          type="button"
                          onClick={() => setWorkTypeInput(wt.value)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${workTypeInput === wt.value
                            ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-400/30'
                            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                        >
                          <span>{wt.emoji}</span>
                          <span>{wt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm transition-shadow"
            />

            {/* Password with visibility toggle */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder={authMode === 'register' ? 'Password (min 6 characters)' : 'Password'}
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                className="w-full px-4 py-3 pr-11 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm transition-shadow"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {authLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : authMode === 'login' ? (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
            <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              Or
            </span>
            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
          </div>

          {/* Google Auth Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={authLoading}
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 py-3 rounded-xl font-semibold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50"
          >
            {authLoading ? (
              <div className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-700 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Error */}
          <AnimatePresence>
            {authError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-rose-600 dark:text-rose-400 font-medium"
              >
                {authError}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Feature pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
            {['Tasks', 'Habits', 'AI Capture', 'Streaks', 'Projects'].map(item => (
              <span
                key={item}
                className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900"
              >
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Toast notifications (visible during auth) */}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // ===========================
  // RENDER: MAIN APP
  // ===========================
  return (
    <div className="flex h-screen bg-white dark:bg-[#0e0e0e] overflow-hidden font-sans">
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

      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0e0e0e] overflow-hidden">
        {/* Top bar */}
        <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-white dark:bg-[#0e0e0e] sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 dark:from-zinc-700 dark:to-zinc-900 flex items-center justify-center overflow-hidden text-white text-sm font-bold shadow-sm border border-zinc-200 dark:border-zinc-800">
              {user.displayName?.[0]?.toUpperCase() || <UserIcon size={15} />}
            </div>
            <div className="flex flex-col justify-center gap-0.5">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">
                {getGreeting()}
              </span>
              <span className="text-lg leading-none font-bold text-zinc-900 dark:text-white tracking-tight capitalize">
                {user.displayName?.split(' ')[0] || 'User'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block w-64">
              <UniversalInput
                user={user}
                projects={projects}
                onAddTask={addTask}
                onAddNote={addNote}
              />
            </div>
            <button className="md:hidden text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors">
              <Search size={22} />
            </button>
            <button
              onClick={() => setActiveView('settings')}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-[#1a1a1a] transition-colors text-zinc-400 dark:text-zinc-500"
              title="Settings"
            >
              <SettingsIcon size={18} />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-[#1a1a1a] transition-colors text-zinc-400 dark:text-zinc-500"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {activeView === 'settings' ? (
             <SettingsPanel
               user={user}
               showToast={showToast}
               onTelegramSettingsSaved={(token, chatId) => {
                 setUser(prev => prev ? {
                   ...prev,
                   telegramToken: token,
                   telegramChatId: chatId,
                 } : prev);
               }}
             />
          ) : activeView === 'habits' ? (
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

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden flex items-center justify-around h-[68px] bg-[#0e0e0e] shrink-0 border-t border-[#1a1a1a] px-2 pb-safe relative z-20">
          <button 
            onClick={() => setActiveView('inbox')}
            className={`flex flex-col items-center justify-center w-14 h-12 rounded-[14px] transition-colors ${activeView === 'inbox' || activeView === 'today' ? 'bg-white text-zinc-900' : 'text-[#888]'}`}
          >
            <Layout size={20} strokeWidth={activeView === 'inbox' || activeView === 'today' ? 2.5 : 2} />
            {activeView !== 'inbox' && activeView !== 'today' && <span className="text-[10px] mt-0.5 font-medium">Inbox</span>}
          </button>
          <button 
            onClick={() => setActiveView('upcoming')}
            className={`flex flex-col items-center justify-center w-14 h-12 rounded-[14px] transition-colors ${activeView === 'upcoming' ? 'bg-white text-zinc-900' : 'text-[#888]'}`}
          >
            <Calendar size={20} strokeWidth={activeView === 'upcoming' ? 2.5 : 2} />
            {activeView !== 'upcoming' && <span className="text-[10px] mt-0.5 font-medium">Upcoming</span>}
          </button>
          <button 
            onClick={() => setActiveView('completed')}
            className={`flex flex-col items-center justify-center w-14 h-12 rounded-[14px] transition-colors ${activeView === 'completed' ? 'bg-white text-zinc-900' : 'text-[#888]'}`}
          >
            <CheckCircle2 size={20} strokeWidth={activeView === 'completed' ? 2.5 : 2} />
            {activeView !== 'completed' && <span className="text-[10px] mt-0.5 font-medium">Completed</span>}
          </button>
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex flex-col items-center justify-center w-14 h-12 rounded-[14px] text-[#888] transition-colors"
          >
            <Menu size={20} strokeWidth={2} />
            <span className="text-[10px] mt-0.5 font-medium">Menu</span>
          </button>
        </nav>
      </main>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
