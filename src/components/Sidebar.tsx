import React, { useState, useRef, useEffect } from 'react';
import { Inbox, Calendar, CalendarRange, CheckCircle2, Layout, Plus, LogOut, Lightbulb, Flame, MoreHorizontal, Pencil, Trash2, X, Menu, FolderOpen } from 'lucide-react';
import { cn, getLocalDateKey, taskDateKey } from '../lib/utils';
import { AppUser, Project, Task } from '../types';
import { AnimatePresence, motion } from 'motion/react';
import { ConfirmDialog } from './ConfirmDialog';

interface SidebarProps {
  projects: Project[];
  tasks: Task[];
  activeView: string;
  setActiveView: (view: string) => void;
  user: AppUser;
  onLogout: () => void;
  onAddProject: (name: string) => void;
  onUpdateProject: (id: string, data: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  tasks,
  activeView,
  setActiveView,
  user,
  onLogout,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [contextMenuProjectId, setContextMenuProjectId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);
  const newProjectInputRef = useRef<HTMLInputElement>(null);
  const editProjectInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingProject && newProjectInputRef.current) {
      newProjectInputRef.current.focus();
    }
  }, [isAddingProject]);

  useEffect(() => {
    if (editingProjectId && editProjectInputRef.current) {
      editProjectInputRef.current.focus();
      editProjectInputRef.current.select();
    }
  }, [editingProjectId]);

  useEffect(() => {
    if (!contextMenuProjectId) return;
    const handler = () => setContextMenuProjectId(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenuProjectId]);

  const countMap = {
    inbox: tasks.filter(t => t.status !== 'completed').length,
    today: tasks.filter(t => {
      const today = getLocalDateKey();
      return taskDateKey(t.dueDate) === today && t.status !== 'completed';
    }).length,
    upcoming: tasks.filter(t => {
      const today = getLocalDateKey();
      const dueKey = taskDateKey(t.dueDate);
      return !!dueKey && dueKey > today && t.status !== 'completed';
    }).length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const projectTaskCount = (projectId: string) =>
    tasks.filter(t => t.projectId === projectId && t.status !== 'completed').length;

  const handleNavClick = (viewId: string) => {
    setActiveView(viewId);
    onCloseMobile();
    setContextMenuProjectId(null);
  };

  const handleSubmitNewProject = () => {
    const name = newProjectName.trim();
    if (name) {
      onAddProject(name);
    }
    setNewProjectName('');
    setIsAddingProject(false);
  };

  const handleSubmitRename = (id: string) => {
    const name = editingProjectName.trim();
    if (name) {
      onUpdateProject(id, { name });
    }
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const navItems = [
    { id: 'inbox', label: 'Inbox', icon: <Inbox size={18} />, count: countMap.inbox },
    { id: 'today', label: 'Today', icon: <Calendar size={18} />, count: countMap.today },
    { id: 'upcoming', label: 'Upcoming', icon: <CalendarRange size={18} />, count: countMap.upcoming },
    { id: 'completed', label: 'Completed', icon: <CheckCircle2 size={18} />, count: countMap.completed },
    { id: 'notes', label: 'Ideas & Notes', icon: <Lightbulb size={18} /> },
    { id: 'habits', label: 'Habits & Streaks', icon: <Flame size={18} /> },
    { id: 'projects', label: 'All Projects', icon: <FolderOpen size={18} />, count: projects.length },
  ];

  const sidebarContent = (
    <div 
      className="w-[260px] h-full flex flex-col p-5 border-r border-zinc-200 dark:border-white/5 select-none-deep relative z-10 bg-zinc-50 dark:bg-transparent"
    >
      {/* Logo & User */}
      <div className="flex items-center gap-2.5 px-1 mb-8">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.9) 0%, rgba(99,102,241,0.9) 100%)',
            boxShadow: '0 4px 12px rgba(139,92,246,0.3)'
          }}
        >
          <Layout size={16} strokeWidth={2.5} className="text-white" />
        </div>
        <div className="min-w-0 flex-1 truncate">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white/90 truncate">FocusFlow</h3>
          <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider truncate">{user.displayName || 'User'}</p>
        </div>
        <button
          onClick={onCloseMobile}
          className="p-1.5 rounded-md hover:bg-white/5 transition-colors text-zinc-500 hover:text-zinc-300 md:hidden ml-auto"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pb-16 md:pb-0">
        {/* Main nav */}
        <div className="space-y-0.5">
          <div className="px-3 mb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
            Main
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer w-full text-sm',
                activeView === item.id 
                  ? 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-900 dark:text-white' 
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/[0.03]'
              )}
            >
              <span className={cn(activeView === item.id && 'text-violet-400')}>{item.icon}</span>
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-600 bg-zinc-200/70 dark:bg-white/[0.05] px-1.5 py-0.5 rounded-full tabular-nums">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Projects */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            <span>Projects</span>
            <button
              onClick={() => setIsAddingProject(true)}
              className="hover:text-violet-400 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-0.5">
            {projects.map((project) => (
              <div key={project.id} className="relative">
                {editingProjectId === project.id ? (
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                    <input
                      ref={editProjectInputRef}
                      value={editingProjectName}
                      onChange={(e) => setEditingProjectName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubmitRename(project.id);
                        if (e.key === 'Escape') { setEditingProjectId(null); setEditingProjectName(''); }
                      }}
                      onBlur={() => handleSubmitRename(project.id)}
                      className="flex-1 text-sm font-medium bg-transparent outline-none border-b border-violet-500/50 text-zinc-900 dark:text-white py-0.5"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => handleNavClick(`project-${project.id}`)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer w-full text-sm group',
                      activeView === `project-${project.id}` 
                        ? 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-900 dark:text-white' 
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/[0.03]'
                    )}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/10" style={{ backgroundColor: project.color }} />
                    <span className="truncate font-medium flex-1 text-left">{project.name}</span>
                    {projectTaskCount(project.id) > 0 && (
                      <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-600 tabular-nums">
                        {projectTaskCount(project.id)}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenuProjectId(contextMenuProjectId === project.id ? null : project.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-all text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </button>
                )}

                <AnimatePresence>
                  {contextMenuProjectId === project.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-2 top-full z-50 mt-1 py-1.5 w-36 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setEditingProjectId(project.id);
                          setEditingProjectName(project.name);
                          setContextMenuProjectId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <Pencil size={12} /> Rename
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDelete(project);
                          setContextMenuProjectId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {isAddingProject && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-zinc-600" />
                  <input
                    ref={newProjectInputRef}
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmitNewProject();
                      if (e.key === 'Escape') { setIsAddingProject(false); setNewProjectName(''); }
                    }}
                    onBlur={() => {
                      if (newProjectName.trim()) handleSubmitNewProject();
                      else { setIsAddingProject(false); setNewProjectName(''); }
                    }}
                    placeholder="Project name..."
                    className="flex-1 text-sm font-medium bg-transparent outline-none border-b border-violet-500/50 text-zinc-900 dark:text-white py-0.5 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Logout */}
      <div className="pt-4 border-t border-zinc-200 dark:border-white/[0.06]">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors w-full"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
            onClick={onCloseMobile}
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          'h-full shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-40',
          'fixed md:relative bg-white dark:bg-transparent',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {sidebarContent}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete project?"
        message={`"${confirmDelete?.name}" and its association with tasks will be removed. Tasks themselves won't be deleted.`}
        onConfirm={() => {
          if (confirmDelete) onDeleteProject(confirmDelete.id);
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  );
};
