import React from 'react';
import { 
  Inbox, 
  Calendar, 
  CheckCircle2, 
  Layout, 
  Hash, 
  Plus, 
  MoreVertical,
  LogOut,
  Folder,
  Lightbulb
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Project } from '../types';
import { User } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SidebarProps {
  projects: Project[];
  activeView: string;
  setActiveView: (view: string) => void;
  user: User;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  projects, 
  activeView, 
  setActiveView, 
  user,
  onLogout 
}) => {
  
  const handleAddProject = async () => {
    const name = prompt('Project Name:');
    if (!name) return;
    
    try {
      await addDoc(collection(db, 'projects'), {
        name,
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { id: 'inbox', label: 'Inbox', icon: <Inbox size={18} /> },
    { id: 'today', label: 'Today', icon: <Calendar size={18} /> },
    { id: 'upcoming', label: 'Upcoming', icon: <Calendar size={18} className="rotate-90" /> },
    { id: 'completed', label: 'Completed', icon: <CheckCircle2 size={18} /> },
    { id: 'notes', label: 'Ideas & Notes', icon: <Lightbulb size={18} /> },
  ];

  return (
    <div className="w-[240px] h-full flex flex-col p-5 bg-sidebar-bg dark:bg-zinc-950 border-r border-border-subtle dark:border-zinc-800">
      <div className="flex items-center gap-2.5 px-1 mb-8">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
          <Layout size={18} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text-main dark:text-zinc-50 truncate">{user.displayName || 'User'}</h3>
          <p className="text-[11px] text-text-muted dark:text-zinc-500 font-medium uppercase tracking-wider">Pro Plan</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6">
        <div className="space-y-1">
          <div className="nav-label mb-2 px-3 text-[11px] font-bold text-text-muted dark:text-zinc-500 uppercase tracking-widest">Main</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "sidebar-item text-sm",
                activeView === item.id && "sidebar-item-active"
              )}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 mb-2 text-[11px] font-bold uppercase tracking-widest text-text-muted dark:text-zinc-500">
            <span>Projects</span>
            <button 
              onClick={handleAddProject}
              className="hover:text-text-main dark:hover:text-zinc-50 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-0.5">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setActiveView(`project-${project.id}`)}
                className={cn(
                  "sidebar-item text-sm group",
                  activeView === `project-${project.id}` && "sidebar-item-active"
                )}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                <span className="truncate font-medium">{project.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="pt-5 border-t border-border-subtle dark:border-zinc-800">
        <button 
          onClick={onLogout}
          className="sidebar-item w-full text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

