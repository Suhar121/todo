import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  X,
  FolderOpen,
  Link2,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Project, Task } from '../types';

interface ProjectsPageProps {
  projects: Project[];
  tasks: Task[];
  onAddProject: (name: string) => void;
  onUpdateProject: (id: string, data: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
}

type ProjectStatus = 'active' | 'planning' | 'on_hold' | 'completed';

const statusConfig: Record<ProjectStatus, { label: string; color: string; bgColor: string; borderColor: string; dotColor: string }> = {
  active: {
    label: 'Active',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200/60 dark:border-emerald-800/50',
    dotColor: 'bg-emerald-500',
  },
  planning: {
    label: 'Planning',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50/80 dark:bg-amber-950/30',
    borderColor: 'border-amber-200/60 dark:border-amber-800/50',
    dotColor: 'bg-amber-500',
  },
  on_hold: {
    label: 'On Hold',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-50/80 dark:bg-orange-950/30',
    borderColor: 'border-orange-200/60 dark:border-orange-800/50',
    dotColor: 'bg-orange-500',
  },
  completed: {
    label: 'Completed',
    color: 'text-violet-700 dark:text-violet-400',
    bgColor: 'bg-violet-50/80 dark:bg-violet-950/30',
    borderColor: 'border-violet-200/60 dark:border-violet-800/50',
    dotColor: 'bg-violet-500',
  },
};

const TOTAL_PROJECTS = 20;

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  tasks,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [newLink, setNewLink] = useState('');
  const [editingStatus, setEditingStatus] = useState<ProjectStatus | null>(null);
  const [newStatus, setNewStatus] = useState<ProjectStatus>('active');
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const newProjectInputRef = useRef<HTMLInputElement>(null);
  const editProjectInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAdding && newProjectInputRef.current) {
      newProjectInputRef.current.focus();
    }
  }, [isAdding]);

  useEffect(() => {
    if (editingId && editProjectInputRef.current) {
      editProjectInputRef.current.focus();
      editProjectInputRef.current.select();
    }
  }, [editingId]);

  // Close context menu on outside click — use ref so stable across renders
  useEffect(() => {
    if (!contextMenuId) return;
    const handler = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [contextMenuId]);

  const getProjectStatus = (projectId: string): ProjectStatus => {
    const project = projects.find((p: Project) => p.id === projectId);
    return project?.status || 'active';
  };

  const getProjectLink = (projectId: string): string => {
    const project = projects.find((p: Project) => p.id === projectId);
    return project?.link || '';
  };

  const getProjectTasks = (projectId: string) => {
    return tasks.filter((t: Task) => t.projectId === projectId);
  };

  const getProjectProgress = (projectId: string) => {
    const projectTasks = getProjectTasks(projectId);
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter((t: Task) => t.status === 'completed').length;
    return Math.round((completed / projectTasks.length) * 100);
  };

  const getActiveProjects = () => projects.filter((p: Project) => getProjectStatus(p.id) === 'active').length;
  const getCompletedProjects = () => projects.filter((p: Project) => getProjectStatus(p.id) === 'completed').length;
  const getTotalTasks = () => tasks.filter((t: Task) => t.status !== 'completed').length;

  const handleSubmitNew = () => {
    const name = newProjectName.trim();
    if (name) {
      onAddProject(name);
    }
    setNewProjectName('');
    setIsAdding(false);
  };

  const handleSaveName = (id: string) => {
    const name = editingName.trim();
    if (name) {
      onUpdateProject(id, { name });
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveLink = (id: string) => {
    onUpdateProject(id, { link: newLink });
    setEditingLink(null);
    setNewLink('');
  };

  const handleSaveStatus = (id: string) => {
    onUpdateProject(id, { status: newStatus });
    setEditingStatus(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-[#0a0a0b]">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-100/30 dark:from-indigo-950/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-violet-100/30 dark:from-violet-950/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-zinc-900 dark:from-white to-zinc-700 dark:to-zinc-500 flex items-center justify-center">
                  <FolderOpen size={16} className="text-white dark:text-zinc-900" strokeWidth={2} />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                  Workspace
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Projects
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
                {projects.length === 0
                  ? 'No projects yet. Create your first project below.'
                  : `${projects.length} project${projects.length !== 1 ? 's' : ''} across your workspace`}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2.5 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-semibold text-sm shadow-lg shadow-zinc-900/10 dark:shadow-white/10 hover:shadow-xl hover:shadow-zinc-900/15 dark:hover:shadow-white/15 transition-all"
            >
              <Plus size={18} strokeWidth={2.5} />
              New Project
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10"
        >
          {[
            { label: 'Total Projects', value: projects.length, icon: FolderOpen, accent: 'text-indigo-600 dark:text-indigo-400' },
            { label: 'Active', value: getActiveProjects(), icon: Clock, accent: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Completed', value: getCompletedProjects(), icon: CheckCircle2, accent: 'text-violet-600 dark:text-violet-400' },
            { label: 'Open Tasks', value: getTotalTasks(), icon: Sparkles, accent: 'text-amber-600 dark:text-amber-400' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="group bg-white dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-4 hover:border-zinc-300/80 dark:hover:border-zinc-700/80 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {stat.label}
                </span>
                <stat.icon size={14} className={cn('opacity-60', stat.accent)} />
              </div>
              <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Status Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex items-center gap-2 mb-8 flex-wrap"
        >
          {(['all', ...Object.keys(statusConfig)] as const).map((status) => (
            <button
              key={status}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
                status === 'all'
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                  : cn(
                      statusConfig[status as ProjectStatus].bgColor,
                      statusConfig[status as ProjectStatus].color,
                      'border',
                      statusConfig[status as ProjectStatus].borderColor
                    )
              )}
            >
              {status === 'all' ? 'All Projects' : statusConfig[status as ProjectStatus].label}
            </button>
          ))}
        </motion.div>

        {/* Add new project form */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="mb-8 p-5 bg-white dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-300/60 dark:border-zinc-700/60 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-zinc-950/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500" />
                <input
                  ref={newProjectInputRef}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmitNew();
                    if (e.key === 'Escape') { setIsAdding(false); setNewProjectName(''); }
                  }}
                  placeholder="Project name..."
                  className="flex-1 bg-transparent outline-none text-zinc-900 dark:text-white font-semibold text-lg placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                />
                <button
                  onClick={handleSubmitNew}
                  className="px-5 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Create
                </button>
                <button
                  onClick={() => { setIsAdding(false); setNewProjectName(''); }}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projects Grid */}
        {projects.length === 0 && !isAdding ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-zinc-100 dark:bg-zinc-800/80 rounded-3xl flex items-center justify-center">
              <FolderOpen size={32} className="text-zinc-300 dark:text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              No projects yet
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">
              Create your first project to start organizing your work and tracking progress.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              Create Project
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {projects.map((project, index) => {
                const status = getProjectStatus(project.id);
                const link = getProjectLink(project.id);
                const progress = getProjectProgress(project.id);
                const projectTasks = getProjectTasks(project.id);
                const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
                const statusCfg = statusConfig[status];
                const isHovered = hoveredId === project.id;

                return (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    onMouseEnter={() => setHoveredId(project.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={cn(
                      'group relative bg-white dark:bg-zinc-900/80 backdrop-blur-sm border rounded-2xl p-5',
                      'transition-all duration-300 cursor-pointer',
                      isHovered
                        ? 'border-zinc-300/80 dark:border-zinc-700/80 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-950/50 -translate-y-0.5'
                        : 'border-zinc-200/60 dark:border-zinc-800/60 shadow-sm shadow-zinc-200/30 dark:shadow-zinc-950/30'
                    )}
                  >
                    {/* Top row: color dot + actions */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-zinc-950 shadow-sm"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                          Project
                        </span>
                      </div>

                      {/* Actions menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenuId(contextMenuId === project.id ? null : project.id);
                          }}
                          className={cn(
                            'p-1.5 rounded-lg transition-all duration-200',
                            isHovered
                              ? 'opacity-100 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                              : 'opacity-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                          )}
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        <AnimatePresence>
                          {contextMenuId === project.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 top-full z-50 mt-1 py-1.5 w-44 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl shadow-zinc-200/50 dark:shadow-zinc-950/50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setEditingId(project.id);
                                  setEditingName(project.name);
                                  setContextMenuId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                              >
                                <Pencil size={14} /> Rename
                              </button>
                              <button
                                onClick={() => {
                                  setEditingLink(project.id);
                                  setNewLink(link);
                                  setContextMenuId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                              >
                                <Link2 size={14} /> Edit Link
                              </button>
                              <button
                                onClick={() => {
                                  setEditingStatus(project.id);
                                  setNewStatus(status);
                                  setContextMenuId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                              >
                                <Clock size={14} /> Change Status
                              </button>
                              <div className="h-px bg-zinc-100 dark:bg-zinc-700 my-1" />
                              <button
                                onClick={() => {
                                  onDeleteProject(project.id);
                                  setContextMenuId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Project Name */}
                    <div className="mb-3">
                      {editingId === project.id ? (
                        <input
                          ref={editProjectInputRef}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveName(project.id);
                            if (e.key === 'Escape') { setEditingId(null); setEditingName(''); }
                          }}
                          onBlur={() => handleSaveName(project.id)}
                          className="w-full bg-transparent outline-none border-b-2 border-indigo-400 text-zinc-900 dark:text-white font-bold text-lg pb-0.5"
                        />
                      ) : (
                        <h3
                          className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight"
                          onDoubleClick={() => {
                            setEditingId(project.id);
                            setEditingName(project.name);
                          }}
                        >
                          {project.name}
                        </h3>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="mb-4">
                      {editingStatus === project.id ? (
                        <select
                          autoFocus
                          value={newStatus}
                          onChange={(e) => {
                            const val = e.target.value as ProjectStatus;
                            setNewStatus(val);
                          }}
                          onBlur={() => handleSaveStatus(project.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') handleSaveStatus(project.id);
                          }}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg border bg-white dark:bg-zinc-800 outline-none cursor-pointer"
                        >
                          {(Object.keys(statusConfig) as ProjectStatus[]).map((s) => (
                            <option key={s} value={s}>{statusConfig[s].label}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingStatus(project.id);
                            setNewStatus(status);
                          }}
                          className={cn(
                            'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all',
                            statusCfg.bgColor,
                            statusCfg.borderColor,
                            statusCfg.color
                          )}
                        >
                          <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dotColor)} />
                          {statusCfg.label}
                        </button>
                      )}
                    </div>

                    {/* Link */}
                    <div className="mb-4">
                      {editingLink === project.id ? (
                        <div className="flex items-center gap-2">
                          <Link2 size={13} className="text-zinc-400 shrink-0" />
                          <input
                            autoFocus
                            value={newLink}
                            onChange={(e) => setNewLink(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveLink(project.id);
                              if (e.key === 'Escape') { setEditingLink(null); setNewLink(''); }
                            }}
                            onBlur={() => handleSaveLink(project.id)}
                            placeholder="https://github.com/..."
                            className="flex-1 text-xs bg-transparent outline-none border-b border-indigo-400 text-zinc-600 dark:text-zinc-400"
                          />
                        </div>
                      ) : link ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline group/link"
                        >
                          <Link2 size={12} className="shrink-0" />
                          <span className="truncate max-w-[180px]">{link.replace(/^https?:\/\//, '')}</span>
                          <ArrowUpRight size={11} className="opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
                        </a>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingLink(project.id);
                            setNewLink(link);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                          <Link2 size={12} />
                          Add link
                        </button>
                      )}
                    </div>

                    {/* Progress Section */}
                    {projectTasks.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                            {completedTasks} of {projectTasks.length} tasks
                          </span>
                          <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                            {progress}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: progress === 100 ? '#8b5cf6' : project.color,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="py-2">
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">No tasks yet</span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                        Created {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Footer spacing */}
        <div className="h-20" />
      </div>

      {/* Context menu backdrop */}
      {contextMenuId && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setContextMenuId(null)}
        />
      )}
    </div>
  );
};
