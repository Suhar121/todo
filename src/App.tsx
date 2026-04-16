/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Task, Project, Note, UserProfile, Priority, Status } from './types';
import { Sidebar } from './components/Sidebar';
import { TaskBoard } from './components/TaskBoard';
import { UniversalInput } from './components/UniversalInput';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, User as UserIcon, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeView, setActiveView] = useState('inbox');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        // Create user profile if doesn't exist
        const userRef = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            userId: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
            theme: isDarkMode ? 'dark' : 'light'
          });
        }
      }
    });
  }, []);

  // Sync Tasks
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }
    const q = query(
      collection(db, 'tasks'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(taskList);
    });
  }, [user]);

  // Sync Projects
  useEffect(() => {
    if (!user) {
      setProjects([]);
      return;
    }
    const q = query(
      collection(db, 'projects'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const projectList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectList);
    });
  }, [user]);

  // Sync Notes
  useEffect(() => {
    if (!user) {
      setNotes([]);
      return;
    }
    const q = query(
      collection(db, 'notes'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const noteList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      setNotes(noteList);
    });
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login Error:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 italic">FocusFlow</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Your universal productivity system, powered by AI.</p>
          </div>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 py-3 rounded-2xl font-medium hover:opacity-90 transition-opacity"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>
          <div className="pt-8 grid grid-cols-3 gap-4">
            {['Tasks', 'Ideas', 'Projects'].map(item => (
              <div key={item} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium">
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950 overflow-hidden font-sans">
      <Sidebar 
        projects={projects} 
        activeView={activeView} 
        setActiveView={setActiveView} 
        user={user}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-900 overflow-hidden transition-all duration-300">
        <header className="h-16 flex items-center justify-between px-8 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-20">
          <div className="flex items-center gap-4 flex-1 max-w-2l">
             <UniversalInput user={user} projects={projects} />
          </div>
          
          <div className="flex items-center gap-3 pl-6">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-700">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} referrerPolicy="no-referrer" />
              ) : (
                <UserIcon size={16} />
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <TaskBoard 
              key={activeView}
              view={activeView}
              tasks={tasks}
              notes={notes}
              projects={projects}
              user={user}
            />
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}


