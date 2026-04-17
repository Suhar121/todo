import React, { useState, useRef, useEffect } from 'react';
import { Plus, Calendar, Flag, FolderOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { Priority, Project } from '../types';
import { motion } from 'motion/react';

interface AddTaskInlineProps {
  onAdd: (data: { title: string; priority: Priority; dueDate?: string; projectId?: string }) => void;
  projects: Project[];
  defaultProjectId?: string;
}

export const AddTaskInline: React.FC<AddTaskInlineProps> = ({ onAdd, projects, defaultProjectId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      priority,
      dueDate: dueDate || undefined,
      projectId: projectId || undefined,
    });
    setTitle('');
    setPriority('medium');
    setDueDate('');
    setProjectId(defaultProjectId || '');
    // Keep form open for rapid task entry
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      setTitle('');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="group relative flex w-full items-center pl-2 pr-4 py-2 sm:py-2.5 border border-zinc-200 dark:border-[#262626]/40 bg-white dark:bg-[#1c1c1c] rounded-[18px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-none hover:dark:bg-[#222] transition-all duration-300"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-indigo-50 dark:bg-white transition-colors duration-300 shadow-sm group-hover:scale-105">
          <Plus size={22} strokeWidth={2.5} className="text-indigo-600 dark:text-zinc-900" />
        </div>
        <span className="ml-4 text-[15px] font-semibold text-zinc-600 dark:text-[#d4d4d4]">Add new task</span>
        <span className="ml-auto uppercase text-[10px] sm:text-xs font-bold tracking-widest text-zinc-400 dark:text-[#555]">
          QUICK ADD
        </span>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-full sm:rounded-2xl border-t sm:border border-indigo-200/80 dark:border-[#262626] bg-white dark:bg-[#131313] shadow-2xl dark:shadow-[0_-20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
    >
      <div className="p-4 space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done?"
          className="w-full text-sm font-medium bg-transparent outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100"
        />

        <div className="flex items-center gap-3 flex-wrap">
          {/* Priority */}
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <Flag size={12} className={cn(
              priority === 'high' ? 'text-rose-500' : priority === 'medium' ? 'text-amber-500' : 'text-zinc-400'
            )} />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="bg-transparent text-xs font-medium outline-none cursor-pointer text-zinc-600 dark:text-zinc-400 appearance-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />

          {/* Due Date */}
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <Calendar size={12} className={cn(dueDate ? 'text-indigo-500' : 'text-zinc-400')} />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-transparent text-xs font-medium outline-none cursor-pointer text-zinc-600 dark:text-zinc-400"
            />
          </label>

          {/* Project */}
          {projects.length > 0 && (
            <>
              <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <FolderOpen size={12} className="text-zinc-400" />
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="bg-transparent text-xs font-medium outline-none cursor-pointer text-zinc-600 dark:text-zinc-400 appearance-none"
                >
                  <option value="">Inbox</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => { setIsOpen(false); setTitle(''); }}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors px-1 py-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Add Task
          </button>
        </div>
      </div>
    </motion.div>
  );
};
