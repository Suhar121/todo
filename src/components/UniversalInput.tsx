import React, { useState } from 'react';
import { AppUser, Project, Priority } from '../types';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { parseUniversalInput } from '../lib/gemini';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface UniversalInputProps {
  user: AppUser;
  projects: Project[];
  onAddTask: (data: { title: string; priority?: Priority; dueDate?: string; tags?: string[] }) => void;
  onAddNote: (content: string) => void;
}

export const UniversalInput: React.FC<UniversalInputProps> = ({ user, projects, onAddTask, onAddNote }) => {
  const [input, setInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || parsing) return;

    setParsing(true);
    try {
      const parsed = await parseUniversalInput(input);

      if (parsed.isTask) {
        onAddTask({
          title: parsed.title,
          priority: parsed.priority || 'medium',
          dueDate: parsed.dueDate,
          tags: parsed.tags,
        });
      } else {
        onAddNote(parsed.title);
      }

      setInput('');
    } catch (err) {
      console.error('Universal input error:', err);
      // Fallback: create as a task with the raw input
      onAddTask({ title: input.trim() });
      setInput('');
    } finally {
      setParsing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'relative group transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        isFocused ? 'w-full max-w-[520px]' : 'w-full max-w-[340px]'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 px-3 h-10 rounded-xl transition-all duration-300',
          isFocused
            ? 'bg-white dark:bg-zinc-800 ring-1 ring-indigo-500/50 shadow-md shadow-indigo-500/5'
            : 'bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/80'
        )}
      >
        <div className="text-zinc-400 group-focus-within:text-indigo-500 transition-colors shrink-0">
          {parsing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        </div>

        <input
          id="universal-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              (e.target as HTMLInputElement).blur();
              setIsFocused(false);
            }
          }}
          placeholder='AI capture — "Meeting tmrw 2pm" or "Idea: ..."'
          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-800 dark:text-zinc-200 min-w-0"
          disabled={parsing}
        />

        <div className="flex items-center gap-1.5 shrink-0">
          <AnimatePresence>
            {input && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                type="submit"
                disabled={parsing}
                className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Send size={12} />
              </motion.button>
            )}
          </AnimatePresence>

          {!input && !isFocused && (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-700/70 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Hints dropdown */}
      <AnimatePresence>
        {isFocused && !input && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full left-0 right-0 mt-2 p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50"
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
              Try saying
            </div>
            <div className="space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-indigo-500" />
                "Review PR by end of day" → creates a task
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-violet-500" />
                "Idea: app for tracking habits" → saves a note
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-500" />
                "Call dentist tomorrow high priority" → task + date + priority
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
};
