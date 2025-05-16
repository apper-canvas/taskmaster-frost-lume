import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import reminderService from '../utils/reminderService';
import MainFeature from '../components/MainFeature';
import getIcon from '../utils/iconUtils';

const Home = () => {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  
  const [filter, setFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'board'
  
  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    // Set up reminders for tasks with due dates when component mounts
    tasks.forEach(task => {
      if (task.dueDate && task.reminder && task.reminder.enabled) {
        reminderService.setReminder(task);
      }
    });
    
    // Show notification permission prompt if there are tasks with reminders
    if (tasks.some(task => task.reminder && task.reminder.enabled)) {
      reminderService.requestPermission();
    }
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
  }, [tasks]);
  
  const ListIcon = getIcon('ListTodo');
  const FilterIcon = getIcon('Filter');
  const SortIcon = getIcon('ArrowUpDown');
  const TrashIcon = getIcon('Trash2');
  const ViewIcon = getIcon('Layers');
  const CategoryIcon = getIcon('Tag');
  const BellIcon = getIcon('Bell');
  const RepeatIcon = getIcon('Repeat');
  
  // Add a new task
  const addTask = (task) => {
    // For task updates, we want to replace the existing task
    if (task.length && Array.isArray(task)) {
      setTasks(task);
      return;
    }

    // For a new task, add it to the array
    setTasks([...tasks, task]);
    
  };

  // Toggle task completion
  const toggleComplete = (id) => {
    const taskToToggle = tasks.find(task => task.id === id);
    
    if (!taskToToggle) return;
    
    // Check if this is a repeating task
    if (taskToToggle.isRepeating && !taskToToggle.completed) {
      // For repeating tasks that are being marked complete, we need to:
      // 1. Mark the current instance as complete
      // Cancel any reminders for this task
      reminderService.cancelReminder(id);

      // 2. Create the next instance with an updated due date
      
      // First, update the current task to be completed
      const updatedTasks = tasks.map(task => 
        task.id === id ? { ...task, completed: true } : task
      );

      if (taskToToggle.dueDate) {
        const currentDueDate = new Date(taskToToggle.dueDate);
        let nextDueDate = new Date(currentDueDate);
        
        // Calculate the next due date based on repeat type
        switch (taskToToggle.repeatType) {
          case 'daily':
            nextDueDate.setDate(currentDueDate.getDate() + 1);
            break;
          case 'weekly':
            nextDueDate.setDate(currentDueDate.getDate() + 7);
            break;
          case 'monthly':
            nextDueDate.setMonth(currentDueDate.getMonth() + 1);
            break;
          case 'custom':
            if (taskToToggle.customUnit === 'days') {
              nextDueDate.setDate(currentDueDate.getDate() + taskToToggle.customInterval);
            } else if (taskToToggle.customUnit === 'weeks') {
              nextDueDate.setDate(currentDueDate.getDate() + (taskToToggle.customInterval * 7));
            } else if (taskToToggle.customUnit === 'months') {
              nextDueDate.setMonth(currentDueDate.getMonth() + taskToToggle.customInterval);
            } else if (taskToToggle.customUnit === 'years') {
              nextDueDate.setFullYear(currentDueDate.getFullYear() + taskToToggle.customInterval);
            }
            break;
          default:
            break;
        }
        
        // Create a new task instance with the next due date
        const newTask = {
          ...taskToToggle,
          id: Date.now().toString(), // Generate a new ID
          completed: false,
          dueDate: nextDueDate.toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };
        
        // Add the new task to the list
        setTasks([...updatedTasks, newTask]);
      } else {
        setTasks(updatedTasks);
      }
    } else { // For non-repeating tasks or tasks being marked incomplete
      // For non-repeating tasks or tasks being marked incomplete
      const updatedTask = { 
        ...taskToToggle, 
        completed: !taskToToggle.completed 
      };
      
      // Update reminder if the task has one
      if (updatedTask.reminder?.enabled) {
        if (updatedTask.completed) {
          reminderService.cancelReminder(id);
        } else {
          reminderService.setReminder(updatedTask);
        }
      }

      setTasks(tasks.map(task => task.id === id ? updatedTask : task));
    }
    
    const taskName = taskToToggle.title;
    const isCompleted = !taskToToggle.completed; // This is the new state (opposite of current)
    
    toast.info(
      `Reminder: Task due date changed for "${taskName}"`
    );
  };
  
  // Delete a task
  const deleteTask = (id) => {
    const taskName = tasks.find(task => task.id === id).title;
    setTasks(tasks.filter(task => task.id !== id));
  };
  
  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    if (filter === 'high') return task.priority === 'high';
    if (filter === 'medium') return task.priority === 'medium';
    if (filter === 'low') return task.priority === 'low';
    if (filter === 'recurring') return task.isRepeating;
    // Add category filter
    if (filter.startsWith('category:')) return task.category === filter.split(':')[1];
    return true;
  });
  
  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortOption === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortOption === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortOption === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (sortOption === 'priority') {
      const priorityValue = { high: 3, medium: 2, low: 1 };
      return priorityValue[b.priority] - priorityValue[a.priority];
    }
    if (sortOption === 'alphabetical') return a.title.localeCompare(b.title);
    return 0;
  });
  
  // Clear all completed tasks
  const clearCompleted = () => {
    const completedCount = tasks.filter(task => task.completed).length;
    if (completedCount === 0) {
      return;
    }
    setTasks(tasks.filter(task => !task.completed));
  };

  // Get tomorrow's date in YYYY-MM-DD format
  const getTomorrowsDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Count tasks due tomorrow
  const tomorrowsTasks = tasks.filter(task => task.dueDate === getTomorrowsDate() && !task.completed);

  // Show reminders for tomorrow's tasks
  const notifyTomorrowsTasks = async () => {
    const tomorrowDate = getTomorrowsDate();
    const dueTomorrow = tasks.filter(task => task.dueDate === tomorrowDate && !task.completed);
    
    // Request notification permission if needed
    if (Notification.permission !== 'granted') {
      await reminderService.requestPermission();
    }
    
    // Show a toast and notification for each task
    if (dueTomorrow.length === 0) {
      toast.info('Reminder: No tasks due tomorrow');
      return false;
    }
    
    // Show a toast and notification for each task
    dueTomorrow.forEach((task, index) => {
      // Add a small delay between notifications to avoid overwhelming the user
      setTimeout(() => {
        toast.info(`Reminder: Due tomorrow: "${task.title}" (${task.priority} priority)`);
        if (Notification.permission === 'granted') {
          new Notification('Task Due Tomorrow', { body: task.title, icon: '/favicon.ico' });
        }
      }, index * 300);
    });
    
    return true;
  };
  
  // Get categories from tasks
  const getCategories = () => {
    const categories = tasks
      .filter(task => task.category)
      .map(task => task.category);
    return [...new Set(categories)];
  };
  
  // Count tasks by category
  const getCategoryCounts = () => {
    const categories = getCategories();
    const counts = {};
    
    categories.forEach(category => {
      counts[category] = tasks.filter(task => task.category === category).length;
    });
    
    return counts;
  };
  
  // Show upcoming tasks by category
  const showUpcomingTasksByCategory = async () => {
    const categories = getCategories();
    
    if (categories.length === 0) {
      toast.info('Reminder: No categories found');
      return false;
    }
    
    // Show a toast and notification for each category
    categories.forEach((category, index) => {
      const categoryTasks = tasks.filter(task => 
        task.category === category && 
        !task.completed && 
        task.dueDate
      );
      
      if (categoryTasks.length === 0) return;
      // Show a notification for this category
      setTimeout(() => {
        toast.info(`Reminder: ${category} category has ${categoryTasks.length} active tasks`);
      }, index * 200);
    });
    
    return true;
  };
  
  return (
    <div className="container mx-auto px-4 pb-16">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ListIcon className="w-8 h-8 text-primary" />
              Task Manager
            </h1>
            <p className="text-surface-600 dark:text-surface-400 mt-1">
              Organize your tasks and boost productivity
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            <div className="relative flex-1 sm:flex-none min-w-40">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FilterIcon className="w-4 h-4 text-surface-500" />
              </div>
              <select
                className="pl-10 pr-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Tasks</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
                <option value="recurring">Recurring Tasks</option>
                {getCategories().map(category => (
                  <option key={category} value={`category:${category}`}>
                    Category: {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 sm:flex-none min-w-40">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <SortIcon className="w-4 h-4 text-surface-500" />
                </div>
                <select
                  className="pl-10 pr-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
              
              <button
                onClick={notifyTomorrowsTasks}
                className="flex items-center justify-center space-x-1 px-4 py-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light rounded-lg text-sm hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
                title="Get notifications for tasks due tomorrow"
              >
                <BellIcon className="w-4 h-4" />
                <span>Tomorrow's Tasks</span>
                {tomorrowsTasks.length > 0 && (
                  <span className="ml-1 flex items-center justify-center bg-primary text-white text-xs rounded-full h-5 w-5">
                    {tomorrowsTasks.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={clearCompleted}
                className="flex items-center justify-center space-x-1 px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Clear Completed</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      
      <MainFeature 
        tasks={sortedTasks}
        addTask={addTask}
        toggleComplete={toggleComplete}
        deleteTask={deleteTask}
      />
      
      <div className="mt-8 bg-white dark:bg-surface-800 rounded-xl shadow-soft p-6">
        <h2 className="text-xl font-semibold mb-4">Task Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4">
            <p className="text-surface-500 dark:text-surface-400 text-sm">Total Tasks</p>
            <p className="text-2xl font-bold text-primary">{tasks.length}</p>
          </div>
          <div className="bg-green-100 dark:bg-green-900/20 rounded-lg p-4">
            <p className="text-surface-500 dark:text-surface-400 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {tasks.filter(task => task.completed).length}
            </p>
          </div>
          <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4">
            <p className="text-surface-500 dark:text-surface-400 text-sm">Recurring</p>
            <p className="text-2xl font-bold text-primary dark:text-primary-light">
              {tasks.filter(task => task.isRepeating).length}
            </p>
          </div>
          <div className="bg-yellow-100 dark:bg-yellow-900/20 rounded-lg p-4">
            <p className="text-surface-500 dark:text-surface-400 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {tasks.filter(task => !task.completed).length}
            </p>
          </div>
          <div className="bg-red-100 dark:bg-red-900/20 rounded-lg p-4">
            <p className="text-surface-500 dark:text-surface-400 text-sm">High Priority</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {tasks.filter(task => task.priority === 'high').length}
            </p>
          </div>
          
          {/* Categories Section */}
          {getCategories().length > 0 && (
            <div className="col-span-full mt-2">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CategoryIcon className="w-5 h-5 text-primary" />
                Categories
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {getCategories().map(category => {
                  const categoryTasks = tasks.filter(t => t.category === category);
                  const categoryColor = categoryTasks[0]?.categoryColor || 'blue';
                  const completedCount = categoryTasks.filter(t => t.completed).length;
                  const totalCount = categoryTasks.length;
                  const completionPercentage = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
                  
                  return (
                    <div key={category} className={`border-l-4 rounded-lg p-3 bg-${categoryColor}-50 dark:bg-${categoryColor}-900/10 border-${categoryColor}-500`}>
                      <h4 className="font-medium text-surface-800 dark:text-surface-100">{category}</h4>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-surface-600 dark:text-surface-400">{totalCount} tasks</p>
                        <p className="text-sm font-medium">{completionPercentage}% done</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;