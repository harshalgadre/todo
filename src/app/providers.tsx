'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

type UserData = {
  username: string;
  theme: 'light' | 'dark';
};

type AppData = {
  tasks: Record<string, Task[]>;
  activeCategory: string;
};

type TodoData = {
  users: Record<string, UserData & AppData>;
};

type SessionContextType = {
  user: UserData | null;
  tasks: Record<string, Task[]>;
  activeCategory: string;
  login: (username: string) => Promise<void>;
  logout: () => void;
  toggleTheme: () => void;
  addTask: (text: string) => void;
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  addCategory: (name: string) => void;
  renameCategory: (oldName: string, newName: string) => void;
  deleteCategory: (name: string) => void;
  clearCompleted: () => void;
  error: string | null;
  success: string | null;
};

const SessionContext = createContext<SessionContextType>({} as SessionContextType);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load initial data from JSON file
  const loadData = async () => {
    try {
      // Try to load data from localStorage first as a fallback
      const localData = localStorage.getItem('todo-data');
      if (localData) {
        return JSON.parse(localData) as TodoData;
      }
      
      // Then try to fetch from the file
      const response = await fetch('/data/todo.json');
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status}`);
      }
      
      const data: TodoData = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to load data:', err);
      return { users: {} };
    }
  };

  // Save data to JSON file
  const saveData = async (data: TodoData) => {
    try {
      // In a real app, you would send this to your backend API
      // For demo purposes, we'll use localStorage
      localStorage.setItem('todo-data', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save data:', err);
    }
  };

  // Load session and data
  useEffect(() => {
    const initialize = async () => {
      const session = localStorage.getItem('todo-session');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          const username = parsed.username;
          // Ensure the theme is either 'light' or 'dark'
          const theme = parsed.theme === 'light' ? 'light' : 'dark';
          
          setUser({ username, theme });
          document.documentElement.classList.toggle('dark', theme === 'dark');

          const data = await loadData();
          const userData = data.users[username] || {
            tasks: {
              'Work': [],
              'Personal': [],
              'Shopping': []
            },
            activeCategory: 'Work'
          };

          setTasks(userData.tasks || {});
          setActiveCategory(userData.activeCategory || 'Work');
        } catch (err) {
          console.error('Failed to parse session:', err);
          localStorage.removeItem('todo-session');
        }
      }
      setLoading(false);
    };

    initialize();
  }, []);

  const login = async (username: string) => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const userData: UserData = { username, theme: 'dark' };
      localStorage.setItem('todo-session', JSON.stringify(userData));
      
      const data = await loadData();
      const userAppData = data.users[username] || {
        tasks: {
          'Work': [],
          'Personal': [],
          'Shopping': []
        },
        activeCategory: 'Work'
      };

      setUser(userData);
      setTasks(userAppData.tasks || {});
      setActiveCategory(userAppData.activeCategory || 'Work');
      setError(null);
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (user?.username) {
      // Save data before logout
      const data = await loadData();
      data.users[user.username] = { 
        ...user,
        tasks, 
        activeCategory 
      };
      await saveData(data);
    }
    
    localStorage.removeItem('todo-session');
    setUser(null);
    setTasks({});
    setActiveCategory('');
    setSuccess('Logged out successfully');
  };

  const toggleTheme = () => {
    if (!user) return;
    
    // Use proper typing with literal types
    const newTheme: 'light' | 'dark' = user.theme === 'dark' ? 'light' : 'dark';
    const updatedUser: UserData = { ...user, theme: newTheme };
    
    setUser(updatedUser);
    localStorage.setItem('todo-session', JSON.stringify(updatedUser));
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Task operations
  const addTask = (text: string) => {
    if (!activeCategory) {
      setError('Please select a category first');
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTasks(prev => ({
      ...prev,
      [activeCategory]: [...(prev[activeCategory] || []), newTask]
    }));
    setSuccess('Task added successfully');
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => ({
      ...prev,
      [activeCategory]: prev[activeCategory].map(task => 
        task.id === taskId ? { 
          ...task, 
          completed: !task.completed,
          updatedAt: new Date().toISOString()
        } : task
      )
    }));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => ({
      ...prev,
      [activeCategory]: prev[activeCategory].filter(task => task.id !== taskId)
    }));
    setSuccess('Task deleted successfully');
  };

  // Category operations
  const addCategory = (name: string) => {
    const category = name.trim();
    if (tasks[category]) {
      setError('Category already exists');
      return;
    }

    setTasks(prev => ({ ...prev, [category]: [] }));
    setActiveCategory(category);
    setSuccess('Category added successfully');
  };

  const renameCategory = (oldName: string, newName: string) => {
    const updatedName = newName.trim();
    if (tasks[updatedName] && updatedName !== oldName) {
      setError('Category already exists');
      return;
    }

    setTasks(prev => {
      const updated = { ...prev };
      updated[updatedName] = updated[oldName];
      delete updated[oldName];
      return updated;
    });

    if (activeCategory === oldName) {
      setActiveCategory(updatedName);
    }
    setSuccess('Category renamed successfully');
  };

  const deleteCategory = (name: string) => {
    setTasks(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });

    if (activeCategory === name) {
      const remainingCategories = Object.keys(tasks).filter(c => c !== name);
      setActiveCategory(remainingCategories[0] || '');
    }
    setSuccess('Category deleted successfully');
  };

  const clearCompleted = () => {
    setTasks(prev => ({
      ...prev,
      [activeCategory]: prev[activeCategory].filter(task => !task.completed)
    }));
    setSuccess('Completed tasks cleared');
  };

  // Auto-save when data changes
  useEffect(() => {
    if (!user?.username) return;

    const saveUserData = async () => {
      const data = await loadData();
      data.users[user.username] = {
        ...user,
        tasks, 
        activeCategory
      };
      await saveData(data);
    };

    saveUserData();
  }, [tasks, activeCategory, user]);

  // Clear messages after timeout
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <SessionContext.Provider value={{
      user,
      tasks,
      activeCategory,
      login,
      logout,
      toggleTheme,
      addTask,
      toggleTask,
      deleteTask,
      addCategory,
      renameCategory,
      deleteCategory,
      clearCompleted,
      error,
      success
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);