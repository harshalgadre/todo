'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiLogOut, FiSun, FiMoon } from 'react-icons/fi';

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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [activeCategory, setActiveCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock API functions
  const fetchData = async (username: string) => {
    try {
      // In a real app, this would be an actual API call
      const savedData = localStorage.getItem(`todo-data-${username}`);
      if (savedData) {
        return JSON.parse(savedData);
      }
      return {
        tasks: {
          'Work': [],
          'Personal': [],
          'Shopping': []
        },
        activeCategory: 'Work'
      };
    } catch (err) {
      console.error('Failed to fetch data:', err);
      throw err;
    }
  };

  const saveData = async (username: string, data: any) => {
    try {
      // In a real app, this would be an actual API call
      localStorage.setItem(`todo-data-${username}`, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save data:', err);
      throw err;
    }
  };

  // Load session and data
  useEffect(() => {
    const session = localStorage.getItem('todo-session');
    if (session) {
      const { username, theme } = JSON.parse(session);
      setUser({ username, theme: theme || 'dark' });
      document.documentElement.classList.toggle('dark', theme === 'dark');

      const loadData = async () => {
        try {
          const data = await fetchData(username);
          setTasks(data.tasks);
          setActiveCategory(data.activeCategory);
        } catch (err) {
          setError('Failed to load data');
        } finally {
          setLoading(false);
        }
      };

      loadData();
    } else {
      router.push('/auth');
    }
  }, [router]);

  // Auto-save when data changes
  useEffect(() => {
    if (user?.username) {
      saveData(user.username, { tasks, activeCategory });
    }
  }, [tasks, activeCategory, user]);

  const logout = () => {
    localStorage.removeItem('todo-session');
    router.push('/auth');
  };

  const toggleTheme = () => {
    if (!user) return;
    const newTheme: 'light' | 'dark' = user.theme === 'dark' ? 'light' : 'dark';
    const updatedUser: UserData = { ...user, theme: newTheme };
    setUser(updatedUser);
    localStorage.setItem('todo-session', JSON.stringify(updatedUser));
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Task operations
  const addTask = () => {
    if (!newTaskText.trim()) {
      setError('Task cannot be empty');
      return;
    }
    if (!activeCategory) {
      setError('Please select a category first');
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTasks(prev => ({
      ...prev,
      [activeCategory]: [...(prev[activeCategory] || []), newTask]
    }));
    setNewTaskText('');
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

  const clearCompleted = () => {
    setTasks(prev => ({
      ...prev,
      [activeCategory]: prev[activeCategory].filter(task => !task.completed)
    }));
    setSuccess('Completed tasks cleared');
  };

  // Category operations
  const addCategory = () => {
    if (!newCategory.trim()) {
      setError('Category name cannot be empty');
      return;
    }
    if (tasks[newCategory.trim()]) {
      setError('Category already exists');
      return;
    }

    const category = newCategory.trim();
    setTasks(prev => ({ ...prev, [category]: [] }));
    setActiveCategory(category);
    setNewCategory('');
    setSuccess('Category added successfully');
  };

  const renameCategory = () => {
    if (!editingCategory || !editCategoryName.trim()) {
      setError('Category name cannot be empty');
      return;
    }
    if (tasks[editCategoryName.trim()] && editCategoryName.trim() !== editingCategory) {
      setError('Category already exists');
      return;
    }

    const newName = editCategoryName.trim();
    setTasks(prev => {
      const updated = { ...prev };
      updated[newName] = updated[editingCategory];
      delete updated[editingCategory];
      return updated;
    });
    setActiveCategory(newName);
    setEditingCategory(null);
    setSuccess('Category renamed successfully');
  };

  const deleteCategory = (category: string) => {
    if (!confirm(`Delete "${category}" and all its tasks?`)) return;
    
    setTasks(prev => {
      const updated = { ...prev };
      delete updated[category];
      return updated;
    });
    
    if (activeCategory === category) {
      setActiveCategory(Object.keys(tasks).filter(c => c !== category)[0] || '');
    }
    setSuccess('Category deleted successfully');
  };

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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${user.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-4 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TaskMaster
            </h1>
            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 px-2 py-1 rounded-full">
              {user.username}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              aria-label={`Switch to ${user.theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {user.theme === 'dark' ? <FiSun /> : <FiMoon />}
            </button>
            
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-800/50 text-red-700 dark:text-red-200 px-4 py-2 rounded-lg transition"
            >
              <FiLogOut /> Sign Out
            </button>
          </div>
        </header>

        {/* Status Messages */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {error && (
            <div className="bg-red-100 dark:bg-red-900/80 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded shadow-lg max-w-xs">
              <div className="flex items-center">
                <div className="py-1">
                  <svg className="w-6 h-6 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Error</p>
                  <p>{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-4 text-red-500 hover:text-red-700"
                  aria-label="Dismiss error"
                >
                  <FiX />
                </button>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 dark:bg-green-900/80 border-l-4 border-green-500 text-green-700 dark:text-green-200 p-4 rounded shadow-lg max-w-xs">
              <div className="flex items-center">
                <div className="py-1">
                  <svg className="w-6 h-6 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Success</p>
                  <p>{success}</p>
                </div>
                <button
                  onClick={() => setSuccess(null)}
                  className="ml-4 text-green-500 hover:text-green-700"
                  aria-label="Dismiss success"
                >
                  <FiX />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Categories Sidebar */}
          <div className="w-full lg:w-1/4 bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Categories
            </h2>
            
            <ul className="space-y-2 mb-6 max-h-[300px] overflow-y-auto pr-2">
              {Object.keys(tasks).map(category => (
                <li key={category} className="flex items-center group">
                  {editingCategory === category ? (
                    <div className="flex items-center w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                      <input
                        type="text"
                        className="flex-1 bg-transparent text-gray-800 dark:text-white px-3 py-2 outline-none"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && renameCategory()}
                        autoFocus
                      />
                      <button
                        onClick={renameCategory}
                        className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/50 rounded"
                        title="Save"
                      >
                        <FiCheck />
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded"
                        title="Cancel"
                      >
                        <FiX />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        className={`flex-1 text-left px-4 py-2 rounded-lg flex items-center justify-between transition ${
                          activeCategory === category
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                        onClick={() => setActiveCategory(category)}
                      >
                        <span className="truncate">{category}</span>
                        <span className="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                          {tasks[category]?.length || 0}
                        </span>
                      </button>
                      <div className="flex ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingCategory(category);
                            setEditCategoryName(category);
                          }}
                          className="p-2 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                          title="Rename"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteCategory(category)}
                          className="p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <div className="relative">
                <input
                  type="text"
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-3 rounded-lg pr-12 outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="New category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                />
                <button
                  onClick={addCategory}
                  disabled={!newCategory.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                >
                  <FiPlus />
                </button>
              </div>
              {newCategory.trim() && tasks[newCategory.trim()] && (
                <p className="mt-1 text-xs text-red-500">Category already exists</p>
              )}
            </div>
          </div>

          {/* Tasks List */}
          <div className="w-full lg:w-3/4 bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md">
            {activeCategory ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                    {activeCategory}
                    <span className="ml-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                      {tasks[activeCategory]?.length || 0} tasks
                    </span>
                  </h2>
                  
                  {tasks[activeCategory]?.some(t => t.completed) && (
                    <button
                      onClick={clearCompleted}
                      className="flex items-center gap-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-800/50 text-red-700 dark:text-red-200 px-4 py-2 rounded-lg transition text-sm"
                    >
                      <FiTrash2 size={14} /> Clear Completed
                    </button>
                  )}
                </div>

                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-3 rounded-lg pr-12 outline-none focus:ring-2 focus:ring-blue-500 transition"
                      placeholder="What needs to be done?"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    />
                    <button
                      onClick={addTask}
                      disabled={!newTaskText.trim()}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>

                {tasks[activeCategory]?.length ? (
                  <ul className="space-y-3">
                    {[...tasks[activeCategory]]
                      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                      .map(task => (
                        <li key={task.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                          <div className="flex items-center flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleTask(task.id)}
                              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600 mr-3 cursor-pointer"
                            />
                            <span
                              className={`flex-1 truncate ${
                                task.completed 
                                  ? 'line-through text-gray-400 dark:text-gray-500' 
                                  : 'text-gray-800 dark:text-gray-200'
                              }`}
                            >
                              {task.text}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="ml-4 text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-8 text-center">
                    <svg
                      className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">No tasks yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Add your first task to get started
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-8 text-center">
                <svg
                  className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {Object.keys(tasks).length === 0 ? 'No categories yet' : 'Select a category'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {Object.keys(tasks).length === 0
                    ? 'Create your first category to get started'
                    : 'Choose a category to view or add tasks'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}