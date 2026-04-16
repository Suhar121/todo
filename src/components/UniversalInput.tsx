import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Project } from '../types';
import { Sparkles, Command, Send, Loader2 } from 'lucide-react';
import { parseUniversalInput } from '../lib/gemini';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface UniversalInputProps {
  user: User;
  projects: Project[];
}

export const UniversalInput: React.FC<UniversalInputProps> = ({ user, projects }) => {
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
        await addDoc(collection(db, 'tasks'), {
          title: parsed.title,
          priority: parsed.priority || 'medium',
          status: 'todo',
          dueDate: parsed.dueDate || null,
          tags: parsed.tags || [],
          userId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subtasks: []
        });
      } else {
        await addDoc(collection(db, 'notes'), {
          content: parsed.title,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      setInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setParsing(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={cn(
        "relative group transition-all duration-300",
        isFocused ? "w-[480px]" : "w-[320px]"
      )}
    >
      <div className={cn(
        "flex items-center gap-2 px-3 h-9 rounded-lg transition-all duration-300",
        isFocused 
          ? "bg-white dark:bg-zinc-800 ring-1 ring-indigo-500 shadow-sm" 
          : "bg-slate-100 dark:bg-zinc-800"
      )}>
        <div className="text-slate-400 group-focus-within:text-indigo-600 transition-colors">
          {parsing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        </div>
        
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search or capture (⌘K)"
          className="flex-1 bg-transparent border-none outline-none text-[14px] placeholder:text-slate-400 dark:placeholder:text-zinc-500 text-slate-700 dark:text-zinc-200"
        />

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {input && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="submit"
                className="p-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                <Send size={12} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <AnimatePresence>
        {isFocused && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 text-[11px] text-slate-400 dark:text-zinc-500 font-medium flex gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide"
          >
            <span>Ask AI: "Meeting tomorrow"</span>
            <span>•</span>
            <span>"Idea: Space travel #future"</span>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

