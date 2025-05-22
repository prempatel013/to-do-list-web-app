import { Task } from '../models/task';
import { User } from '../models/user';
import { addHours, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';

export interface TaskReminder {
  id: string;
  message: string;
  type: 'task' | 'system';
  read: boolean;
  createdAt: string;
  taskId?: string;
  userId?: string;
  title?: string;
  dueDate?: Date;
}

class NotificationService {
  private static instance: NotificationService;
  private reminders: Map<string, TaskReminder[]> = new Map();

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Generate reminders for tasks due soon
  generateTaskReminders(tasks: Task[], user: User): TaskReminder[] {
    const now = new Date();
    const reminders: TaskReminder[] = [];

    tasks.forEach(task => {
      if (!task.dueDate || task.status === 'DONE') return;

      const dueDate = new Date(task.dueDate);
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Generate reminders for tasks due within the next 24 hours
      if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
        const reminder: TaskReminder = {
          id: `reminder-${task.id}-${Date.now()}`,
          taskId: task.id,
          userId: user.id,
          title: task.title,
          message: this.generateReminderMessage(task, hoursUntilDue),
          type: 'task',
          read: false,
          createdAt: new Date().toISOString(),
          dueDate: dueDate
        };
        reminders.push(reminder);
      }
    });

    // Store reminders for the user
    const userReminders = this.reminders.get(user.id) || [];
    this.reminders.set(user.id, [...userReminders, ...reminders]);

    return reminders;
  }

  // Get reminders for a user
  getUserReminders(userId: string): TaskReminder[] {
    return this.reminders.get(userId) || [];
  }

  // Mark a reminder as read
  markReminderAsRead(userId: string, reminderId: string): void {
    const userReminders = this.reminders.get(userId) || [];
    const updatedReminders = userReminders.map(reminder => 
      reminder.id === reminderId ? { ...reminder, read: true } : reminder
    );
    this.reminders.set(userId, updatedReminders);
  }

  // Clear all reminders for a user
  clearUserReminders(userId: string): void {
    this.reminders.set(userId, []);
  }

  // Generate appropriate reminder message based on time until due
  private generateReminderMessage(task: Task, hoursUntilDue: number): string {
    if (hoursUntilDue <= 1) {
      return `Urgent: "${task.title}" is due in less than an hour!`;
    } else if (hoursUntilDue <= 3) {
      return `Reminder: "${task.title}" is due in ${Math.round(hoursUntilDue)} hours`;
    } else if (hoursUntilDue <= 12) {
      return `Upcoming: "${task.title}" is due in ${Math.round(hoursUntilDue)} hours`;
    } else {
      return `Reminder: "${task.title}" is due tomorrow`;
    }
  }
}

export default NotificationService; 