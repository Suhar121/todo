import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus, ExternalLink, MoreHorizontal, Pencil, Trash2, Calendar, CheckCircle2, Clock,
  X, FolderOpen, Link2, Sparkles, ArrowUpRight, Search, Filter, ChevronDown, Grid3X3,
  List, ArrowUpDown, CheckSquare, Square, Archive, Eye, EyeOff, Tag, Palette,
  SortAsc, SortDesc, MoreVertical, LayoutGrid, Loader2, AlertCircle, RefreshCw,
  Copy, Download, Upload, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Project, Task } from '../types';

interface AllProjectsPageProps {
  projects: Project[];
  tasks: Task[];
  onAddProject: (name: string) => void;
  onUpdateProject: (id: string, data: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
}

type ProjectStatus = 'active' | 'planning' | 'on_hold' | 'completed';

const statusConfig: Record<ProjectStatus, { label: string; color: string; bgColor: string; borderColor: string; dotColor: string }> = {
  active: { label: 'Active', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50/80 dark:bg-emerald-950/30', borderColor: 'border-emerald-200/60 dark:border-emerald-800/50', dotColor: 'bg-emerald-500' },
  planning: { label: 'Planning', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50/80 dark:bg-amber-950/30', borderColor: 'border-amber-200/60 dark:border-amber-800/50', dotColor: 'bg-amber-500' },
  on_hold: { label: 'On Hold', color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-50/80 dark:bg-orange-950/30', borderColor: 'border-orange-200/60 dark:border-orange-800/50', dotColor: 'bg-orange-500' },
  completed: { label: 'Completed', color: 'text-violet-700 dark:text-violet-400', bgColor: 'bg-violet-50/80 dark:bg-violet-950/30', borderColor: 'border-violet-200/60 dark:border-violet-800/50', dotColor: 'bg-violet-500' },
};

const PROJECT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#78716c', '#71717a', '#a1a1aa',
];

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A-Z)', icon: SortAsc },
  { value: 'name-desc', label: 'Name (Z-A)', icon: SortDesc },
  { value: 'date-desc', label: 'Newest First', icon: Calendar },
  { value: 'date-asc', label: 'Oldest First', icon: Calendar },
  { value: 'status', label: 'Status', icon: Sparkles },
  { value: 'progress', label: 'Progress', icon: ArrowUpDown },
] as const;


interface ProjectCardProps {
  project: Project;
  tasks: Task[];
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, data: Partial<Project>) => void;
  onDelete: (id: string) => void;
  onOpenDetail: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, tasks, isSelected, onSelect, onUpdate, onDelete, onOpenDetail }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
  const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;
  const status = project.status || 'active';
  const statusCfg = statusConfig[status];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker]);

  const handleSaveName = () => {
    if (editName.trim() && editName !== project.name) {
      onUpdate(project.id, { name: editName.trim() });
    }
    setIsEditingName(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowColorPicker(false); }}
      onClick={() => onOpenDetail(project)}
      className={cn(
        'group relative bg-white dark:bg-zinc-900/80 backdrop-blur-sm border-2 rounded-2xl p-5 cursor-pointer transition-all duration-200',
        isSelected ? 'border-indigo-500 dark:border-indigo-400 shadow-lg shadow-indigo-500/10' : 'border-transparent hover:border-zinc-200 dark:hover:border-zinc-700',
        isHovered && !isSelected && 'shadow-lg shadow-zinc-200/50 dark:shadow-black/20 -translate-y-0.5'
      )}
    >
      <div className={cn('absolute top-3 left-3 transition-opacity', isHovered || isSelected ? 'opacity-100' : 'opacity-0')}>
        <button onClick={(e) => { e.stopPropagation(); onSelect(project.id); }} className={cn('p-1 rounded-md transition-colors', isSelected ? 'text-indigo-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300')}>
          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
        </button>
      </div>

      <div className='flex items-start justify-between mb-4'>
        <div className='flex items-center gap-3 pl-6'>
          <div ref={colorPickerRef} className='relative'>
            <button onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }} className='w-5 h-5 rounded-full ring-2 ring-white dark:ring-zinc-950 shadow-sm hover:scale-110 transition-transform' style={{ backgroundColor: project.color }} />
            <AnimatePresence>
              {showColorPicker && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className='absolute left-0 top-full z-50 mt-2 p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl'>
                  <div className='grid grid-cols-5 gap-1.5'>
                    {PROJECT_COLORS.map((color) => (
                      <button key={color} onClick={(e) => { e.stopPropagation(); onUpdate(project.id, { color }); setShowColorPicker(false); }} className={cn('w-6 h-6 rounded-full hover:scale-110 transition-transform', project.color === color && 'ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-800')} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={(e) => { e.stopPropagation(); const statuses: ProjectStatus[] = ['active', 'planning', 'on_hold', 'completed']; const idx = statuses.indexOf(status); onUpdate(project.id, { status: statuses[(idx + 1) % 4] }); }} className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border transition-all hover:opacity-80', statusCfg.bgColor, statusCfg.borderColor, statusCfg.color)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dotColor)} />
            {statusCfg.label}
          </button>
        </div>
        <div className='relative'>
          <button onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }} className={cn('p-1.5 rounded-lg transition-all', isHovered ? 'opacity-100 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300' : 'opacity-0 text-zinc-400')}>
            <MoreVertical size={16} />
          </button>
          <AnimatePresence>
            {showActions && (
              <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className='absolute right-0 top-full z-50 mt-1 py-1.5 w-40 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl'>
                <button onClick={(e) => { e.stopPropagation(); setIsEditingName(true); setShowActions(false); }} className='w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors'>
                  <Pencil size={14} /> Rename
                </button>
                <button onClick={(e) => { e.stopPropagation(); onOpenDetail(project); setShowActions(false); }} className='w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors'>
                  <LayoutGrid size={14} /> View Details
                </button>
                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(project.id); setShowActions(false); }} className='w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors'>
                  <Copy size={14} /> Copy ID
                </button>
                <div className='h-px bg-zinc-100 dark:bg-zinc-700 my-1' />
                <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this project?')) onDelete(project.id); setShowActions(false); }} className='w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors'>
                  <Trash2 size={14} /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className='mb-3 pl-6'>
        {isEditingName ? (
          <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={handleSaveName} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setIsEditingName(false); setEditName(project.name); } }} onClick={(e) => e.stopPropagation()} className='w-full bg-transparent outline-none border-b-2 border-indigo-400 text-zinc-900 dark:text-white font-bold text-xl pb-0.5' />
        ) : (
          <h3 className='text-xl font-bold text-zinc-900 dark:text-white tracking-tight'>{project.name}</h3>
        )}
      </div>

      {project.link && (
        <div className='mb-4 pl-6'>
          <a href={project.link} target='_blank' rel='noopener noreferrer' onClick={(e) => e.stopPropagation()} className='inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline group/link'>
            <Link2 size={12} className='shrink-0' />
            <span className='truncate max-w-[200px]'>{project.link.replace(/^https?:\/\//, '')}</span>
            <ArrowUpRight size={11} className='opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0' />
          </a>
        </div>
      )}

      <div className='space-y-2 mb-4 pl-6'>
        <div className='flex items-center justify-between'>
          <span className='text-[11px] font-medium text-zinc-500 dark:text-zinc-400'>{completedTasks} of {projectTasks.length} tasks</span>
          <span className='text-[11px] font-bold text-zinc-600 dark:text-zinc-300'>{progress}%</span>
        </div>
        <div className='h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden'>
          <motion.div initial={{ width: 0 }} animate={{ width: progress + '%' }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className='h-full rounded-full' style={{ backgroundColor: project.color }} />
        </div>
      </div>

      <div className='pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between'>
        <span className='text-[10px] font-medium text-zinc-400 dark:text-zinc-500'>
          {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        {projectTasks.length > 0 && (
          <span className='text-[10px] font-medium text-zinc-400 dark:text-zinc-500'>
            {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </motion.div>
  );
};


interface ProjectDetailModalProps {
  project: Project;
  tasks: Task[];
  onUpdate: (id: string, data: Partial<Project>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, tasks, onUpdate, onDelete, onClose }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'tasks'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editLink, setEditLink] = useState(project.link || '');
  const [editStatus, setEditStatus] = useState<ProjectStatus>(project.status as ProjectStatus || 'active');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
  const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;
  const statusCfg = statusConfig[editStatus];

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleEscape); document.body.style.overflow = ''; };
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker]);

  const handleSave = () => {
    onUpdate(project.id, { name: editName, link: editLink || undefined, status: editStatus });
    setIsEditing(false);
  };

  const pendingTasks = projectTasks.filter(t => t.status !== 'completed');
  const completedTasksList = projectTasks.filter(t => t.status === 'completed');

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6'>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className='relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl'>
          <div className='sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div ref={colorPickerRef} className='relative'>
                <button onClick={() => setShowColorPicker(!showColorPicker)} className='w-6 h-6 rounded-full ring-2 ring-white dark:ring-zinc-950 shadow-sm hover:scale-110 transition-transform' style={{ backgroundColor: project.color }} />
                <AnimatePresence>
                  {showColorPicker && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className='absolute left-0 top-full z-50 mt-2 p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl'>
                      <div className='grid grid-cols-5 gap-1.5'>
                        {PROJECT_COLORS.map((color) => (
                          <button key={color} onClick={() => { onUpdate(project.id, { color }); setShowColorPicker(false); }} className={cn('w-6 h-6 rounded-full hover:scale-110 transition-transform', project.color === color && 'ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-800')} style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {isEditing ? (
                <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} className='text-xl font-bold text-zinc-900 dark:text-white bg-transparent outline-none border-b-2 border-indigo-400' />
              ) : (
                <h2 className='text-xl font-bold text-zinc-900 dark:text-white'>{project.name}</h2>
              )}
            </div>
            <button onClick={onClose} className='p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors'><X size={20} /></button>
          </div>

          <div className='flex border-b border-zinc-200 dark:border-zinc-800'>
            <button onClick={() => setActiveTab('details')} className={cn('flex-1 px-4 py-3 text-sm font-semibold transition-colors', activeTab === 'details' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300')}>Details</button>
            <button onClick={() => setActiveTab('tasks')} className={cn('flex-1 px-4 py-3 text-sm font-semibold transition-colors', activeTab === 'tasks' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300')}>Tasks ({projectTasks.length})</button>
          </div>

          <div className='p-6'>
            {activeTab === 'details' ? (
              <div className='space-y-6'>
                <div>
                  <label className='block text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2'>Status</label>
                  {isEditing ? (
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as ProjectStatus)} className='w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm'>
                      {(Object.keys(statusConfig) as ProjectStatus[]).map((s) => (<option key={s} value={s}>{statusConfig[s].label}</option>))}
                    </select>
                  ) : (
                    <button onClick={() => setIsEditing(true)} className={cn('inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border', statusCfg.bgColor, statusCfg.borderColor, statusCfg.color)}>
                      <span className={cn('w-2 h-2 rounded-full', statusCfg.dotColor)} />
                      {statusCfg.label}
                    </button>
                  )}
                </div>

                <div>
                  <label className='block text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2'>Project Link</label>
                  {isEditing ? (
                    <input value={editLink} onChange={(e) => setEditLink(e.target.value)} placeholder='https://github.com/...' className='w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm' />
                  ) : (
                    project.link ? (
                      <a href={project.link} target='_blank' rel='noopener noreferrer' className='inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline'>
                        <Link2 size={14} /> {project.link}
                      </a>
                    ) : (
                      <button onClick={() => setIsEditing(true)} className='text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'>Add project link</button>
                    )
                  )}
                </div>

                <div>
                  <label className='block text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2'>Progress</label>
                  <div className='flex items-center gap-4'>
                    <div className='flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden'>
                      <motion.div initial={{ width: 0 }} animate={{ width: progress + '%' }} className='h-full rounded-full' style={{ backgroundColor: project.color }} />
                    </div>
                    <span className='text-sm font-bold text-zinc-600 dark:text-zinc-300'>{progress}%</span>
                  </div>
                  <p className='text-xs text-zinc-500 dark:text-zinc-400 mt-1'>{completedTasks} of {projectTasks.length} tasks completed</p>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2'>Created</label>
                    <p className='text-sm text-zinc-600 dark:text-zinc-300'>{new Date(project.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <label className='block text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2'>Project ID</label>
                    <p className='text-xs text-zinc-500 dark:text-zinc-400 font-mono'>{project.id}</p>
                  </div>
                </div>

                <div className='flex items-center gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800'>
                  {isEditing ? (
                    <>
                      <button onClick={handleSave} className='px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors'>Save Changes</button>
                      <button onClick={() => { setIsEditing(false); setEditName(project.name); setEditLink(project.link || ''); setEditStatus(project.status as ProjectStatus || 'active'); }} className='px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors'>Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => setIsEditing(true)} className='px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-semibold hover:opacity-90 transition-colors'>Edit Project</button>
                  )}
                  <button onClick={() => { if (confirm('Delete this project?')) { onDelete(project.id); onClose(); } }} className='px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-sm font-semibold transition-colors ml-auto'>Delete Project</button>
                </div>
              </div>
            ) : (
              <div className='space-y-4'>
                {projectTasks.length === 0 ? (
                  <div className='text-center py-12'>
                    <p className='text-zinc-500 dark:text-zinc-400'>No tasks in this project</p>
                  </div>
                ) : (
                  <>
                    {pendingTasks.length > 0 && (
                      <div>
                        <h4 className='text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3'>Pending ({pendingTasks.length})</h4>
                        <div className='space-y-2'>
                          {pendingTasks.map((task) => (
                            <div key={task.id} className='flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg'>
                              <div className='w-2 h-2 rounded-full' style={{ backgroundColor: project.color }} />
                              <span className='text-sm text-zinc-700 dark:text-zinc-300 flex-1'>{task.title}</span>
                              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', task.priority === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : task.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400')}>{task.priority}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {completedTasksList.length > 0 && (
                      <div>
                        <h4 className='text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3'>Completed ({completedTasksList.length})</h4>
                        <div className='space-y-2'>
                          {completedTasksList.map((task) => (
                            <div key={task.id} className='flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg opacity-60'>
                              <CheckCircle2 size={14} className='text-emerald-500' />
                              <span className='text-sm text-zinc-500 dark:text-zinc-400 line-through flex-1'>{task.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};


export const AllProjectsPage: React.FC<AllProjectsPageProps> = ({ projects, tasks, onAddProject, onUpdateProject, onDeleteProject }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<typeof SORT_OPTIONS[number]['value']>('date-desc');
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<ProjectStatus | null>(null);
  const newProjectInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isAdding && newProjectInputRef.current) newProjectInputRef.current.focus(); }, [isAdding]);

  const filteredProjects = useMemo(() => {
    let filtered = [...projects];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') filtered = filtered.filter(p => (p.status || 'active') === statusFilter);
    switch (sortBy) {
      case 'name-asc': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': filtered.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'date-asc': filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case 'date-desc': filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case 'status': filtered.sort((a, b) => ((a.status || 'active') > (b.status || 'active') ? 1 : -1)); break;
      default: break;
    }
    return filtered;
  }, [projects, searchQuery, statusFilter, sortBy]);

  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter(p => (p.status || 'active') === 'active').length,
    planning: projects.filter(p => (p.status || 'active') === 'planning').length,
    onHold: projects.filter(p => (p.status || 'active') === 'on_hold').length,
    completed: projects.filter(p => (p.status || 'active') === 'completed').length,
  }), [projects]);

  const handleSelectAll = () => {
    if (selectedProjects.size === filteredProjects.length) setSelectedProjects(new Set());
    else setSelectedProjects(new Set(filteredProjects.map(p => p.id)));
  };

  const handleSelect = (id: string) => {
    const newSet = new Set(selectedProjects);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedProjects(newSet);
  };

  const handleBulkDelete = () => {
    if (confirm('Delete ' + selectedProjects.size + ' project(s)?')) {
      selectedProjects.forEach(id => onDeleteProject(id));
      setSelectedProjects(new Set());
    }
  };

  const handleBulkStatus = (status: ProjectStatus) => {
    selectedProjects.forEach(id => onUpdateProject(id, { status }));
    setSelectedProjects(new Set());
    setBulkStatus(null);
  };

  const handleSubmitNew = () => {
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim());
      setNewProjectName('');
      setIsAdding(false);
    }
  };

  const sortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort';

  return (
    <div className='min-h-screen bg-zinc-50/50 dark:bg-[#0a0a0b]'>
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-100/30 dark:from-indigo-950/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3' />
        <div className='absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-violet-100/30 dark:from-violet-950/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/3' />
      </div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 py-10'>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
          <div className='flex items-start justify-between mb-6'>
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <div className='w-8 h-8 rounded-xl bg-gradient-to-br from-zinc-900 dark:from-white to-zinc-700 dark:to-zinc-500 flex items-center justify-center'>
                  <FolderOpen size={16} className='text-white dark:text-zinc-900' strokeWidth={2} />
                </div>
                <span className='text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500'>Workspace</span>
              </div>
              <h1 className='text-4xl font-bold tracking-tight text-zinc-900 dark:text-white'>All Projects</h1>
              <p className='text-sm text-zinc-500 dark:text-zinc-400 mt-1.5'>{stats.total} project{stats.total !== 1 ? 's' : ''} in your workspace</p>
            </div>
            <button onClick={() => setIsAdding(true)} className='flex items-center gap-2.5 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all'>
              <Plus size={18} strokeWidth={2.5} /> New Project
            </button>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-5 gap-3 mb-6'>
            <button onClick={() => setStatusFilter('all')} className={cn('p-3 rounded-xl border transition-all text-left', statusFilter === 'all' ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white' : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700')}>
              <p className={cn('text-2xl font-bold', statusFilter === 'all' ? 'text-white dark:text-zinc-900' : 'text-zinc-900 dark:text-white')}>{stats.total}</p>
              <p className={cn('text-[10px] font-semibold uppercase tracking-wider', statusFilter === 'all' ? 'text-zinc-300 dark:text-zinc-500' : 'text-zinc-500 dark:text-zinc-400')}>All</p>
            </button>
            <button onClick={() => setStatusFilter('active')} className={cn('p-3 rounded-xl border transition-all text-left', statusFilter === 'active' ? 'bg-emerald-600 border-emerald-600' : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700')}>
              <p className={cn('text-2xl font-bold', statusFilter === 'active' ? 'text-white' : 'text-zinc-900 dark:text-white')}>{stats.active}</p>
              <p className={cn('text-[10px] font-semibold uppercase tracking-wider', statusFilter === 'active' ? 'text-emerald-200' : 'text-zinc-500 dark:text-zinc-400')}>Active</p>
            </button>
            <button onClick={() => setStatusFilter('planning')} className={cn('p-3 rounded-xl border transition-all text-left', statusFilter === 'planning' ? 'bg-amber-600 border-amber-600' : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700')}>
              <p className={cn('text-2xl font-bold', statusFilter === 'planning' ? 'text-white' : 'text-zinc-900 dark:text-white')}>{stats.planning}</p>
              <p className={cn('text-[10px] font-semibold uppercase tracking-wider', statusFilter === 'planning' ? 'text-amber-200' : 'text-zinc-500 dark:text-zinc-400')}>Planning</p>
            </button>
            <button onClick={() => setStatusFilter('on_hold')} className={cn('p-3 rounded-xl border transition-all text-left', statusFilter === 'on_hold' ? 'bg-orange-600 border-orange-600' : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700')}>
              <p className={cn('text-2xl font-bold', statusFilter === 'on_hold' ? 'text-white' : 'text-zinc-900 dark:text-white')}>{stats.onHold}</p>
              <p className={cn('text-[10px] font-semibold uppercase tracking-wider', statusFilter === 'on_hold' ? 'text-orange-200' : 'text-zinc-500 dark:text-zinc-400')}>On Hold</p>
            </button>
            <button onClick={() => setStatusFilter('completed')} className={cn('p-3 rounded-xl border transition-all text-left', statusFilter === 'completed' ? 'bg-violet-600 border-violet-600' : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700')}>
              <p className={cn('text-2xl font-bold', statusFilter === 'completed' ? 'text-white' : 'text-zinc-900 dark:text-white')}>{stats.completed}</p>
              <p className={cn('text-[10px] font-semibold uppercase tracking-wider', statusFilter === 'completed' ? 'text-violet-200' : 'text-zinc-500 dark:text-zinc-400')}>Completed</p>
            </button>
          </div>

          <div className='flex flex-col sm:flex-row gap-3'>
            <div className='relative flex-1'>
              <Search size={18} className='absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400' />
              <input type='text' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder='Search projects...' className='w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all' />
            </div>
            <div className='flex items-center gap-2'>
              <div className='relative'>
                <button onClick={() => setShowSortMenu(!showSortMenu)} className='flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors'>
                  <ArrowUpDown size={16} /> {sortLabel} <ChevronDown size={14} />
                </button>
                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className='absolute right-0 top-full z-50 mt-2 py-1.5 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl'>
                      {SORT_OPTIONS.map((opt) => (
                        <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }} className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors', sortBy === opt.value ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50')}>
                          <opt.icon size={14} /> {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className='flex items-center gap-1 p-1 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl'>
                <button onClick={() => setViewMode('grid')} className={cn('p-2 rounded-lg transition-all', viewMode === 'grid' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300')}><Grid3X3 size={16} /></button>
                <button onClick={() => setViewMode('list')} className={cn('p-2 rounded-lg transition-all', viewMode === 'list' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300')}><List size={16} /></button>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {selectedProjects.size > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className='mb-6 p-4 bg-zinc-900 dark:bg-zinc-800 rounded-xl flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <span className='text-sm font-semibold text-white'>{selectedProjects.size} selected</span>
                <button onClick={handleSelectAll} className='text-xs text-zinc-400 hover:text-white transition-colors'>{selectedProjects.size === filteredProjects.length ? 'Deselect all' : 'Select all'}</button>
              </div>
              <div className='flex items-center gap-2'>
                <select value={bulkStatus || ''} onChange={(e) => { if (e.target.value) handleBulkStatus(e.target.value as ProjectStatus); }} className='px-3 py-1.5 bg-zinc-800 dark:bg-zinc-700 border border-zinc-700 dark:border-zinc-600 rounded-lg text-sm text-white'>
                  <option value=''>Change status...</option>
                  {(Object.keys(statusConfig) as ProjectStatus[]).map((s) => (<option key={s} value={s}>{statusConfig[s].label}</option>))}
                </select>
                <button onClick={handleBulkDelete} className='flex items-center gap-2 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-semibold transition-colors'>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAdding && (
            <motion.div initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} className='mb-8 p-5 bg-white dark:bg-zinc-900/90 border border-zinc-300/60 dark:border-zinc-700/60 rounded-2xl shadow-xl'>
              <div className='flex items-center gap-4'>
                <div className='w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500' />
                <input ref={newProjectInputRef} value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitNew(); if (e.key === 'Escape') { setIsAdding(false); setNewProjectName(''); } }} placeholder='Project name...' className='flex-1 bg-transparent outline-none text-zinc-900 dark:text-white font-semibold text-lg placeholder:text-zinc-300 dark:placeholder:text-zinc-600' />
                <button onClick={handleSubmitNew} className='px-5 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity'>Create</button>
                <button onClick={() => { setIsAdding(false); setNewProjectName(''); }} className='p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors'><X size={18} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredProjects.length === 0 && !isAdding ? (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className='text-center py-24'>
            <div className='w-20 h-20 mx-auto mb-6 bg-zinc-100 dark:bg-zinc-800/80 rounded-3xl flex items-center justify-center'><FolderOpen size={32} className='text-zinc-300 dark:text-zinc-600' /></div>
            <h3 className='text-xl font-semibold text-zinc-900 dark:text-white mb-2'>No projects found</h3>
            <p className='text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto'>
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filter criteria.' : 'Create your first project to get started.'}
            </p>
            {searchQuery || statusFilter !== 'all' ? (
              <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className='inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity'>Clear Filters</button>
            ) : (
              <button onClick={() => setIsAdding(true)} className='inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity'><Plus size={16} /> Create Project</button>
            )}
          </motion.div>
        ) : (
          <motion.div layout className={cn('grid gap-4', viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}>
            <AnimatePresence mode='popLayout'>
              {filteredProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} tasks={tasks} isSelected={selectedProjects.has(project.id)} onSelect={handleSelect} onUpdate={onUpdateProject} onDelete={onDeleteProject} onOpenDetail={setDetailProject} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
        <div className='h-20' />
      </div>

      <AnimatePresence>
        {detailProject && <ProjectDetailModal project={detailProject} tasks={tasks} onUpdate={onUpdateProject} onDelete={onDeleteProject} onClose={() => setDetailProject(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default AllProjectsPage;
