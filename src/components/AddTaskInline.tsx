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
        className="w-full flex items-center gap-3 px-4 py-3.5 mb-3 text-sm text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all group"
      >
        <span className="w-5 h-5 rounded-md border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center group-hover:border-indigo-400 dark:group-hover:border-indigo-600 transition-colors">
          <Plus size={12} className="group-hover:rotate-90 transition-transform duration-200" />
        </span>
        <span className="font-medium">Add task</span>
        <span className="ml-auto text-[10px] text-zinc-300 dark:text-zinc-700 font-mono">Enter ↵</span>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 border border-indigo-200 dark:border-indigo-900/40 rounded-xl bg-white dark:bg-zinc-900 shadow-sm shadow-indigo-500/5 overflow-hidden"
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
