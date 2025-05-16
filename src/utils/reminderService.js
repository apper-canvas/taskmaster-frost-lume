import { toast } from 'react-toastify';
import * as taskService from '../services/taskService';

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
    try {
      if (!('Notification' in window)) {
        toast.warning('Your browser does not support notifications');
        return false;
      }
      
      if (Notification.permission === 'granted') {
        this.notificationPermission = 'granted';
        return true;
      }
      
      // If permission is not determined yet, show an explanatory modal first
      if (Notification.permission !== 'denied') {
        // Create and show the permission modal
        const showPermissionModal = () => {
          return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'permissions-modal-backdrop';
            modal.innerHTML = `
              <div class="permissions-modal">
                <div class="permissions-modal-content">
                  <h3>Enable Notifications</h3>
                  <p>TaskMaster would like to send you notifications for your upcoming tasks.</p>
                  <p>You'll be asked by your browser to allow notifications next.</p>
                  <div class="permissions-modal-buttons">
                    <button id="cancel-permission" class="btn-outline">Cancel</button>
                    <button id="proceed-permission" class="btn-primary">Continue</button>
                  </div>
                </div>
              </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add event listeners for buttons
            document.getElementById('cancel-permission').addEventListener('click', () => {
              modal.classList.add('permissions-modal-closing');
              setTimeout(() => {
                document.body.removeChild(modal);
                resolve(false);
              }, 300);
            });
            
            document.getElementById('proceed-permission').addEventListener('click', () => {
              modal.classList.add('permissions-modal-closing');
              setTimeout(() => {
                document.body.removeChild(modal);
                resolve(true);
              }, 300);
            });
          });
        };
        
        const shouldProceed = await showPermissionModal();
        if (!shouldProceed) return false;
        // Now request the permission using the browser's built-in dialog
        const permission = await Notification.requestPermission();
        this.notificationPermission = permission;
        
        if (permission === 'denied') {
          toast.warning('Notification permission was denied. Please enable notifications in your browser settings to receive reminders.');
        } else if (permission === 'granted') {
          toast.success('Notifications enabled successfully!');
        }
        
        return permission === 'granted';
      } else {
        toast.warning('Notification permission was denied. Please enable notifications in your browser settings to receive reminders.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      console.error('An error occurred while requesting notification permission');
      return false;
    }
    return false;
  }

  async loadReminders() {
    try {
      // Try to get reminders from localStorage first for offline capability
      let storedReminders = localStorage.getItem('taskReminders');
      let remindersLoaded = false;
      
      if (storedReminders) {
        this.reminders = JSON.parse(storedReminders);
        remindersLoaded = true;
      }
      
      // If authentication is available, also try to load tasks with reminders from the server
      try {
        const tasks = await taskService.fetchTasks();
        const tasksWithReminders = tasks.filter(task => 
          task.reminder && task.dueDate && !task.completed
        );
        
        // Set reminders for each eligible task
        tasksWithReminders.forEach(task => this.setReminder(task));
      } catch (error) {
        console.error('Failed to load tasks with reminders from server', error);
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

  // Get tasks due tomorrow
  getTomorrowsTasks(tasks) {
    if (!tasks || !Array.isArray(tasks)) return [];
    
    // Get tomorrow's date in YYYY-MM-DD format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    return tasks.filter(task => task.dueDate === tomorrowStr && !task.completed);
  }
}

export default new ReminderService();