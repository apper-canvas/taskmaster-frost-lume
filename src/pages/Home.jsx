import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import reminderService from '../utils/reminderService';
import MainFeature from '../components/MainFeature';
import getIcon from '../utils/iconUtils';
import * as taskService from '../services/taskService';

const Home = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filter, setFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'board'
  
  const user = useSelector(state => state.user.user);

  // Load tasks from the database
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const fetchedTasks = await taskService.fetchTasks();
        setTasks(fetchedTasks);
        setError(null);
      } catch (err) {
        setError('Failed to load tasks');
        toast.error('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
  
    loadTasks();
  }, [tasks]);
  
  const ListIcon = getIcon('ListTodo');
  const FilterIcon = getIcon('Filter');
  const SortIcon = getIcon('ArrowUpDown');
  const TrashIcon = getIcon('Trash2');
  const ViewIcon = getIcon('Layers');
  const CategoryIcon = getIcon('Tag');
  const BellIcon = getIcon('Bell');
  const CheckIcon = getIcon('Check');
  const ActivityIcon = getIcon('Activity');
  const ClockIcon = getIcon('Clock');
  const AlertTriangleIcon = getIcon('AlertTriangle');
  const RepeatIcon = getIcon('Repeat');
  
  // Add a new task or update bulk tasks
  const addTask = async (task) => {
    try {
      // For task updates, we want to replace the existing task
      if (task.length && Array.isArray(task)) {
        setTasks(task);
        
        // For each task with a reminder, set it up
        task.forEach(t => {
          if (t.dueDate && t.reminder && t.reminder.enabled) {
            reminderService.setReminder(t);
          }
        });
        
        return;
      }

      // For a new task, add it to the database and then to the array
      const newTask = await taskService.createTask(task);
      
      // Update state with the newly created task
      setTasks(prevTasks => [...prevTasks, newTask]);
      
      // Set up reminder if needed
      if (newTask.dueDate && newTask.reminder && newTask.reminder.enabled) {
        // Set up reminder
        reminderService.setReminder(newTask);
      }
      
      // Show notification permission prompt if the task has a reminder
      if (newTask.reminder && newTask.reminder.enabled) {
        reminderService.requestPermission();
      }
      
      toast.success('Task created successfully');
      
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to create task');
    }
    
  };

  // Toggle task completion
  const toggleComplete = async (id) => {
    const taskToToggle = tasks.find(task => task.id === id);
    
    if (!taskToToggle) return;
    
    // Check if this is a repeating task
    if (taskToToggle.isRepeating && !taskToToggle.completed) {
      // For repeating tasks that are being marked complete, we need to:
      // 1. Mark the current instance as complete
      // Cancel any reminders for this task
      reminderService.cancelReminder(id);

      try {
        // First, update the current task to be completed in the database
        const taskToToggle = { ...taskToToggle, completed: true };
        await taskService.updateTask(taskToToggle);
      
        // Update local state
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

        try {
          // Create the new repeating task instance
          const createdTask = await taskService.createTask(newTask);
          
          // Add the new task to the list
          setTasks([...updatedTasks, createdTask]);
        } catch (err) {
          toast.error('Failed to create next recurring task');
        }
      } else {
        setTasks(updatedTasks);
      }
      } catch (err) {
        toast.error('Failed to update task completion status');
      }
    } else { // For non-repeating tasks or tasks being marked incomplete
      try {
        // For non-repeating tasks or tasks being marked incomplete
        const updatedTask = { ...taskToToggle, completed: !taskToToggle.completed };
        
        // Update reminder if the task has one
        if (updatedTask.reminder?.enabled) {
          if (updatedTask.completed) {
          reminderService.cancelReminder(id);
        } else {
          reminderService.setReminder(updatedTask);
        }
      }
    if (taskToToggle.isRepeating) {
      toast.info(
        `Reminder: Task due date changed for "${taskName}"`
      );
    } else {
      toast.info(
        `Task "${taskName}" marked as ${isCompleted ? 'completed' : 'incomplete'}`
      );
    }

      // Update the task in the database
      await taskService.updateTask(updatedTask);
      
      // Update local state
      setTasks(tasks.map(task => task.id === id ? updatedTask : task));
      } catch (err) {
        toast.error('Failed to update task completion status');
      }
    }
    
  };

  // Delete a task
  const deleteTask = async (id) => {
    try {
      const taskToDelete = tasks.find(task => task.id === id);
      if (!taskToDelete) return;
      
      const taskName = taskToDelete.title;
      
      // Delete from database
      await taskService.deleteTask(id);
      
      // Update local state
      setTasks(tasks.filter(task => task.id !== id));
      toast.success(`Task "${taskName}" deleted successfully`);
    } catch (error) {
      toast.error('Failed to delete task');
    }
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
    <div className="container mx-auto px-4 pb-16 relative">
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-surface-900/50 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-surface-700 dark:text-surface-300">Loading tasks...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6">
          <p className="font-medium">Error loading tasks</p>
          <p className="text-sm mt-1">Please try refreshing the page</p>
        </div>
      )}
      
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold">Welcome, {user?.firstName || 'User'}</h1>
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
      )}
      
      <MainFeature 
        tasks={sortedTasks}
        addTask={addTask}
        toggleComplete={toggleComplete}
        deleteTask={deleteTask}
        isLoading={loading}
      />
      
      {!loading && tasks.length > 0 && (
        <motion.div 
          className="mt-10 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Task Analytics & Insights
            </h2>
            <button 
              onClick={showUpcomingTasksByCategory}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-white dark:bg-surface-800 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <ActivityIcon className="w-4 h-4 text-primary" />
              <span>Refresh Stats</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <motion.div 
              className="stat-card stat-card-primary"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/80 font-medium mb-1">Total Tasks</p>
                  <p className="stat-number text-3xl font-bold" style={{ '--index': 0 }}>
                    {tasks.length}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-white/20">
                  <ListIcon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-white/60 text-sm mt-4">
                {tasks.length > 0 ? 'Managing your productivity' : 'Start adding tasks'}
              </p>
            </motion.div>
            
            <motion.div 
              className="stat-card stat-card-success"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {(() => {
                const completed = tasks.filter(task => task.completed).length;
                const completionPercentage = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
                
                return (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white/80 font-medium mb-1">Completed</p>
                        <p className="stat-number text-3xl font-bold" style={{ '--index': 1 }}>
                          {completed}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-white/20">
                        <CheckIcon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="circular-progress" style={{ '--progress': `${completionPercentage}%`, '--progress-color': 'white' }}>
                        <span className="text-xs font-bold">{completionPercentage}%</span>
                      </div>
                      <p className="text-white/60 text-sm">
                        {completionPercentage > 75 ? 'Great progress!' : 'Keep going!'}
                      </p>
                    </div>
                  </>
                );
              })()}
            </motion.div>
            
            <motion.div 
              className="stat-card stat-card-warning"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {(() => {
                const pending = tasks.filter(task => !task.completed).length;
                const highPriority = tasks.filter(task => task.priority === 'high' && !task.completed).length;
                const highPriorityPercentage = pending ? Math.round((highPriority / pending) * 100) : 0;
                
                return (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white/80 font-medium mb-1">Pending</p>
                        <p className="stat-number text-3xl font-bold" style={{ '--index': 2 }}>
                          {pending}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-white/20">
                        <ClockIcon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="circular-progress" style={{ '--progress': `${highPriorityPercentage}%`, '--progress-color': 'white' }}>
                        <span className="text-xs font-bold">{highPriorityPercentage}%</span>
                      </div>
                      <p className="text-white/60 text-sm">
                        {highPriorityPercentage > 50 ? 'High priority tasks!' : 'Task priorities balanced'}
                      </p>
                    </div>
                  </>
                );
              })()}
            </motion.div>
            
            <motion.div 
              className="stat-card stat-card-accent"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {(() => {
                const recurring = tasks.filter(task => task.isRepeating).length;
                const recurringPercentage = tasks.length ? Math.round((recurring / tasks.length) * 100) : 0;
                
                return (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white/80 font-medium mb-1">Recurring</p>
                        <p className="stat-number text-3xl font-bold" style={{ '--index': 3 }}>
                          {recurring}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-white/20">
                        <RepeatIcon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="circular-progress" style={{ '--progress': `${recurringPercentage}%`, '--progress-color': 'white' }}>
                        <span className="text-xs font-bold">{recurringPercentage}%</span>
                      </div>
                      <p className="text-white/60 text-sm">
                        {recurringPercentage > 30 ? 'Good habit building!' : 'Consider adding routines'}
                      </p>
                    </div>
                  </>
                );
              })()}
            </motion.div>
            
            {/* Categories Section */}
            {getCategories().length > 0 && (
              <div className="col-span-full mt-2">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CategoryIcon className="w-5 h-5 text-primary" />
                  Categories
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {getCategories().map(category => {
                    const categoryTasks = tasks.filter(t => t.category === category);
                    const categoryColor = categoryTasks[0]?.categoryColor || 'blue';
                    const completedCount = categoryTasks.filter(t => t.completed).length;
                    const totalCount = categoryTasks.length;
                    const completionPercentage = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
                    const highPriorityCount = categoryTasks.filter(t => t.priority === 'high').length;
                    
                    return (
                      <motion.div 
                        key={category} 
                        className={`rounded-xl p-4 bg-white dark:bg-surface-800 shadow-sm hover:shadow-md transition-all duration-300 border border-${categoryColor}-200 dark:border-${categoryColor}-900/30`}
                        whileHover={{ y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-3 h-3 rounded-full bg-${categoryColor}-500`}></div>
                          <h4 className="font-medium text-surface-800 dark:text-surface-100">{category}</h4>
                        </div>
                        
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-surface-600 dark:text-surface-400">Tasks</span>
                            <span className="font-medium">{totalCount}</span>
                          </div>
                          <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-1.5">
                            <div 
                              className={`bg-${categoryColor}-500 h-1.5 rounded-full`} 
                              style={{ width: `${completionPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
};

export default Home;