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
        className="p-8 h-full overflow-y-auto custom-scrollbar"
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
      <section className="p-8 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-main dark:text-zinc-50 tracking-tight">{viewTitle}</h1>
            <div className="text-[13px] text-text-muted dark:text-zinc-500 font-medium mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="text-sm text-text-muted dark:text-zinc-500 font-semibold tabular-nums">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>

        {/* Inline Add Task */}
        {view !== 'completed' && (
          <AddTaskInline
            onAdd={onAddTask}
            projects={projects}
            defaultProjectId={defaultProjectId}
          />
        )}

        {/* Task List */}
        <div className="flex flex-col gap-1.5">
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
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                projects={projects}
                onToggle={() => toggleTaskStatus(task)}
                onDelete={() => handleDeleteTask(task.id)}
                onClick={() => setSelectedTaskId(task.id)}
              />
            ))}
          </AnimatePresence>
        </div>
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
  onToggle: () => void;
  onDelete: () => void;
  onClick: () => void;
}

const TaskItem = ({ task, projects, onToggle, onDelete, onClick }: TaskItemProps) => {
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
  const hasDueDate = !!task.dueDate;
  const overdue = hasDueDate && task.status !== 'completed' && isOverdue(task.dueDate!);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="group flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800/80 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-sm"
      onClick={onClick}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="shrink-0"
      >
        <div
          className={cn(
            'w-[18px] h-[18px] rounded-md border-2 transition-all flex items-center justify-center',
            task.status === 'completed'
              ? 'bg-indigo-600 border-indigo-600 text-white scale-100'
              : 'border-zinc-300 dark:border-zinc-600 hover:border-indigo-400 dark:hover:border-indigo-500'
          )}
        >
          {task.status === 'completed' && <CheckCircle2 size={11} strokeWidth={3} />}
        </div>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            'text-sm font-medium truncate transition-all text-zinc-800 dark:text-zinc-100',
            task.status === 'completed' && 'text-zinc-400 dark:text-zinc-500 line-through'
          )}
        >
          {task.title}
        </h3>

        {/* Meta line */}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {hasDueDate && task.status !== 'completed' && (
            <span className={cn(
              'text-[10px] font-semibold flex items-center gap-0.5',
              overdue ? 'text-rose-500' : 'text-zinc-400 dark:text-zinc-500'
            )}>
              <Calendar size={9} />
              {formatRelativeDate(task.dueDate!)}
            </span>
          )}
          {project && (
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: project.color }} />
              {project.name}
            </span>
          )}
          {task.tags && task.tags.length > 0 && task.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400">
              #{tag}
            </span>
          ))}
          {task.subtasks && task.subtasks.length > 0 && (
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
              {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} done
            </span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5 shrink-0">
        {task.priority === 'high' && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
            High
          </span>
        )}
        {task.priority === 'medium' && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            Med
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-300 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-400 transition-all rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20"
        >
          <Trash2 size={13} />
        </button>
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
