import React, { useState, useRef, useEffect } from 'react';
import {
  AppUser,
  Task,
  Project,
  Note,
  Priority,
  Status,
} from '../types';
import {
  CheckCircle2,
  Trash2,
  Plus,
  Calendar,
  Flag,
  Tag,
  Pencil,
  X,
  Star,
} from 'lucide-react';
import { cn, formatRelativeDate, isOverdue } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AddTaskInline } from './AddTaskInline';
import { TaskDetail } from './TaskDetail';

interface TaskBoardProps {
  view: string;
  tasks: Task[];
  notes: Note[];
  projects: Project[];
  user: AppUser;
  onAddTask: (data: { title: string; priority?: Priority; dueDate?: string; projectId?: string; tags?: string[] }) => void;
  onUpdateTask: (id: string, data: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onAddNote: (content: string) => void;
  onUpdateNote: (id: string, content: string) => void;
  onDeleteNote: (id: string) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  view,
  tasks,
  notes,
  projects,
  user,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
  const [quickNoteInput, setQuickNoteInput] = useState('');

  // Get selected task from the live data — stays in sync
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) || null : null;

  // Clear selection if task was deleted
  useEffect(() => {
    if (selectedTaskId && !tasks.find(t => t.id === selectedTaskId)) {
      setSelectedTaskId(null);
    }
  }, [tasks, selectedTaskId]);

  const filteredTasks = tasks.filter(task => {
    if (view === 'inbox') return task.status !== 'completed';
    if (view === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return task.dueDate?.startsWith(today) && task.status !== 'completed';
    }
    if (view === 'upcoming') {
      const today = new Date().toISOString().split('T')[0];
      return task.dueDate && task.dueDate > today && task.status !== 'completed';
    }
    if (view === 'completed') return task.status === 'completed';
    if (view.startsWith('project-')) {
      return task.projectId === view.replace('project-', '') && task.status !== 'completed';
    }
    return true;
  });

  const toggleTaskStatus = (task: Task) => {
    const newStatus: Status = task.status === 'completed' ? 'todo' : 'completed';
    onUpdateTask(task.id, { status: newStatus });
  };

  const handleDeleteTask = (id: string) => {
    onDeleteTask(id);
  };

  const createQuickNote = () => {
    const content = quickNoteInput.trim();
    if (!content) return;
    onAddNote(content);
    setQuickNoteInput('');
    setIsQuickNoteOpen(false);
  };

  // ============================================
  // NOTES VIEW
  // ============================================
  if (view === 'notes') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 sm:p-8 h-full overflow-y-auto custom-scrollbar"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-main dark:text-zinc-50 tracking-tight">Ideas & Notes</h1>
          <button
            type="button"
            onClick={() => setIsQuickNoteOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors shadow-sm"
          >
            <Plus size={14} />
            New Note
          </button>
        </div>

        {/* Quick Note Form */}
        <AnimatePresence>
          {isQuickNoteOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 p-4 border border-indigo-200 dark:border-indigo-900/40 rounded-xl bg-white dark:bg-zinc-900 shadow-sm space-y-3"
            >
              <textarea
                autoFocus
                value={quickNoteInput}
                onChange={(e) => setQuickNoteInput(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full min-h-24 resize-none text-sm bg-transparent outline-none text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) createQuickNote();
                  if (e.key === 'Escape') { setIsQuickNoteOpen(false); setQuickNoteInput(''); }
                }}
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 font-medium">Ctrl+Enter to save</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsQuickNoteOpen(false); setQuickNoteInput(''); }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={createQuickNote}
                    disabled={!quickNoteInput.trim()}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-all"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.length === 0 && !isQuickNoteOpen && (
            <div className="col-span-full py-24 text-center">
              <div className="text-4xl mb-3">💡</div>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm font-medium">No notes or ideas yet.</p>
              <p className="text-zinc-300 dark:text-zinc-600 text-xs mt-1">Capture your thoughts with the button above or press ⌘K.</p>
            </div>
          )}
          <AnimatePresence>
            {notes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onUpdate={onUpdateNote}
                onDelete={onDeleteNote}
              />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  // ============================================
  // TASK VIEW
  // ============================================
  const viewTitle = view.startsWith('project-')
    ? projects.find(p => p.id === view.replace('project-', ''))?.name || 'Project'
    : view.charAt(0).toUpperCase() + view.slice(1);

  const defaultProjectId = view.startsWith('project-') ? view.replace('project-', '') : undefined;

  return (
    <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_320px] h-full overflow-hidden">
      {/* Main task area */}
      <section className="p-4 sm:p-8 overflow-y-auto custom-scrollbar flex flex-col h-full relative">
        <div className="mb-0 shrink-0">
          <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-1">{viewTitle}</h1>
          <div className="text-[15px] md:text-base text-zinc-500 dark:text-[#a0a0a0] font-medium tracking-wide">
            You have {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} to curate.
          </div>
        </div>

        {/* Task List */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {filteredTasks.length === 0 && (
            <div className="py-24 text-center">
              <div className="text-4xl mb-3">{view === 'completed' ? '🎉' : '✨'}</div>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm font-medium">
                {view === 'completed' ? 'No completed tasks yet.' : 'All clear! No tasks here.'}
              </p>
              {view !== 'completed' && (
                <p className="text-zinc-300 dark:text-zinc-600 text-xs mt-1">Add a task above to get started.</p>
              )}
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task, index) => {
              const isFeatured = view !== 'completed' && task.tags?.includes('featured');
              
              return (
                <TaskItem
                  key={task.id}
                  task={task}
                  projects={projects}
                  isFeatured={isFeatured}
                  onToggle={() => toggleTaskStatus(task)}
                  onDelete={() => handleDeleteTask(task.id)}
                  onUpdate={(updates) => onUpdateTask(task.id, updates)}
                  onClick={() => setSelectedTaskId(task.id)}
                />
              );
            })}
          </AnimatePresence>
        </div>

        {/* Floating Add Task Center Bottom */}
        {view !== 'completed' && (
          <div className="mt-auto pt-10 pb-0 shrink-0 w-full z-10 sticky bottom-0 pointer-events-none -mx-4 px-4 sm:px-0 sm:mx-0">
            <div className="pointer-events-auto w-full mx-auto max-w-none sm:max-w-2xl -mb-4 sm:mb-0">
              <AddTaskInline
                onAdd={onAddTask}
                projects={projects}
                defaultProjectId={defaultProjectId}
              />
            </div>
          </div>
        )}
      </section>

      {/* Sidebar: Capture & Notes */}
      <aside className="w-[320px] border-l border-border-subtle dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-6 overflow-y-auto custom-scrollbar hidden xl:block">
        <h2 className="text-sm font-bold text-text-main dark:text-zinc-50 mb-4 tracking-tight flex items-center justify-between">
          <span>Quick Capture</span>
          <button
            type="button"
            onClick={() => setIsQuickNoteOpen(true)}
            className="text-zinc-400 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Plus size={16} />
          </button>
        </h2>
        <div className="space-y-3">
          {/* Inline note form */}
          <AnimatePresence>
            {isQuickNoteOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="p-3 border border-indigo-200 dark:border-indigo-900/40 rounded-xl bg-white dark:bg-zinc-900 space-y-2 shadow-sm"
              >
                <textarea
                  autoFocus
                  value={quickNoteInput}
                  onChange={(e) => setQuickNoteInput(e.target.value)}
                  placeholder="Write a quick note..."
                  className="w-full min-h-16 resize-none text-sm bg-transparent outline-none text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) createQuickNote();
                    if (e.key === 'Escape') { setIsQuickNoteOpen(false); setQuickNoteInput(''); }
                  }}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsQuickNoteOpen(false); setQuickNoteInput(''); }}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={createQuickNote}
                    disabled={!quickNoteInput.trim()}
                    className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-indigo-600 text-white disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {notes.length === 0 && !isQuickNoteOpen && (
            <div className="py-10 text-center text-zinc-400 dark:text-zinc-600 italic text-xs">
              No recent notes
            </div>
          )}

          {notes.slice(0, 8).map(note => (
            <NoteCardMini key={note.id} note={note} onDelete={onDeleteNote} />
          ))}

          {/* Quick note CTA */}
          <button
            type="button"
            onClick={() => setIsQuickNoteOpen(true)}
            className="w-full p-3 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] font-semibold text-zinc-400 dark:text-zinc-600 text-center cursor-pointer hover:bg-white dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
          >
            + Quick Note
          </button>
        </div>
      </aside>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            onClose={() => setSelectedTaskId(null)}
            onUpdate={onUpdateTask}
            onDelete={onDeleteTask}
            projects={projects}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// TASK ITEM
// ============================================
interface TaskItemProps {
  key?: React.Key;
  task: Task;
  projects: Project[];
  isFeatured?: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onClick: () => void;
}

const TaskItem = ({ task, projects, isFeatured, onToggle, onDelete, onUpdate, onClick }: TaskItemProps) => {
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
  const isHighPriority = task.priority === 'high';
  const isCompleted = task.status === 'completed';

  const toggleFeatured = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tags = task.tags || [];
    if (tags.includes('featured')) {
      onUpdate({ tags: tags.filter(t => t !== 'featured') });
    } else {
      onUpdate({ tags: [...tags, 'featured'] });
    }
  };

  // Fallback to relative due date or generic time for visual
  const timeStr = task.dueDate ? formatRelativeDate(task.dueDate) : "Anytime";

  if (isFeatured) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="group relative flex flex-col p-5 bg-zinc-100 dark:bg-[#1a1a1b] rounded-[22px] border border-transparent dark:border-[#262626]/50 cursor-pointer shadow-sm hover:shadow-md transition-shadow my-2"
        onClick={onClick}
      >
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] font-extrabold tracking-[0.15em] uppercase text-indigo-600 dark:text-blue-400">
            {project?.name || 'FEATURED TASK'}
          </span>
          <button onClick={toggleFeatured} className="text-zinc-400 hover:text-indigo-600 dark:hover:text-blue-500 transition-colors relative z-10" title="Remove Feature Status">
            {isCompleted ? <CheckCircle2 size={18} className="fill-blue-500 text-white" /> : <Star size={18} className="fill-blue-500 text-blue-500" />}
          </button>
        </div>
        <h3 className={cn("text-[20px] font-bold text-zinc-900 dark:text-white leading-[1.3] mb-8 pr-4", isCompleted && "line-through opacity-50")}>
          {task.title}
        </h3>
        <div className="flex justify-between items-end">
          <div className="flex -space-x-2">
            <div className="w-7 h-7 rounded-full bg-teal-500 border-2 border-zinc-100 dark:border-[#1c1c1c] flex items-center justify-center shrink-0 shadow-sm" />
            <div className="w-7 h-7 rounded-full bg-rose-500 border-2 border-zinc-100 dark:border-[#1c1c1c] flex items-center justify-center shrink-0 shadow-sm" />
          </div>
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 font-mono tracking-wide">{timeStr}</span>
        </div>
      </motion.div>
    );
  }

  // Normal Card
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative flex items-center gap-4 px-4 py-3.5 bg-white dark:bg-[#131415] rounded-2xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#1a1b1c] transition-all border border-zinc-100 dark:border-transparent my-0.5",
        isHighPriority && !isCompleted && "dark:border-l-[3px] dark:border-l-rose-500/80 border-l-[3px] border-l-rose-500"
      )}
      onClick={onClick}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="shrink-0 relative"
      >
        <div
          className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center transition-all',
             isCompleted
              ? 'bg-zinc-200 dark:bg-zinc-800'
              : 'border-2 border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-500'
          )}
        >
          {isCompleted && <CheckCircle2 size={13} className="text-zinc-500 dark:text-zinc-400" />}
          {!isCompleted && isHighPriority && <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />}
        </div>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <h3
          className={cn(
            'text-[15px] font-semibold truncate transition-all',
            isCompleted ? 'text-zinc-400 dark:text-zinc-600 line-through font-medium' : 'text-zinc-800 dark:text-white'
          )}
        >
          {task.title}
        </h3>
        <span className={cn("text-xs font-medium truncate", isHighPriority && !isCompleted ? "text-rose-500" : "text-zinc-500 dark:text-[#888]")}>
          {project?.name || 'Obsidian Flow'} {isHighPriority && !isCompleted ? '  High Priority' : ''}
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center shrink-0 pl-1">
        <span className="text-[11px] font-medium text-zinc-400 dark:text-[#666] font-mono sm:group-hover:opacity-0 transition-opacity">
          {timeStr === 'Anytime' ? '--:--' : timeStr}
        </span>
        <div className="flex sm:absolute sm:right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 items-center gap-0.5 transition-all bg-white dark:bg-[#131415] ml-2 sm:ml-0 sm:pl-2">
          <button
            onClick={toggleFeatured}
            className="p-1.5 text-zinc-400 hover:text-blue-500 transition-all rounded-md"
            title="Feature this task"
          >
            <Star size={16} className={task.tags?.includes('featured') ? "fill-blue-500 text-blue-500" : ""} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-zinc-400 hover:text-rose-500 transition-all rounded-md"
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// NOTE CARD (Full - for notes view)
// ============================================
interface NoteCardProps {
  key?: React.Key;
  note: Note;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

const NoteCard = ({ note, onUpdate, onDelete }: NoteCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(note.content);
  }, [note.content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = content.trim();
    if (trimmed && trimmed !== note.content) {
      onUpdate(note.id, trimmed);
    } else {
      setContent(note.content); // Revert
    }
    setIsEditing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-all relative group',
        !isEditing && 'cursor-pointer'
      )}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-20 resize-none text-[13px] bg-transparent outline-none text-zinc-800 dark:text-zinc-200 leading-relaxed"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
              if (e.key === 'Escape') { setContent(note.content); setIsEditing(false); }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400">Ctrl+Enter to save, Esc to cancel</span>
            <div className="flex gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); setContent(note.content); setIsEditing(false); }}
                className="px-2 py-1 text-[10px] font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleSave(); }}
                className="px-2.5 py-1 text-[10px] font-semibold rounded-md bg-indigo-600 text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="text-[13px] text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed whitespace-pre-wrap line-clamp-4">
            {note.content}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              {formatRelativeDate(note.createdAt)}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className="p-1 text-zinc-400 hover:text-indigo-500 transition-colors rounded"
              >
                <Pencil size={11} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 text-zinc-400 hover:text-rose-500 transition-colors rounded"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

// ============================================
// NOTE CARD MINI (for sidebar)
// ============================================
interface NoteCardMiniProps {
  key?: React.Key;
  note: Note;
  onDelete: (id: string) => void;
}

const NoteCardMini = ({ note, onDelete }: NoteCardMiniProps) => {
  return (
    <div className="p-3 bg-white dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800 rounded-lg text-[12px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed relative group">
      <div className="line-clamp-3 whitespace-pre-wrap">{note.content}</div>
      <div className="mt-2 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
        {formatRelativeDate(note.createdAt)}
      </div>
      <button
        onClick={() => onDelete(note.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-0.5 text-zinc-300 dark:text-zinc-600 hover:text-rose-500 transition-all"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
};
