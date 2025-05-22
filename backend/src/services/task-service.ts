import { Task } from '../models/task';
import NotificationService from './notification-service';
import { User } from '../models/user';

class TaskService {
  private static instance: TaskService;
  private tasks: Map<string, Task[]>;
  private users: Map<string, User>;

  private constructor() {
    this.tasks = new Map();
    this.users = new Map();
  }

  public static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  public async getTasksByUserId(userId: string): Promise<Task[]> {
    return this.tasks.get(userId) || [];
  }

  public async createTask(task: Task, user?: User): Promise<Task> {
    const userTasks = this.tasks.get(task.userId) || [];
    userTasks.push(task);
    this.tasks.set(task.userId, userTasks);

    // Generate notifications for the new task
    const notificationService = NotificationService.getInstance();
    if (user) {
      notificationService.generateTaskReminders([task], user);
    }

    return task;
  }

  public async updateTask(taskId: string, userId: string, updates: Partial<Task>, user?: User): Promise<Task | null> {
    const userTasks = this.tasks.get(userId) || [];
    const taskIndex = userTasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      return null;
    }

    const updatedTask = { ...userTasks[taskIndex], ...updates };
    userTasks[taskIndex] = updatedTask;
    this.tasks.set(userId, userTasks);

    // Regenerate notifications for the updated task
    const notificationService = NotificationService.getInstance();
    if (user) {
      notificationService.generateTaskReminders([updatedTask], user);
    }

    return updatedTask;
  }

  public async deleteTask(taskId: string, userId: string): Promise<boolean> {
    const userTasks = this.tasks.get(userId) || [];
    const taskIndex = userTasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      return false;
    }

    userTasks.splice(taskIndex, 1);
    this.tasks.set(userId, userTasks);
    return true;
  }
}

export default TaskService; 