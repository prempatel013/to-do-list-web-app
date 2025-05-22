'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';
import { taskReducer, initialState } from './task-reducer';
import { Task, fetchTasks, createTask, updateTask, deleteTask } from './task-service';
import { useAuth } from '@/lib/auth/auth-context';

type TaskContextType = {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchAllTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>;
  editTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  removeTask: (id: string) => Promise<void>;
  getTasksByProject: (projectId: string) => Task[];
  getTodayTasks: () => Task[];
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAllTasks();
    }
  }, [user]);

  const fetchAllTasks = async () => {
    console.log('Attempting to fetch all tasks...'); // Log start of fetch
    dispatch({ type: 'TASKS_LOADING' });
    try {
      const tasks = await fetchTasks();
      console.log('Tasks fetched successfully:', tasks); // Log successful fetch with data
      dispatch({ type: 'TASKS_LOADED', payload: tasks });
    } catch (error) {
      console.error('Failed to fetch tasks:', error); // Log fetch error
      dispatch({ type: 'TASKS_ERROR', payload: 'Failed to load tasks' });
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    dispatch({ type: 'TASKS_LOADING' });
    try {
      if (!user) throw new Error('User not authenticated');
      console.log('Adding new task with data:', taskData); // Debug log
      const newTask = await createTask(taskData, user.id);
      console.log('New task added successfully:', newTask); // Debug log
      dispatch({ type: 'TASK_ADDED', payload: newTask });
      return newTask;
    } catch (error) {
      console.error('Failed to add task in context:', error);
      dispatch({ type: 'TASKS_ERROR', payload: 'Failed to add task' });
      throw error;
    }
  };

  const editTask = async (id: string, updates: Partial<Task>) => {
    dispatch({ type: 'TASKS_LOADING' });
    try {
      // Find the task to update from the current state
      const taskToUpdate = state.tasks.find(task => task.id === id);

      if (!taskToUpdate) {
        console.error('Task not found for update:', id);
        throw new Error('Task not found');
      }

      // Create the updated task object by merging existing data with updates
      const updatedTaskData = { ...taskToUpdate, ...updates };

      // Call the updated updateTask service function with the full task object
      const updatedTask = await updateTask(updatedTaskData);
      
      dispatch({ type: 'TASK_UPDATED', payload: updatedTask });
      return updatedTask;
    } catch (error) {
      console.error('Failed to update task in context:', error);
      dispatch({ type: 'TASKS_ERROR', payload: 'Failed to update task' });
      throw error;
    }
  };

  const removeTask = async (id: string) => {
    dispatch({ type: 'TASKS_LOADING' });
    try {
      await deleteTask(id);
      dispatch({ type: 'TASK_DELETED', payload: id });
    } catch (error) {
      dispatch({ type: 'TASKS_ERROR', payload: 'Failed to delete task' });
      throw error;
    }
  };

  const getTasksByProject = (projectId: string) => {
    return state.tasks.filter(task => task.projectId === projectId);
  };

  const getTodayTasks = () => {
    const today = new Date();
    // Use UTC date components for comparison
    const todayUTCYear = today.getUTCFullYear();
    const todayUTCMonth = today.getUTCMonth();
    const todayUTCDate = today.getUTCDate();

    return state.tasks.filter(task => {
      if (!task.dueDate) return false;

      try {
        // Explicitly parse the ISO string to a Date object
        const taskDate = new Date(task.dueDate);

        // Check if the date is valid before comparing
        if (isNaN(taskDate.getTime())) {
          console.error('Invalid dueDate string for task:', task.id, task.dueDate);
          return false;
        }

        // Compare year, month, and day using UTC values
        return (
          taskDate.getUTCFullYear() === todayUTCYear &&
          taskDate.getUTCMonth() === todayUTCMonth &&
          taskDate.getUTCDate() === todayUTCDate
        );
      } catch (error) {
        console.error('Error processing dueDate for task:', task.id, task.dueDate, error);
        return false;
      }
    });
  };

  return (
    <TaskContext.Provider
      value={{
        tasks: state.tasks,
        isLoading: state.isLoading,
        error: state.error,
        fetchAllTasks,
        addTask,
        editTask,
        removeTask,
        getTasksByProject,
        getTodayTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}