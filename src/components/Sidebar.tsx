import React, { useState, useRef, useEffect } from 'react';
import {
  Inbox,
  Calendar,
  CalendarRange,
  CheckCircle2,
  Layout,
  Plus,
  LogOut,
  Lightbulb,
  Flame,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Menu,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AppUser, Project, Task } from '../types';
import { AnimatePresence, motion } from 'motion/react';

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

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenuProjectId) return;
    const handler = () => setContextMenuProjectId(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenuProjectId]);

  // Task counts
  const countMap = {
    inbox: tasks.filter(t => t.status !== 'completed').length,
    today: tasks.filter(t => {
      const today = new Date().toISOString().split('T')[0];
      return t.dueDate?.startsWith(today) && t.status !== 'completed';
    }).length,
    upcoming: tasks.filter(t => {
      const today = new Date().toISOString().split('T')[0];
      return t.dueDate && t.dueDate > today && t.status !== 'completed';
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
  ];

  const sidebarContent = (
    <div className="w-[260px] h-full flex flex-col p-5 bg-sidebar-bg dark:bg-zinc-950 border-r border-border-subtle dark:border-zinc-800 select-none-deep">
      {/* Logo & User */}
      <div className="flex items-center gap-2.5 px-1 mb-8">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20">
          <Layout size={16} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-text-main dark:text-zinc-50 truncate">FocusFlow</h3>
          <p className="text-[10px] text-text-muted dark:text-zinc-500 font-semibold uppercase tracking-wider">{user.displayName || 'User'}</p>
        </div>
        {/* Mobile close */}
        <button
          onClick={onCloseMobile}
          className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors md:hidden"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Main nav */}
        <div className="space-y-0.5">
          <div className="px-3 mb-2 text-[10px] font-bold text-text-muted dark:text-zinc-500 uppercase tracking-widest">
            Main
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                'sidebar-item text-sm',
                activeView === item.id && 'sidebar-item-active'
              )}
            >
              {item.icon}
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tabular-nums min-w-[18px] text-center">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Projects */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted dark:text-zinc-500">
            <span>Projects</span>
            <button
              onClick={() => setIsAddingProject(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Project list */}
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
                      className="flex-1 text-sm font-medium bg-transparent outline-none border-b border-indigo-400 text-zinc-900 dark:text-zinc-100 py-0.5"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => handleNavClick(`project-${project.id}`)}
                    className={cn(
                      'sidebar-item text-sm group',
                      activeView === `project-${project.id}` && 'sidebar-item-active'
                    )}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-zinc-950" style={{ backgroundColor: project.color }} />
                    <span className="truncate font-medium flex-1 text-left">{project.name}</span>
                    {projectTaskCount(project.id) > 0 && (
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tabular-nums">
                        {projectTaskCount(project.id)}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenuProjectId(contextMenuProjectId === project.id ? null : project.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-all"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </button>
                )}

                {/* Context menu */}
                <AnimatePresence>
                  {contextMenuProjectId === project.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-2 top-full z-50 mt-1 py-1 w-36 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setEditingProjectId(project.id);
                          setEditingProjectName(project.name);
                          setContextMenuProjectId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-700 dark:text-zinc-300"
                      >
                        <Pencil size={12} /> Rename
                      </button>
                      <button
                        onClick={() => {
                          onDeleteProject(project.id);
                          setContextMenuProjectId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-rose-600 dark:text-rose-400"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Add project inline */}
          <AnimatePresence>
            {isAddingProject && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-zinc-300 dark:bg-zinc-600" />
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
                    className="flex-1 text-sm font-medium bg-transparent outline-none border-b border-indigo-400 text-zinc-900 dark:text-zinc-100 py-0.5 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Logout */}
      <div className="pt-4 border-t border-border-subtle dark:border-zinc-800">
        <button
          onClick={onLogout}
          className="sidebar-item text-sm text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
            onClick={onCloseMobile}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div
        className={cn(
          'h-full shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-40',
          'fixed md:relative',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
};
