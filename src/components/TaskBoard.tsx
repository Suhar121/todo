import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AppUser, Task, Project, Note, Priority, Status } from '../types';
import {
  CheckCircle2, Trash2, Plus, Calendar, Flag, Tag, Pencil, X, Star, Inbox, Clock,
  Sun, CalendarDays, CheckCircle, Circle, MoreHorizontal, Search, LayoutGrid, List,
  ArrowUpDown, Filter, Sparkles, AlertCircle, Archive, Copy, ExternalLink, GripVertical,
  Lightbulb
} from 'lucide-react';
import { cn, formatRelativeDate, getLocalDateKey, isOverdue, taskDateKey, getDurationText } from '../lib/utils';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { AddTaskInline } from './AddTaskInline';
import { TaskDetail } from './TaskDetail';
import { ConfirmDialog } from './ConfirmDialog';
interface TaskBoardProps {
  view: string;
  tasks: Task[];
  notes: Note[];
  projects: Project[];
  user: AppUser;
  onAddTask: (data: {
    title: string;
    priority?: Priority;
    dueDate?: string;
    projectId?: string;
    description?: string;
    tags?: string[];
  }) => void;
  onUpdateTask: (id: string, data: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onAddNote: (content: string) => void;
  onUpdateNote: (id: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onReorderTasks?: (reorderedTasks: Task[]) => void;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'default' | 'priority' | 'date' | 'name';

  const priorityConfig: Record<Priority, { label: string; color: string; bgColor: string; dotColor: string }> = {
    high: { label: 'High', color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-500/10', dotColor: 'bg-rose-500' },
    medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-500/10', dotColor: 'bg-amber-500' },
    low: { label: 'Low', color: 'text-zinc-500 dark:text-zinc-400', bgColor: 'bg-zinc-50 dark:bg-zinc-500/10', dotColor: 'bg-zinc-400' },
  };

const viewConfig: Record<string, { title: string; subtitle: string; icon: React.ReactNode; emptyEmoji: string; emptyTitle: string; emptySubtitle: string }> = {
  inbox: { title: 'Inbox', subtitle: 'Tasks waiting for your attention', icon: <Inbox size={24} />, emptyEmoji: 'inbox', emptyTitle: 'Inbox Zero!', emptySubtitle: 'All caught up. Enjoy your productivity.' },
  today: { title: 'Today', subtitle: "What's due today", icon: <Sun size={24} />, emptyEmoji: 'sun', emptyTitle: 'Nothing due today', emptySubtitle: 'Take a breather or plan ahead.' },
  upcoming: { title: 'Upcoming', subtitle: 'Tasks scheduled ahead', icon: <CalendarDays size={24} />, emptyEmoji: 'calendar', emptyTitle: 'No upcoming tasks', emptySubtitle: 'Your calendar is clear.' },
  completed: { title: 'Completed', subtitle: 'Finished tasks', icon: <CheckCircle size={24} />, emptyEmoji: 'trophy', emptyTitle: 'No completed tasks', emptySubtitle: 'Start checking off tasks to see them here.' },
};

export const TaskBoard: React.FC<TaskBoardProps> = ({
  view, tasks, notes, projects, user, onAddTask, onUpdateTask, onDeleteTask, onAddNote, onUpdateNote, onDeleteNote, onReorderTasks
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
  const [quickNoteInput, setQuickNoteInput] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortBy>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) || null : null;

  useEffect(() => {
    if (selectedTaskId && !tasks.find(t => t.id === selectedTaskId)) {
      setSelectedTaskId(null);
    }
  }, [tasks, selectedTaskId]);

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(task => {
      if (view === 'inbox') return task.status !== 'completed';
      if (view === 'today') {
        const today = getLocalDateKey();
        return taskDateKey(task.dueDate) === today && task.status !== 'completed';
      }
      if (view === 'upcoming') {
        const today = getLocalDateKey();
        const dueKey = taskDateKey(task.dueDate);
        return !!dueKey && dueKey > today && task.status !== 'completed';
      }
      if (view === 'completed') return task.status === 'completed';
      if (view.startsWith('project-')) {
        return task.projectId === view.replace('project-', '') && task.status !== 'completed';
      }
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }

    if (sortBy === 'priority') {
      const order = { high: 0, medium: 1, low: 2 };
      result.sort((a, b) => order[a.priority] - order[b.priority]);
    } else if (sortBy === 'date') {
      result.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Default: sort by position
      result.sort((a, b) => {
        if ((a.position || 0) !== (b.position || 0)) {
          return (a.position || 0) - (b.position || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return result;
  }, [tasks, view, searchQuery, sortBy]);

  const stats = useMemo(() => ({
    total: tasks.filter(t => t.status !== 'completed').length,
    today: tasks.filter(t => taskDateKey(t.dueDate) === getLocalDateKey() && t.status !== 'completed').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    highPriority: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
  }), [tasks]);

  const toggleTaskStatus = (task: Task) => {
    const newStatus: Status = task.status === 'completed' ? 'todo' : 'completed';
    onUpdateTask(task.id, { 
      status: newStatus, 
      progress: newStatus === 'completed' ? 100 : 0,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined 
    });
  };

  const handleDeleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    setConfirmAction({
      title: 'Delete task?',
      message: task ? `"${task.title}" will be permanently deleted.` : 'This task will be permanently deleted.',
      onConfirm: () => { onDeleteTask(id); setConfirmAction(null); },
    });
  };

  const createQuickNote = () => {
    const content = quickNoteInput.trim();
    if (!content) return;
    onAddNote(content);
    setQuickNoteInput('');
    setIsQuickNoteOpen(false);
  };

  const convertNoteToTask = useCallback((note: Note) => {
    const text = note.content.trim();
    if (!text) return;
    const [firstLine] = text.split('\n');
    const title = (firstLine?.trim() || text).slice(0, 120);
    onAddTask({ title, description: text, tags: ['idea'], priority: 'medium' });
  }, [onAddTask]);

  if (view === 'notes') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white">
                    <Sparkles size={20} />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Quick Capture</span>
                </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">Ideas & Notes</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{notes.length} note{notes.length !== 1 ? 's' : ''} captured</p>
              </div>
              <button onClick={() => setIsQuickNoteOpen(true)} className="w-full sm:w-auto flex justify-center items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all">
                <Plus size={18} /> New Note
              </button>
            </div>
          </motion.div>

          <AnimatePresence>
              {isQuickNoteOpen && (
                <motion.div initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} className="mb-8 p-5 bg-white dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-xl">
                  <textarea autoFocus value={quickNoteInput} onChange={(e) => setQuickNoteInput(e.target.value)} placeholder="What's on your mind?" className="w-full min-h-24 resize-none text-zinc-900 dark:text-white bg-transparent outline-none placeholder:text-zinc-400 text-base" onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) createQuickNote(); if (e.key === 'Escape') { setIsQuickNoteOpen(false); setQuickNoteInput(''); } }} />
                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-white/[0.08] gap-4">
                  <span className="text-xs text-zinc-400 hidden sm:inline">Ctrl+Enter to save</span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => { setIsQuickNoteOpen(false); setQuickNoteInput(''); }} className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
                    <button onClick={createQuickNote} disabled={!quickNoteInput.trim()} className="flex-1 sm:flex-none px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity">Save Note</button>
                  </div>
                </div>
                </motion.div>
              )}
          </AnimatePresence>

          {notes.length === 0 && !isQuickNoteOpen ? (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 sm:py-24">
              <div className="w-20 h-20 mx-auto mb-6 bg-zinc-100 dark:bg-white/[0.03] backdrop-blur-xl border border-transparent dark:border-white/[0.08] rounded-3xl flex items-center justify-center text-4xl">
                  <Lightbulb size={32} className="text-zinc-600" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">No notes yet</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">Capture your thoughts and ideas to process later.</p>
              </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {notes.map((note, i) => (
                  <motion.div key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03 }} className="group p-5 bg-white dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-2xl hover:shadow-lg hover:border-zinc-300 dark:hover:border-white/[0.15] dark:hover:bg-white/[0.05] transition-all">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-4 whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="text-[10px] font-medium text-zinc-400">{formatRelativeDate(note.createdAt)}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => convertNoteToTask(note)} className="p-1.5 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors" title="Convert to task"><CheckCircle2 size={14} /></button>
                      <button onClick={() => {
                        const content = note.content.slice(0, 60);
                        setConfirmAction({
                          title: 'Delete note?',
                          message: `"${content}${note.content.length > 60 ? '...' : ''}" will be permanently deleted.`,
                          onConfirm: () => { onDeleteNote(note.id); setConfirmAction(null); },
                        });
                      }} className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  const currentView = view.startsWith('project-')
    ? { title: projects.find(p => p.id === view.replace('project-', ''))?.name || 'Project', subtitle: 'Project tasks', icon: null, emptyEmoji: 'clipboard', emptyTitle: 'No tasks in this project', emptySubtitle: 'Add a task to get started.' }
    : viewConfig[view] || viewConfig.inbox;

  const defaultProjectId = view.startsWith('project-') ? view.replace('project-', '') : undefined;

  return (
    <div className="flex h-full relative z-10">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 md:pb-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-8">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  {currentView.icon && (
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                      {currentView.icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight truncate">{currentView.title}</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{currentView.subtitle}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <div className="flex-1 min-w-0 md:min-w-[120px] relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tasks..." className="pl-9 pr-4 py-2 w-full bg-white dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all" />
                  </div>

                  <div className="relative shrink-0">
                    <button onClick={() => setShowSortMenu(!showSortMenu)} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                      <ArrowUpDown size={14} /> <span className="hidden sm:inline">Sort</span>
                    </button>
                    <AnimatePresence>
                      {showSortMenu && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-xl shadow-xl py-1 z-50">
                          {[{ value: 'default', label: 'Default' }, { value: 'priority', label: 'Priority' }, { value: 'date', label: 'Due Date' }, { value: 'name', label: 'Name' }].map(opt => (
                            <button key={opt.value} onClick={() => { setSortBy(opt.value as SortBy); setShowSortMenu(false); }} className={cn('w-full px-3 py-2 text-sm text-left hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors', sortBy === opt.value ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-zinc-600 dark:text-zinc-400')}>
                              {opt.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

              <div className="flex items-center gap-1 p-1 bg-white dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-xl shrink-0">
                <button onClick={() => setViewMode('list')} className={cn('p-2 rounded-lg transition-all', viewMode === 'list' ? 'bg-zinc-900 dark:bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300')}>
                  <List size={16} />
                </button>
                <button onClick={() => setViewMode('grid')} className={cn('p-2 rounded-lg transition-all', viewMode === 'grid' ? 'bg-zinc-900 dark:bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300')}>
                  <LayoutGrid size={16} />
                </button>
              </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 shrink-0 rounded-full bg-indigo-500" />
                  <span className="text-zinc-500 dark:text-zinc-400">{stats.total} tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 shrink-0 rounded-full bg-rose-500" />
                  <span className="text-zinc-500 dark:text-zinc-400">{stats.highPriority} high priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 shrink-0 rounded-full bg-emerald-500" />
                  <span className="text-zinc-500 dark:text-zinc-400">{stats.completed} completed</span>
                </div>
              </div>
            </motion.div>

            {filteredTasks.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 sm:py-24">
                <div className="w-24 h-24 mx-auto mb-6 bg-zinc-100 dark:bg-white/[0.03] backdrop-blur-xl border border-transparent dark:border-white/[0.08] rounded-3xl flex items-center justify-center text-5xl">
                  <CheckCircle className="text-zinc-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">{currentView.emptyTitle}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">{currentView.emptySubtitle}</p>
              </motion.div>
            ) : viewMode === 'grid' ? (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task, i) => (
                    <TaskCardGrid key={task.id} task={task} projects={projects} index={i} onToggle={() => toggleTaskStatus(task)} onDelete={() => handleDeleteTask(task.id)} onUpdate={(updates) => onUpdateTask(task.id, updates)} onClick={() => setSelectedTaskId(task.id)} />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div layout className="space-y-2">
                {sortBy === 'default' ? (
                  <Reorder.Group axis="y" values={filteredTasks} onReorder={(newOrder) => onReorderTasks && onReorderTasks(newOrder)} className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {filteredTasks.map((task, i) => (
                        <Reorder.Item key={task.id} value={task}>
                          <TaskCardList task={task} projects={projects} index={i} onToggle={() => toggleTaskStatus(task)} onDelete={() => handleDeleteTask(task.id)} onUpdate={(updates) => onUpdateTask(task.id, updates)} onClick={() => setSelectedTaskId(task.id)} isReorderable={true} />
                        </Reorder.Item>
                      ))}
                    </AnimatePresence>
                  </Reorder.Group>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredTasks.map((task, i) => (
                      <TaskCardList key={task.id} task={task} projects={projects} index={i} onToggle={() => toggleTaskStatus(task)} onDelete={() => handleDeleteTask(task.id)} onUpdate={(updates) => onUpdateTask(task.id, updates)} onClick={() => setSelectedTaskId(task.id)} />
                    ))}
                  </AnimatePresence>
                )}
              </motion.div>
            )}

            {view !== 'completed' && (
              <div className="mt-8 pb-8">
                <AddTaskInline onAdd={onAddTask} projects={projects} defaultProjectId={defaultProjectId} />
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedTask && (
          <TaskDetail task={selectedTask} onClose={() => setSelectedTaskId(null)} onUpdate={onUpdateTask} onDelete={onDeleteTask} projects={projects} />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        onConfirm={() => confirmAction?.onConfirm()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};

interface TaskCardListProps {
  task: Task;
  projects: Project[];
  index: number;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onClick: () => void;
}

const TaskCardList: React.FC<TaskCardListProps & { isReorderable?: boolean }> = ({ task, projects, index, onToggle, onDelete, onUpdate, onClick, isReorderable }) => {
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
  const isCompleted = task.status === 'completed';
  const priority = priorityConfig[task.priority];
  const isOverdueTask = task.dueDate && isOverdue(task.dueDate) && !isCompleted;
  const timeStr = task.dueDate ? formatRelativeDate(task.dueDate) : null;
  const timeEstimateStr = task.timeEstimate ? `${task.timeEstimate}m` : null;
  const durationStr = isCompleted && task.completedAt ? getDurationText(task.createdAt, task.completedAt) : null;

  const content = (
    <>
      {isReorderable && (
        <div className="shrink-0 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:text-zinc-500 dark:hover:text-zinc-400 -ml-2">
          <GripVertical size={16} />
        </div>
      )}
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="shrink-0">
        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center transition-all', isCompleted ? 'bg-emerald-500 text-white' : 'border-2 border-zinc-300 dark:border-zinc-600 hover:border-indigo-500 dark:hover:border-indigo-400')}>
          {isCompleted && <CheckCircle2 size={14} />}
          {!isCompleted && task.priority === 'high' && <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />}
        </div>
      </button>

      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={cn('text-base font-semibold truncate', isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-zinc-100')}>{task.title}</h3>
          {task.tags?.includes('featured') && !isCompleted && <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />}
        </div>
        <div className="flex items-center gap-3 text-xs">
          {project && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
              <span className="text-zinc-500 dark:text-zinc-400">{project.name}</span>
            </div>
          )}
          {timeStr && (
            <div className={cn('flex items-center gap-1', isOverdueTask ? 'text-rose-500' : 'text-zinc-400 dark:text-zinc-500')}>
              <Calendar size={10} />
              <span>{timeStr}</span>
            </div>
          )}
          {timeEstimateStr && !isCompleted && (
            <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
              <Clock size={10} />
              <span>{timeEstimateStr}</span>
            </div>
          )}
          {durationStr && isCompleted && (
            <div className="flex items-center gap-1 text-emerald-500 font-medium">
              <Clock size={10} />
              <span>{durationStr}</span>
            </div>
          )}
          {task.progress > 0 && task.progress < 100 && <span className="text-indigo-500 font-medium">{task.progress}%</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', priority.bgColor, priority.color)}>{priority.label}</span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 size={14} />
        </button>
      </div>
    </>
  );

  const className = cn(
    'group relative flex items-center gap-4 p-4 bg-white dark:bg-white/[0.03] backdrop-blur-xl rounded-2xl border cursor-pointer transition-all duration-200',
    isCompleted ? 'border-zinc-100 dark:border-white/[0.04] opacity-60 hover:opacity-100' : 'border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-white/[0.05] hover:border-zinc-300 dark:hover:border-white/[0.15] hover:shadow-md hover:shadow-zinc-200/50 dark:hover:shadow-black/20',
    task.priority === 'high' && !isCompleted && 'border-l-4 border-l-rose-500 border-l-[3px]'
  );

  if (isReorderable) {
    return <div onClick={onClick} className={className}>{content}</div>;
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2, delay: index * 0.02 }} onClick={onClick} className={className}>
      {content}
    </motion.div>
  );
};

interface TaskCardGridProps {
  task: Task;
  projects: Project[];
  index: number;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onClick: () => void;
}

const TaskCardGrid: React.FC<TaskCardGridProps> = ({ task, projects, index, onToggle, onDelete, onUpdate, onClick }) => {
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
  const isCompleted = task.status === 'completed';
  const priority = priorityConfig[task.priority];
  const isOverdueTask = task.dueDate && isOverdue(task.dueDate) && !isCompleted;
  const timeStr = task.dueDate ? formatRelativeDate(task.dueDate) : null;
  const timeEstimateStr = task.timeEstimate ? `${task.timeEstimate}m` : null;
  const durationStr = isCompleted && task.completedAt ? getDurationText(task.createdAt, task.completedAt) : null;

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, delay: index * 0.03 }} onClick={onClick} className={cn(
      'group relative p-5 bg-white dark:bg-white/[0.03] backdrop-blur-xl rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col',
      isCompleted ? 'border-zinc-100 dark:border-white/[0.04] opacity-60' : 'border-zinc-200 dark:border-white/[0.08] hover:shadow-lg hover:border-zinc-300 dark:hover:border-white/[0.15] dark:hover:bg-white/[0.05]',
      task.priority === 'high' && !isCompleted && 'border-l-4 border-l-rose-500'
    )}>
      <div className="flex items-start justify-between mb-3">
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="mt-0.5">
          <div className={cn('w-5 h-5 rounded-full flex items-center justify-center transition-all', isCompleted ? 'bg-emerald-500 text-white' : 'border-2 border-zinc-300 dark:border-zinc-600 hover:border-indigo-500')}>
            {isCompleted && <CheckCircle2 size={12} />}
            {!isCompleted && task.priority === 'high' && <div className="w-2 h-2 rounded-full bg-rose-500" />}
          </div>
        </button>
        <div className="flex items-center gap-1.5">
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', priority.bgColor, priority.color)}>{priority.label}</span>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-zinc-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <h3 className={cn('text-base font-bold mb-2 leading-snug', isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-zinc-100')}>{task.title}</h3>

      <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
        {project && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
            <span>{project.name}</span>
          </div>
        )}
        {timeStr && (
          <div className={cn('flex items-center gap-1', isOverdueTask ? 'text-rose-500' : '')}>
            <Calendar size={10} />
            <span>{timeStr}</span>
          </div>
        )}
        {timeEstimateStr && !isCompleted && (
          <div className="flex items-center gap-1">
            <Clock size={10} />
            <span>{timeEstimateStr}</span>
          </div>
        )}
        {durationStr && isCompleted && (
          <div className="flex items-center gap-1 text-emerald-500 font-medium">
            <Clock size={10} />
            <span>{durationStr}</span>
          </div>
        )}
      </div>

      {task.progress > 0 && task.progress < 100 && (
        <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-white/[0.04]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Progress</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{task.progress}%</span>
          </div>
          <div className="h-1.5 bg-zinc-100 dark:bg-black/20 rounded-full overflow-hidden inset-shadow-sm">
            <motion.div initial={{ width: 0 }} animate={{ width: task.progress + '%' }} className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full shadow-sm" />
          </div>
        </div>
      )}

      {task.tags?.includes('featured') && !isCompleted && (
        <div className="absolute top-3 right-10">
          <Star size={12} className="text-amber-500 fill-amber-500" />
        </div>
      )}
    </motion.div>
  );
};
