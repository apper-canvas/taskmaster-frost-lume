/**
 * Service for handling task operations with the Apper backend
 */

// Map our task object to the database schema
const mapTaskToDbRecord = (task) => {
  return {
    title: task.title,
    description: task.description || '',
    priority: task.priority || 'medium',
    dueDate: task.dueDate || null,
    completed: task.completed || false,
    isRepeating: task.isRepeating || false,
    repeatType: task.repeatType || null,
    customInterval: task.customInterval || null,
    customUnit: task.customUnit || null,
    reminder: task.reminder?.enabled || false,
    reminderMinutesBefore: task.reminder?.minutesBefore || 0,
    category: task.category || null,
    categoryColor: task.categoryColor || null
  };
};

// Map from database record to our task object model
const mapDbRecordToTask = (record) => {
  return {
    id: record.id.toString(),
    title: record.title,
    description: record.description,
    priority: record.priority,
    dueDate: record.dueDate,
    completed: record.completed,
    isRepeating: record.isRepeating,
    repeatType: record.repeatType,
    customInterval: record.customInterval,
    customUnit: record.customUnit,
    category: record.category,
    categoryColor: record.categoryColor,
    createdAt: record.createdOn,
    reminder: record.reminder ? {
      enabled: record.reminder,
      minutesBefore: record.reminderMinutesBefore
    } : null
  };
};

export const fetchTasks = async () => {
  try {
    const { ApperClient } = window.ApperSDK;
    const client = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });

    const params = {
      fields: [
        'id', 'title', 'description', 'priority', 'dueDate', 'completed',
        'isRepeating', 'repeatType', 'customInterval', 'customUnit',
        'reminder', 'reminderMinutesBefore', 'category', 'categoryColor',
        'createdOn', 'modifiedOn'
      ],
      where: [
      ],
      orderBy: [
        {
          field: 'createdOn',
          direction: 'desc'
        }
      ]
    };

    const response = await client.fetchRecords('task28', params);
    console.log('Params', params)
    
    if (!response || !response.data) {
      return [];
    }
    
    return response.data.map(mapDbRecordToTask);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const createTask = async (task) => {
  try {
    const { ApperClient } = window.ApperSDK;
    const client = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });

    const dbRecord = mapTaskToDbRecord(task);
    
    const params = {
      records: [dbRecord]
    };

    const response = await client.createRecord('task28', params);
    
    if (!response || !response.success || !response.results || !response.results[0].success) {
      throw new Error(response?.results?.[0]?.message || 'Failed to create task');
    }
    
    return mapDbRecordToTask(response.results[0].data);
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = async (task) => {
  try {
    const { ApperClient } = window.ApperSDK;
    const client = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });

    const dbRecord = {
      ...mapTaskToDbRecord(task),
      id: parseInt(task.id) // Need to include the ID for updates
    };
    
    const params = {
      records: [dbRecord]
    };

    const response = await client.updateRecord('task28', params);
    
    if (!response || !response.success || !response.results || !response.results[0].success) {
      throw new Error(response?.results?.[0]?.message || 'Failed to update task');
    }
    
    return mapDbRecordToTask(response.results[0].data);
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    const { ApperClient } = window.ApperSDK;
    const client = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });

    const params = {
      recordIds: [parseInt(taskId)]
    };

    const response = await client.deleteRecord('task28', params);
    
    if (!response || !response.success || !response.results || !response.results[0].success) {
      throw new Error(response?.results?.[0]?.message || 'Failed to delete task');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};