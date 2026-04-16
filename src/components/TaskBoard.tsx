import React, { useState } from 'react';
import { 
  Task, 
  Project, 
  Note, 
  Priority, 
  Status 
} from '../types';
import { User } from 'firebase/auth';
import { 
  updateDoc, 
  deleteDoc, 
  doc, 
  collection,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Trash2, 
  Tag, 
  Flag,
  ChevronRight,
  MoreVertical,
  Plus
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence, Reorder } from 'motion/react';

interface TaskBoardProps {
  view: string;
  tasks: Task[];
  notes: Note[];
  projects: Project[];
  user: User;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ 
  view, 
  tasks, 
  notes, 
  projects,
  user 
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  const toggleTaskStatus = async (task: Task) => {
    const newStatus: Status = task.status === 'completed' ? 'todo' : 'completed';
    await updateDoc(doc(db, 'tasks', task.id), { status: newStatus, updatedAt: new Date().toISOString() });
  };

  const deleteTask = async (id: string) => {
    if (confirm('Delete this task?')) {
      await deleteDoc(doc(db, 'tasks', id));
    }
  };

  if (view === 'notes') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 h-full overflow-y-auto custom-scrollbar"
      >
        <h1 className="text-2xl font-bold text-text-main dark:text-zinc-50 mb-8 tracking-tight">All Ideas & Notes</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.length === 0 && (
            <div className="col-span-full py-20 text-center text-text-muted dark:text-zinc-600 italic text-sm">
              No notes or ideas found.
            </div>
          )}
          {notes.map(note => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      </motion.div>
    );
  }

  const viewTitle = view.startsWith('project-') 
    ? projects.find(p => p.id === view.replace('project-', ''))?.name || 'Project'
    : view.charAt(0).toUpperCase() + view.slice(1);

  return (
    <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_320px] h-full overflow-hidden">
      <section className="task-view p-8 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-main dark:text-zinc-50 tracking-tight">{viewTitle}</h1>
            <div className="text-[13px] text-text-muted dark:text-zinc-500 font-medium mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="text-[14px] text-text-muted dark:text-zinc-500 font-semibold">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {filteredTasks.length === 0 && (
            <div className="py-20 text-center text-text-muted dark:text-zinc-600 italic text-sm">
               No tasks found.
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onToggle={() => toggleTaskStatus(task)}
                onDelete={() => deleteTask(task.id)}
                onClick={() => setSelectedTask(task)}
              />
            ))}
          </AnimatePresence>
        </div>
      </section>

      <aside className="idea-sidebar w-[320px] border-l border-border-subtle bg-slate-50/50 dark:bg-zinc-900/50 p-6 overflow-y-auto custom-scrollbar hidden xl:block">
        <h2 className="text-base font-bold text-text-main dark:text-zinc-50 mb-4 tracking-tight flex items-center justify-between">
          <span>Capture & Notes</span>
          <Plus size={16} className="text-text-muted cursor-pointer hover:text-indigo-600 transition-colors" />
        </h2>
        <div className="space-y-4">
          {notes.length === 0 && (
            <div className="py-10 text-center text-text-muted dark:text-zinc-600 italic text-xs">
              No recent ideas.
            </div>
          )}
          {notes.slice(0, 10).map(note => (
            <NoteCard key={note.id} note={note} />
          ))}
          <div className="p-4 border border-dashed border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-semibold text-text-muted dark:text-zinc-500 text-center cursor-pointer hover:bg-white dark:hover:bg-zinc-800 transition-all">
            + Quick Note (⌥N)
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {selectedTask && (
          <TaskDetail 
            task={selectedTask} 
            onClose={() => setSelectedTask(null)} 
            projects={projects}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface TaskItemProps {
  key?: any;
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onClick: () => void;
}

const TaskItem = ({ task, onToggle, onDelete, onClick }: TaskItemProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="group flex items-center gap-4 px-4 py-3 bg-white dark:bg-zinc-900 border border-border-subtle dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-600 transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
      onClick={onClick}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="shrink-0"
      >
        <div className={cn(
          "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center",
          task.status === 'completed' 
            ? "bg-indigo-600 border-indigo-600 text-white" 
            : "border-slate-200 dark:border-zinc-700"
        )}>
           {task.status === 'completed' && <CheckCircle2 size={12} strokeWidth={3} />}
        </div>
      </button>

      <div className="flex-1 min-w-0">
        <h3 className={cn(
          "text-sm font-medium truncate transition-all text-text-main dark:text-zinc-100",
          task.status === 'completed' && "text-text-muted dark:text-zinc-500 line-through"
        )}>
          {task.title}
        </h3>
      </div>

      <div className="flex items-center gap-2">
        {task.priority !== 'low' && (
          <span className={cn(
            "tag px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
            task.priority === 'high' ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
          )}>
            {task.priority}
          </span>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
};

interface NoteCardProps {
  key?: any;
  note: Note;
}

const NoteCard = ({ note }: NoteCardProps) => {
  const deleteNote = async () => {
    if (!confirm('Delete this note?')) return;
    await deleteDoc(doc(db, 'notes', note.id));
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-white dark:bg-zinc-900 border border-border-subtle dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-shadow relative group"
    >
      <div className="text-[13px] text-text-main dark:text-zinc-300 font-medium leading-relaxed whitespace-pre-wrap truncate line-clamp-3">
        {note.content}
      </div>
      <div className="mt-3 text-[10px] font-bold text-text-muted dark:text-zinc-500 uppercase tracking-widest">
        {formatDate(note.createdAt)}
      </div>
      <button 
        onClick={deleteNote}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all"
      >
        <Trash2 size={12} />
      </button>
    </motion.div>
  );
};


const TaskDetail = ({ task, onClose, projects }: { task: Task, onClose: () => void, projects: Project[] }) => {
  const [newSubtask, setNewSubtask] = useState('');

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    const sub = { id: Math.random().toString(36).substr(2, 9), title: newSubtask, completed: false };
    await updateDoc(doc(db, 'tasks', task.id), {
      subtasks: [...task.subtasks, sub],
      updatedAt: new Date().toISOString()
    });
    setNewSubtask('');
  };

  const toggleSubtask = async (id: string) => {
    const newSubtasks = task.subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
    await updateDoc(doc(db, 'tasks', task.id), { subtasks: newSubtasks });
  };

  const moveTaskToProject = async (projectId: string) => {
    await updateDoc(doc(db, 'tasks', task.id), { projectId });
  };

  return (
     <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-950/20 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-border-subtle dark:border-zinc-800 rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-start mb-8">
            <h2 className="text-2xl font-bold tracking-tight pr-8">{task.title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">✕</button>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Due Date</label>
                <div className="text-sm font-medium">{task.dueDate ? formatDate(task.dueDate) : 'None'}</div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Project</label>
                <select 
                  className="w-full bg-transparent text-sm font-medium outline-none cursor-pointer"
                  value={task.projectId || ''}
                  onChange={(e) => moveTaskToProject(e.target.value)}
                >
                  <option value="">Inbox</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Subtasks</label>
              <div className="space-y-2">
                {task.subtasks.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
                    <button onClick={() => toggleSubtask(s.id)}>
                      {s.completed ? <CheckCircle2 size={18} className="text-zinc-900 dark:text-white" /> : <Circle size={18} className="text-zinc-300" />}
                    </button>
                    <span className={cn("text-sm transition-all", s.completed && "text-zinc-400 line-through")}>{s.title}</span>
                  </div>
                ))}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <Plus size={18} className="text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Add subtask..."
                    className="flex-1 bg-transparent border-none outline-none text-sm"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
     </div>
  );
};
