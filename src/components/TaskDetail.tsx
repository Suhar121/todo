import React, { useState, useEffect } from 'react';
import { Task, Project, Priority, Status, Subtask } from '../types';
import { cn } from '../lib/utils';
import { generateId } from '../lib/storage';
import { motion } from 'motion/react';
import {
  X, CheckCircle2, Circle, Plus, Flag, Calendar, Tag,
  FolderOpen, AlignLeft, Trash2, Clock
} from 'lucide-react';

interface TaskDetailProps {
  task: Task;
  projects: Project[];
  onUpdate: (id: string, data: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({
  task, projects, onUpdate, onDelete, onClose,
}) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [status, setStatus] = useState<Status>(task.status);
  const [dueDate, setDueDate] = useState(task.dueDate?.split('T')[0] || '');
  const [projectId, setProjectId] = useState(task.projectId || '');
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');

  // Re-sync when a different task is selected
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setStatus(task.status);
    setDueDate(task.dueDate?.split('T')[0] || '');
    setProjectId(task.projectId || '');
    setTags(task.tags || []);
    setSubtasks(task.subtasks || []);
    setNewSubtask('');
    setTagInput('');
  }, [task.id]);

  // Auto-save with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdate(task.id, {
        title: title.trim() || 'Untitled',
        description,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate + 'T00:00:00').toISOString() : undefined,
        projectId: projectId || undefined,
        tags,
        subtasks,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [title, description, priority, status, dueDate, projectId, JSON.stringify(tags), JSON.stringify(subtasks)]);

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks(prev => [...prev, {
      id: generateId(),
      title: newSubtask.trim(),
      completed: false,
    }]);
    setNewSubtask('');
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(prev => prev.map(s =>
      s.id === id ? { ...s, completed: !s.completed } : s
    ));
  };

  const deleteSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleDelete = () => {
    onDelete(task.id);
    onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const progressPercent = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/30 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex-1 pr-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-bold bg-transparent outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
              placeholder="Task title..."
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleDelete}
              className="p-2 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
              title="Delete task"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 custom-scrollbar">
          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                <Clock size={10} /> Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 text-sm font-medium outline-none cursor-pointer text-zinc-700 dark:text-zinc-300 rounded-md px-2 py-1 border border-zinc-100 dark:border-zinc-800"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                <Flag size={10} /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className={cn(
                  'w-full bg-zinc-50 dark:bg-zinc-800/50 text-sm font-medium outline-none cursor-pointer rounded-md px-2 py-1 border border-zinc-100 dark:border-zinc-800',
                  priority === 'high' ? 'text-rose-600 dark:text-rose-400' : priority === 'medium' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500'
                )}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                <Calendar size={10} /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 text-sm font-medium outline-none cursor-pointer text-zinc-700 dark:text-zinc-300 rounded-md px-2 py-1 border border-zinc-100 dark:border-zinc-800"
              />
            </div>

            {/* Project */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                <FolderOpen size={10} /> Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 text-sm font-medium outline-none cursor-pointer text-zinc-700 dark:text-zinc-300 rounded-md px-2 py-1 border border-zinc-100 dark:border-zinc-800"
              >
                <option value="">Inbox</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
              <AlignLeft size={10} /> Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-700 dark:text-zinc-300 rounded-xl p-3 outline-none resize-none border border-zinc-100 dark:border-zinc-800 focus:border-indigo-300 dark:focus:border-indigo-700 transition-colors placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
              <Tag size={10} /> Tags
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium"
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-rose-500 transition-colors ml-0.5"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addTag(); }
                  if (e.key === 'Backspace' && !tagInput && tags.length) {
                    removeTag(tags[tags.length - 1]);
                  }
                }}
                onBlur={() => { if (tagInput.trim()) addTag(); }}
                placeholder="Type + Enter"
                className="bg-transparent text-xs outline-none text-zinc-500 dark:text-zinc-400 min-w-[80px] placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Subtasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Subtasks{subtasks.length > 0 ? ` (${completedSubtasks}/${subtasks.length})` : ''}
              </label>
            </div>

            {subtasks.length > 0 && (
              <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            )}

            <div className="space-y-1">
              {subtasks.map(s => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                >
                  <button onClick={() => toggleSubtask(s.id)} className="shrink-0">
                    {s.completed
                      ? <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400" />
                      : <Circle size={18} className="text-zinc-300 dark:text-zinc-600 hover:text-indigo-400 transition-colors" />
                    }
                  </button>
                  <span className={cn('text-sm flex-1 transition-all', s.completed && 'text-zinc-400 dark:text-zinc-500 line-through')}>
                    {s.title}
                  </span>
                  <button
                    onClick={() => deleteSubtask(s.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 transition-colors focus-within:border-indigo-300 dark:focus-within:border-indigo-800">
                <Plus size={18} className="text-zinc-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Add subtask..."
                  className="flex-1 bg-transparent outline-none text-sm text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addSubtask(); }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider">
          <span>Created {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Auto-saved
          </span>
        </div>
      </motion.div>
    </div>
  );
};
