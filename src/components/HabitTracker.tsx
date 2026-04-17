import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Habit, AchievementProgress, AchievementDef } from '../types';
import { ACHIEVEMENTS } from '../lib/achievements';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  X,
  Check,
  Flame,
  Trophy,
  Lock,
  Trash2,
  Sparkles,
} from 'lucide-react';

// ============================================
// HELPERS
// ============================================
const todayStr = () => new Date().toISOString().split('T')[0];

const getDayStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const getStreak = (completedDates: string[]): number => {
  const sorted = [...new Set(completedDates)].sort().reverse();
  if (sorted.length === 0) return 0;

  const today = todayStr();
  const yesterday = getDayStr(1);

  // Streak starts from today or yesterday
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 0;
  let checkDate = sorted[0] === today ? today : yesterday;

  for (let i = 0; i < 365; i++) {
    const d = getDayStr(sorted[0] === today ? i : i + 1);
    if (completedDates.includes(d)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

const getBestStreak = (completedDates: string[]): number => {
  if (completedDates.length === 0) return 0;
  const sorted = [...new Set(completedDates)].sort();
  let best = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
};

const HABIT_EMOJIS = ['🏋️', '📖', '🧘', '💧', '🏃', '✍️', '🎸', '🥗', '💤', '🧠', '🚶', '💊', '🎨', '📝', '🌅'];
const HABIT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
];

// ============================================
// MAIN COMPONENT
// ============================================
interface HabitTrackerProps {
  habits: Habit[];
  achievements: AchievementProgress[];
  onAddHabit: (name: string, emoji: string, color: string) => void;
  onDeleteHabit: (id: string) => void;
  onToggleHabitDay: (id: string, dateStr: string) => void;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({
  habits,
  achievements,
  onAddHabit,
  onDeleteHabit,
  onToggleHabitDay,
}) => {
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🏋️');
  const [newColor, setNewColor] = useState(HABIT_COLORS[0]);
  const [celebratingAchievement, setCelebratingAchievement] = useState<AchievementDef | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingHabit && inputRef.current) inputRef.current.focus();
  }, [isAddingHabit]);

  // Check for newly unlocked achievements
  const prevUnlockedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const currentUnlocked = new Set(achievements.filter(a => a.unlockedAt).map(a => a.id));
    const newlyUnlocked = [...currentUnlocked].filter(id => !prevUnlockedRef.current.has(id));
    if (newlyUnlocked.length > 0) {
      const def = ACHIEVEMENTS.find(a => a.id === newlyUnlocked[newlyUnlocked.length - 1]);
      if (def) setCelebratingAchievement(def);
    }
    prevUnlockedRef.current = currentUnlocked;
  }, [achievements]);

  const handleAddHabit = () => {
    const name = newName.trim();
    if (!name) return;
    onAddHabit(name, newEmoji, newColor);
    setNewName('');
    setNewEmoji('🏋️');
    setNewColor(HABIT_COLORS[0]);
    setIsAddingHabit(false);
  };

  const today = todayStr();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 h-full overflow-y-auto custom-scrollbar space-y-10"
    >
      {/* ================================ */}
      {/* HABITS SECTION */}
      {/* ================================ */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Habits</h1>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">Track your daily routines and build streaks</p>
          </div>
          <button
            onClick={() => setIsAddingHabit(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors shadow-sm"
          >
            <Plus size={14} />
            New Habit
          </button>
        </div>

        {/* New habit form */}
        <AnimatePresence>
          {isAddingHabit && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-900/40 shadow-sm space-y-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{newEmoji}</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddHabit();
                    if (e.key === 'Escape') { setIsAddingHabit(false); setNewName(''); }
                  }}
                  placeholder="Habit name (e.g. Gym, Reading...)"
                  className="flex-1 text-sm font-medium bg-transparent outline-none text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                />
              </div>

              {/* Emoji picker */}
              <div>
                <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Icon</div>
                <div className="flex flex-wrap gap-2">
                  {HABIT_EMOJIS.map(e => (
                    <button
                      key={e}
                      onClick={() => setNewEmoji(e)}
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all',
                        newEmoji === e
                          ? 'bg-indigo-100 dark:bg-indigo-900/40 ring-2 ring-indigo-500 scale-110'
                          : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Color</div>
                <div className="flex gap-2">
                  {HABIT_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={cn(
                        'w-7 h-7 rounded-full transition-all',
                        newColor === c ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 scale-110' : ''
                      )}
                      style={{ backgroundColor: c, ...(newColor === c ? { ringColor: c } : {}) }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => { setIsAddingHabit(false); setNewName(''); }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddHabit}
                  disabled={!newName.trim()}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-all"
                >
                  Create Habit
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Habit cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {habits.length === 0 && !isAddingHabit && (
            <div className="col-span-full py-16 text-center">
              <div className="text-4xl mb-3">🌱</div>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm font-medium">No habits yet.</p>
              <p className="text-zinc-300 dark:text-zinc-600 text-xs mt-1">Start building better routines with the button above.</p>
            </div>
          )}
          <AnimatePresence>
            {habits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggleDay={onToggleHabitDay}
                onDelete={onDeleteHabit}
              />
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* ================================ */}
      {/* ACHIEVEMENTS SECTION */}
      {/* ================================ */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Trophy size={20} className="text-amber-500" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Achievements</h2>
          <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 ml-auto">
            {achievements.filter(a => a.unlockedAt).length}/{ACHIEVEMENTS.length} unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {ACHIEVEMENTS.map(def => {
            const progress = achievements.find(a => a.id === def.id);
            const isUnlocked = !!progress?.unlockedAt;
            const current = progress?.current ?? 0;
            const pct = Math.min((current / def.maxProgress) * 100, 100);

            return (
              <motion.div
                key={def.id}
                layout
                className={cn(
                  'relative p-4 rounded-xl border transition-all text-center',
                  isUnlocked
                    ? 'bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/30 border-indigo-200 dark:border-indigo-800/50 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-100 dark:border-zinc-800/60'
                )}
              >
                {/* Lock overlay */}
                {!isUnlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock size={10} className="text-zinc-300 dark:text-zinc-600" />
                  </div>
                )}

                <div className={cn(
                  'text-3xl mb-2 transition-all',
                  !isUnlocked && 'grayscale opacity-40'
                )}>
                  {def.emoji}
                </div>

                <h4 className={cn(
                  'text-[11px] font-bold tracking-tight',
                  isUnlocked ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'
                )}>
                  {def.title}
                </h4>

                <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-snug">
                  {def.description}
                </p>

                {/* Progress bar */}
                <div className="mt-2.5 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      'h-full rounded-full',
                      isUnlocked
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                        : 'bg-zinc-400 dark:bg-zinc-600'
                    )}
                  />
                </div>

                <div className="mt-1 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 tabular-nums">
                  {current}/{def.maxProgress}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ================================ */}
      {/* ACHIEVEMENT CELEBRATION MODAL */}
      {/* ================================ */}
      <AnimatePresence>
        {celebratingAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setCelebratingAchievement(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xs p-8 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl"
            >
              {/* Glow ring */}
              <div className="relative w-24 h-24 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 opacity-20 blur-xl animate-pulse" />
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/60 dark:to-violet-950/40 border-2 border-indigo-300 dark:border-indigo-700 flex items-center justify-center">
                  <span className="text-5xl">{celebratingAchievement.emoji}</span>
                </div>
              </div>

              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-500 dark:text-indigo-400 mb-1">
                Achievement Unlocked!
              </div>
              <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {celebratingAchievement.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                {celebratingAchievement.description}
              </p>

              {/* Full progress bar */}
              <div className="mt-4 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                />
              </div>

              <button
                onClick={() => setCelebratingAchievement(null)}
                className="mt-6 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 hover:opacity-90 transition-opacity"
              >
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================
// HABIT CARD
// ============================================
interface HabitCardProps {
  key?: React.Key;
  habit: Habit;
  onToggleDay: (habitId: string, dateStr: string) => void;
  onDelete: (id: string) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onToggleDay, onDelete }) => {
  const today = todayStr();
  const isCompletedToday = habit.completedDates.includes(today);
  const streak = getStreak(habit.completedDates);
  const bestStreak = getBestStreak(habit.completedDates);

  // Last 35 days for the timeline
  const timelineDays = useMemo(() => {
    const days: { dateStr: string; completed: boolean; isToday: boolean; label: string }[] = [];
    for (let i = 34; i >= 0; i--) {
      const dateStr = getDayStr(i);
      const d = new Date(dateStr);
      days.push({
        dateStr,
        completed: habit.completedDates.includes(dateStr),
        isToday: i === 0,
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      });
    }
    return days;
  }, [habit.completedDates]);

  // Completion % this month
  const monthPct = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysPassed = now.getDate();
    const completedThisMonth = habit.completedDates.filter(d => {
      const date = new Date(d);
      return date.getFullYear() === year && date.getMonth() === month;
    }).length;
    return Math.round((completedThisMonth / daysPassed) * 100);
  }, [habit.completedDates]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all relative group"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: habit.color + '20' }}
        >
          {habit.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">{habit.name}</h3>
          <div className="flex items-center gap-3 mt-0.5">
            {streak > 0 && (
              <span className="text-[10px] font-bold flex items-center gap-0.5" style={{ color: habit.color }}>
                <Flame size={10} />
                {streak} day{streak !== 1 ? 's' : ''}
              </span>
            )}
            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
              Best: {bestStreak}d
            </span>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
              {monthPct}% this month
            </span>
          </div>
        </div>

        {/* Check in button */}
        <button
          onClick={() => onToggleDay(habit.id, today)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0',
            isCompletedToday
              ? 'text-white shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-white'
          )}
          style={isCompletedToday
            ? { backgroundColor: habit.color }
            : undefined
          }
          onMouseEnter={e => {
            if (!isCompletedToday) {
              (e.currentTarget as HTMLElement).style.backgroundColor = habit.color;
            }
          }}
          onMouseLeave={e => {
            if (!isCompletedToday) {
              (e.currentTarget as HTMLElement).style.backgroundColor = '';
            }
          }}
        >
          {isCompletedToday ? <Check size={12} strokeWidth={3} /> : <Plus size={12} />}
          {isCompletedToday ? 'Done' : 'Check In'}
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(habit.id)}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-zinc-300 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-400 transition-all rounded"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Timeline streak bar */}
      <div className="flex gap-[3px]">
        {timelineDays.map(day => (
          <button
            key={day.dateStr}
            onClick={() => onToggleDay(habit.id, day.dateStr)}
            title={`${new Date(day.dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${day.completed ? ' ✓' : ''}`}
            className={cn(
              'flex-1 h-5 rounded-[3px] transition-all relative',
              day.completed
                ? 'opacity-100'
                : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700',
              day.isToday && !day.completed && 'ring-1 ring-zinc-300 dark:ring-zinc-600'
            )}
            style={day.completed ? {
              backgroundColor: habit.color,
              opacity: day.isToday ? 1 : 0.7,
            } : undefined}
          >
            {day.isToday && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ backgroundColor: habit.color }} />
            )}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1.5 px-0.5">
        <span className="text-[8px] font-medium text-zinc-400 dark:text-zinc-600">35 days ago</span>
        <span className="text-[8px] font-medium text-zinc-400 dark:text-zinc-600">Today</span>
      </div>
    </motion.div>
  );
};
