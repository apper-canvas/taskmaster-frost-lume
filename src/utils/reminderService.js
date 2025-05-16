import { toast } from 'react-toastify';

class ReminderService {
  constructor() {
    this.reminders = [];
    this.notificationPermission = 'default';
    this.init();
  }

  init() {
    // Check notification permission
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
    }
    
    // Restore reminders from localStorage
    this.loadReminders();
    
    // Set up interval to check reminders every minute
    setInterval(() => this.checkReminders(), 60000);
    
    // Check immediately as well
    this.checkReminders();
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      toast.warning('Your browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      this.notificationPermission = 'granted';
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      return permission === 'granted';
    }
    
    toast.warning('Notification permission was denied. Please enable notifications in your browser settings to receive reminders.');
    return false;
  }

  loadReminders() {
    try {
      const storedReminders = localStorage.getItem('taskReminders');
      if (storedReminders) {
        this.reminders = JSON.parse(storedReminders);
      }
    } catch (error) {
      console.error('Error loading reminders from localStorage:', error);
    }
  }

  saveReminders() {
    try {
      localStorage.setItem('taskReminders', JSON.stringify(this.reminders));
    } catch (error) {
      console.error('Error saving reminders to localStorage:', error);
    }
  }

  // Create or update a reminder for a task
  setReminder(task) {
    if (!task.dueDate || !task.reminder || !task.reminder.enabled) {
      this.cancelReminder(task.id);
      return;
    }

    // Calculate when to send the reminder
    const dueDate = new Date(task.dueDate);
    const reminderTime = new Date(dueDate);
    
    // Set reminder based on minutes before due date
    reminderTime.setMinutes(reminderTime.getMinutes() - task.reminder.minutesBefore);
    
    // Remove any existing reminder for this task
    this.cancelReminder(task.id);
    
    // Create new reminder
    const reminder = {
      id: task.id,
      taskTitle: task.title,
      dueDate: task.dueDate,
      reminderTime: reminderTime.toISOString(),
      minutesBefore: task.reminder.minutesBefore,
      isRecurring: task.isRepeating,
      notified: false
    };
    
    this.reminders.push(reminder);
    this.saveReminders();
    
    return reminder;
  }

  // Cancel a reminder for a task
  cancelReminder(taskId) {
    const initialLength = this.reminders.length;
    this.reminders = this.reminders.filter(reminder => reminder.id !== taskId);
    
    if (initialLength !== this.reminders.length) {
      this.saveReminders();
    }
  }

  // Check if reminders need to be triggered
  checkReminders() {
    const now = new Date();
    let updated = false;
    
    this.reminders.forEach(reminder => {
      if (reminder.notified) return;
      
      const reminderTime = new Date(reminder.reminderTime);
      if (reminderTime <= now) {
        this.triggerReminder(reminder);
        reminder.notified = true;
        updated = true;
      }
    });
    
    // Clean up old reminders
    const oldCount = this.reminders.length;
    this.reminders = this.reminders.filter(reminder => {
      // Keep unnotified reminders
      if (!reminder.notified) return true;
      
      // Keep notified reminders for recurring tasks
      if (reminder.isRecurring) return true;
      
      // Remove other notified reminders
      return false;
    });
    
    if (updated || oldCount !== this.reminders.length) {
      this.saveReminders();
    }
  }

  // Show a notification for a reminder
  triggerReminder(reminder) {
    const timeUntilDue = reminder.minutesBefore === 0 ? 'now' : 
      `in ${reminder.minutesBefore} ${reminder.minutesBefore === 1 ? 'minute' : 'minutes'}`;
    
    toast.info(`Reminder: "${reminder.taskTitle}" is due ${timeUntilDue}!`, { autoClose: 5000 });
    
    if (this.notificationPermission === 'granted') {
      new Notification('Task Reminder', { 
        body: `"${reminder.taskTitle}" is due ${timeUntilDue}!`,
        icon: '/favicon.ico'
      });
    }
  }
}

export default new ReminderService();