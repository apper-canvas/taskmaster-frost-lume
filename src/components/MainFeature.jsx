import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import getIcon from '../utils/iconUtils';
import reminderService from '../utils/reminderService';

const MainFeature = ({ tasks, addTask, toggleComplete, deleteTask }) => {
  // Icon declarations
  const PlusIcon = getIcon('Plus');
  const CheckIcon = getIcon('Check');
  const XIcon = getIcon('X');
  const TrashIcon = getIcon('Trash2');
  const EditIcon = getIcon('Edit2');
  const CalendarIcon = getIcon('Calendar');
  const ClockIcon = getIcon('Clock');
  const AlertCircleIcon = getIcon('AlertCircle');
  const RepeatIcon = getIcon('Repeat');
  const InfoIcon = getIcon('Info');
  const MessageCircleIcon = getIcon('MessageCircle');
  const TagIcon = getIcon('Tag');
  const ChevronDownIcon = getIcon('ChevronDown');
  const ChevronUpIcon = getIcon('ChevronUp');
  const BellIcon = getIcon('Bell');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [formError, setFormError] = useState('');
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatType, setRepeatType] = useState('daily');
  const [customInterval, setCustomInterval] = useState(1);
  const [customUnit, setCustomUnit] = useState('days');
  const [expanded, setExpanded] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [showRepeatOptions, setShowRepeatOptions] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(30);
  const [showReminderOptions, setShowReminderOptions] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [showTaskDetails, setShowTaskDetails] = useState(null);
  
  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      setFormError('Task title is required');
      toast.error('Task title is required');
      return;
    }
    
    if (editingTaskId) {
      // Update existing task
      const updatedTasks = tasks.map(task => 
        task.id === editingTaskId
          ? { 
              ...task, 
              title, 
              description, 
              priority, 
              dueDate: dueDate || null,
              updatedAt: new Date().toISOString(),
              isRepeating, repeatType, customInterval, customUnit,
              reminder: reminderEnabled && dueDate ? { enabled: true, minutesBefore: reminderMinutesBefore } : null
            } 
          : task);
      toast.success('Task updated successfully!');

      // Update reminder if enabled
      if (reminderEnabled && dueDate) {
        const taskToUpdate = updatedTasks.find(t => t.id === editingTaskId);
        taskToUpdate.reminder = {
          enabled: true,
          minutesBefore: reminderMinutesBefore
        };
        reminderService.setReminder(taskToUpdate);
        toast.info(`Reminder set for ${reminderMinutesBefore} minutes before due date`);
      }
      
      // Reset editing state
      setEditingTaskId(null);
    } else {
      // Create new task
      const newTask = {
        id: Date.now().toString(),
        title,
        description,
        priority,
        dueDate: dueDate || null,
        completed: false,
        createdAt: new Date().toISOString(),
        // Add recurrence data if the task is repeating
        isRepeating,
        repeatType,
        customInterval,
        customUnit,
        // Track original due date for recurring calculations
        originalDueDate: dueDate || null,
        // Add reminder data if enabled
        reminder: reminderEnabled && dueDate ? {
          enabled: true,
          minutesBefore: reminderMinutesBefore
        } : null
      };
      
      // Set reminder if enabled
      if (reminderEnabled && dueDate) reminderService.setReminder(newTask);
      
      addTask(newTask);
    }
    
    // Reset form
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setIsRepeating(false);
    setRepeatType('daily');
    setCustomInterval(1);
    setCustomUnit('days');
    setReminderEnabled(false);
    setReminderMinutesBefore(30);
    setFormError('');
    setShowRepeatOptions(false);
    setExpanded(false);
  };
  
  // Start editing a task
  const startEditing = (task) => {
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setIsRepeating(task.isRepeating || false);
    setRepeatType(task.repeatType || 'daily');
    setCustomInterval(task.customInterval || 1);
    setCustomUnit(task.customUnit || 'days');
    setDueDate(task.dueDate || '');
    // Set reminder options
    setReminderEnabled(task.reminder && task.reminder.enabled || false);
    setReminderMinutesBefore(task.reminder && task.reminder.minutesBefore || 30);
    setShowReminderOptions(task.reminder && task.reminder.enabled || false);
    setEditingTaskId(task.id);
    setExpanded(true);
    setShowRepeatOptions(task.isRepeating || false);
    setShowTaskDetails(null);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setIsRepeating(false);
    setRepeatType('daily');
    setCustomInterval(1);
    setCustomUnit('days');
    setReminderEnabled(false);
    setReminderMinutesBefore(30);
    setEditingTaskId(null);
    setShowRepeatOptions(false);
    setExpanded(false);
    setFormError('');
  };
  
  // Toggle task details view
  const toggleTaskDetails = (taskId) => {
    if (showTaskDetails === taskId) {
      setShowTaskDetails(null);
    } else {
      setShowTaskDetails(taskId);
    }
  };
  
  // Request notification permission
  const requestNotificationPermission = async () => {
    const granted = await reminderService.requestPermission();
    setNotificationPermission(Notification.permission);
    if (granted) toast.success("Notification permission granted!");
    return granted;
  };
  
  // Helper for priority styling
  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-surface-100 text-surface-800 dark:bg-surface-700 dark:text-surface-200';
    }
  };

  // Helper to get the human-readable repeat text
  const getRepeatText = (task) => {
    if (!task.isRepeating) return null;
    
    switch (task.repeatType) {
      case 'daily':
        return 'Repeats daily';
      case 'weekly':
        return 'Repeats weekly';
      case 'monthly':
        return 'Repeats monthly';
      case 'custom':
        const unit = task.customUnit === 'days' 
          ? task.customInterval === 1 ? 'day' : 'days'
          : task.customUnit === 'weeks' 
            ? task.customInterval === 1 ? 'week' : 'weeks'
            : task.customUnit === 'months'
              ? task.customInterval === 1 ? 'month' : 'months'
              : 'years';
        
        return `Repeats every ${task.customInterval} ${unit}`;
      default:
        return 'Repeats';
    }
  };

  // Calculate next due date based on repeat settings
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Task Creation Form */}
      <div className="md:col-span-1">
        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-card p-5">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            {editingTaskId ? (
              <>
                <EditIcon className="w-5 h-5 mr-2 text-primary" />
                Edit Task
              </>
            ) : (
              <>
                <PlusIcon className="w-5 h-5 mr-2 text-primary" />
                Add New Task
              </>
            )}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg ${
                  formError ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="What needs to be done?"
              />
              {formError && (
                <p className="mt-1 text-sm text-red-500">{formError}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="priority" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('low')}
                  className={`flex items-center justify-center py-2 rounded-lg ${
                    priority === 'low'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-2 border-green-500'
                      : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-600'
                  }`}
                >
                  Low
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('medium')}
                  className={`flex items-center justify-center py-2 rounded-lg ${
                    priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-2 border-yellow-500'
                      : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-600'
                  }`}
                >
                  Medium
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('high')}
                  className={`flex items-center justify-center py-2 rounded-lg ${
                    priority === 'high'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-2 border-red-500'
                      : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-600'
                  }`}
                >
                  High
                </button>
              </div>
            </div>
            
            <AnimatePresence>
              {(expanded || editingTaskId) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg resize-none"
                      placeholder="Add details about this task..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="dueDate" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      id="dueDate"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  {dueDate && (
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <label className="flex items-center text-sm font-medium text-surface-700 dark:text-surface-300">
                          <input
                            type="checkbox"
                            className="mr-2 h-4 w-4 rounded border-surface-300 text-primary focus:ring-primary"
                            checked={reminderEnabled}
                            onChange={(e) => {
                              const enabled = e.target.checked;
                              setReminderEnabled(enabled);
                              if (enabled) {
                                setShowReminderOptions(true);
                                
                                // Request notification permission if not granted
                                if (notificationPermission !== 'granted') {
                                  requestNotificationPermission();
                                }
                              }
                            }}
                          />
                          Set Reminder
                        </label>
                        
                        {reminderEnabled && (
                          <button
                            type="button"
                            onClick={() => setShowReminderOptions(!showReminderOptions)}
                            className="ml-auto p-1 text-surface-500 hover:text-primary"
                          >
                            {showReminderOptions ? (
                              <ChevronUpIcon className="h-4 w-4" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                      
                      <AnimatePresence>
                        {reminderEnabled && showReminderOptions && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="pl-6 border-l-2 border-surface-200 dark:border-surface-700"
                          >
                            <div className="mb-2">
                              <p className="text-xs text-surface-600 dark:text-surface-400 mb-2">
                                Remind me before:
                              </p>
                              
                              <div className="flex items-center gap-2">
                                <select 
                                  value={reminderMinutesBefore} 
                                  onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                                  className="flex-1 py-1 text-sm"
                                >
                                  <option value="0">At due time</option>
                                  <option value="5">5 minutes before</option>
                                  <option value="10">10 minutes before</option>
                                  <option value="15">15 minutes before</option>
                                  <option value="30">30 minutes before</option>
                                  <option value="60">1 hour before</option>
                                  <option value="120">2 hours before</option>
                                  <option value="1440">1 day before</option>
                                </select>
                              </div>
                              
                              {notificationPermission !== 'granted' && (
                                <div className="mt-2 p-2 text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-800 dark:text-amber-300">
                                  <p className="flex items-center gap-1">
                                    <AlertCircleIcon className="h-3 w-3" />
                                    Browser notifications are not enabled. 
                                    <button 
                                      onClick={requestNotificationPermission}
                                      className="text-primary underline hover:no-underline"
                                    >Enable now</button>
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <label className="flex items-center text-sm font-medium text-surface-700 dark:text-surface-300">
                        <input
                          type="checkbox"
                          className="mr-2 h-4 w-4 rounded border-surface-300 text-primary focus:ring-primary"
                          checked={isRepeating}
                          onChange={(e) => {
                            setIsRepeating(e.target.checked);
                            if (e.target.checked) setShowRepeatOptions(true);
                          }}
                        />
                        Repeating Task
                      </label>
                      
                      {isRepeating && (
                        <button
                          type="button"
                          onClick={() => setShowRepeatOptions(!showRepeatOptions)}
                          className="ml-auto p-1 text-surface-500 hover:text-primary"
                        >
                          {showRepeatOptions ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                    
                    <AnimatePresence>
                      {isRepeating && showRepeatOptions && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="pl-6 border-l-2 border-surface-200 dark:border-surface-700"
                        >
                          <div className="mb-2">
                            <p className="text-xs text-surface-600 dark:text-surface-400 mb-2">
                              Repeat frequency:
                            </p>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setRepeatType('daily')}
                                className={`text-xs py-1.5 px-3 rounded-lg ${
                                  repeatType === 'daily'
                                    ? 'bg-primary text-white'
                                    : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300'
                                }`}
                              >
                                Daily
                              </button>
                              <button
                                type="button"
                                onClick={() => setRepeatType('weekly')}
                                className={`text-xs py-1.5 px-3 rounded-lg ${
                                  repeatType === 'weekly'
                                    ? 'bg-primary text-white'
                                    : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300'
                                }`}
                              >
                                Weekly
                              </button>
                              <button
                                type="button"
                                onClick={() => setRepeatType('monthly')}
                                className={`text-xs py-1.5 px-3 rounded-lg ${
                                  repeatType === 'monthly'
                                    ? 'bg-primary text-white'
                                    : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300'
                                }`}
                              >
                                Monthly
                              </button>
                              <button
                                type="button"
                                onClick={() => setRepeatType('custom')}
                                className={`text-xs py-1.5 px-3 rounded-lg ${
                                  repeatType === 'custom'
                                    ? 'bg-primary text-white'
                                    : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300'
                                }`}
                              >
                                Custom
                              </button>
                            </div>
                          </div>
                          
                          {repeatType === 'custom' && (
                            <div className="flex items-center gap-2 mb-2">
                              <input type="number" min="1" value={customInterval} onChange={(e) => setCustomInterval(parseInt(e.target.value, 10) || 1)} className="w-20 py-1 px-2 text-sm" />
                              <select value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} className="flex-1 py-1 text-sm">
                                <option value="days">days</option>
                                <option value="weeks">weeks</option>
                                <option value="months">months</option>
                                <option value="years">years</option>
                              </select>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              {!expanded && !editingTaskId ? (
                <button
                  type="button"
                  className="w-full flex items-center justify-center space-x-1 px-4 py-2 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                  onClick={() => setExpanded(true)}
                >
                  <InfoIcon className="w-4 h-4" />
                  <span>Add Details</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="w-full sm:w-auto flex items-center justify-center space-x-1 px-4 py-2 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                  onClick={cancelEditing}
                >
                  <XIcon className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              )}
              
              <button
                type="submit"
                className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                {editingTaskId ? (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    <span>Update Task</span>
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Task</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Task List */}
      <div className="md:col-span-2">
        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-card overflow-hidden">
          <div className="p-5 border-b border-surface-200 dark:border-surface-700">
            <h2 className="text-xl font-semibold">
              Your Tasks ({tasks.length})
            </h2>
          </div>
          
          <div className="divide-y divide-surface-200 dark:divide-surface-700">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                  <AlertCircleIcon className="w-8 h-8 text-surface-400" />
                </div>
                <h3 className="text-lg font-medium mb-1">No Tasks Found</h3>
                <p className="text-surface-500 dark:text-surface-400 max-w-xs">
                  You don't have any tasks yet. Create your first task to get started!
                </p>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto scrollbar-hide">
                <AnimatePresence initial={false}>
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="group"
                    >
                      <div className="p-4 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleComplete(task.id)}
                            className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border ${
                              task.completed
                                ? 'bg-primary border-primary'
                                : 'border-surface-300 dark:border-surface-600'
                            } flex items-center justify-center transition-colors`}
                            aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                          >
                            {task.completed && (
                              <CheckIcon className="w-3 h-3 text-white" />
                            )}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <div 
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1 cursor-pointer"
                              onClick={() => toggleTaskDetails(task.id)}
                            >
                              <h3 className={`font-medium ${
                                task.completed
                                  ? 'line-through text-surface-400'
                                  : 'text-surface-900 dark:text-surface-100'
                              }`}>
                                {task.title}
                              </h3>
                              
                              <div className="flex items-center flex-wrap gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityStyles(task.priority)}`}>
                                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                </span>
                                
                                {task.isRepeating && (
                                  <span className="text-xs flex items-center gap-1 px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light rounded-full">
                                    <RepeatIcon className="w-3 h-3" />
                                    Recurring
                                  </span>
                                )}
                                
                                {task.reminder && task.reminder.enabled && (
                                  <span className="text-xs flex items-center gap-1 px-2 py-1 bg-secondary/10 dark:bg-secondary/20 text-secondary dark:text-secondary-light rounded-full">
                                    <BellIcon className="w-3 h-3" />
                                    Reminder
                                  </span>
                                )}
                                
                                {task.dueDate && (
                                  <span className="text-xs flex items-center gap-1 px-2 py-1 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-full">
                                    <CalendarIcon className="w-3 h-3" />
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center text-xs text-surface-500 dark:text-surface-400 gap-2">
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                              </span>
                              
                              {task.description && (
                                <span className="flex items-center gap-1">
                                  <MessageCircleIcon className="w-3 h-3" />
                                  Has description
                                </span>
                              )}
                               
                               {task.isRepeating && (
                                 <span className="flex items-center gap-1">
                                   <RepeatIcon className="w-3 h-3" />
                                   {getRepeatText(task)}
                                 </span>
                                )}
                                
                                {task.reminder && task.reminder.enabled && (
                                  <span className="flex items-center gap-1">
                                    <BellIcon className="w-3 h-3" />
                                    {task.reminder.minutesBefore === 0 
                                      ? 'At due time' 
                                      : `${task.reminder.minutesBefore} ${task.reminder.minutesBefore === 1 ? 'minute' : 'minutes'} before`
                                    }
                                  </span>
                               )}
                            </div>
                            
                            {/* Task Details */}
                            <AnimatePresence>
                              {showTaskDetails === task.id && task.description && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="mt-3 bg-surface-50 dark:bg-surface-700/50 p-3 rounded-lg"
                                >
                                  <p className="text-sm text-surface-700 dark:text-surface-300">
                                    {task.description}
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditing(task)}
                              className="p-2 text-surface-500 hover:text-primary dark:text-surface-400 dark:hover:text-primary-light rounded-full hover:bg-surface-200 dark:hover:bg-surface-700"
                              aria-label="Edit task"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="p-2 text-surface-500 hover:text-red-500 dark:text-surface-400 dark:hover:text-red-400 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700"
                              aria-label="Delete task"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainFeature;