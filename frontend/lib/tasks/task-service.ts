// Mock task data and service

import { getToken } from '@/lib/auth/auth-service';

// Task priority enum
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

// Task status enum
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

// Task interface
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  project?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  project?: string;
  tags: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  project?: string;
  tags?: string[];
  completedAt?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Task service functions
export const fetchTasks = async (): Promise<Task[]> => {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/tasks/`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to fetch tasks');
  
  const tasks = await res.json();

  // Map backend snake_case 'due_date' to frontend camelCase 'dueDate'
  const mappedTasks = tasks.map((task: any) => ({
    ...task,
    dueDate: task.due_date,
    // Ensure other snake_case fields are also mapped if necessary
    // For example, if backend returns 'created_at': createdAt: task.created_at,
  }));

  return mappedTasks;
};

export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt'>, userId: string): Promise<Task> => {
  const token = getToken();
  console.log('Token from getToken:', token); // Debug log
  
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }
  
  // Map camelCase to snake_case and add user_id
  const mappedTaskData: any = {
    title: taskData.title,
    description: taskData.description,
    status: taskData.status,
    priority: taskData.priority,
    due_date: taskData.dueDate,
    project_id: taskData.project,
    tags: taskData.tags,
    attachments: [], // or taskData.attachments if you support it
    user_id: userId,
  };
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
  console.log('Request headers:', headers); // Debug log
  
  try {
    const res = await fetch(`${API_URL}/api/tasks/`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify(mappedTaskData),
    });
    
    if (!res.ok) {
      const error = await res.text();
      console.error('Task creation error:', error); // Debug log
      throw new Error(error || 'Failed to create task');
    }
    return await res.json();
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};

export const updateTask = async (task: Task): Promise<Task> => {
  const token = getToken();
  console.log('Updating task with token:', token); // Debug log
  
  if (!token) {
    throw new Error('No authentication token found. Please log in again to update tasks.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
  console.log('Request headers for updateTask:', headers); // Debug log

  // Map camelCase to snake_case for the entire task object
  const mappedTask: any = {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate,
    project_id: task.project,
    tags: task.tags,
    attachments: [], // Assuming attachments are not updated here
    // user_id is not needed for update
  };

  try {
    const res = await fetch(`${API_URL}/api/tasks/${task.id}/`, {
      method: 'PUT',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify(mappedTask),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Task update error:', res.status, error); // Debug log
      
      let errorMessage = 'Failed to update task';
      try {
        const errorJson = JSON.parse(error);
        if (errorJson.detail === 'Task not found or not updated') {
          errorMessage = 'Task not found or you do not have permission to update it.';
        }
      } catch (e) {
        // Ignore parsing errors, use default message
      }

      throw new Error(errorMessage);
    }
    return await res.json();
  } catch (error) {
    console.error('Task update failed:', error);
    throw error;
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/tasks/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to delete task');
};