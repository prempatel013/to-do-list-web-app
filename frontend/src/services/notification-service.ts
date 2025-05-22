import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Notification {
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
  private token: string | null = null;

  private constructor() {
    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  public clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  public async getNotifications(): Promise<Notification[]> {
    try {
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  public async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await axios.post(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        {
          headers: this.getHeaders(),
        }
      );
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  public async clearNotifications(): Promise<boolean> {
    try {
      await axios.delete(`${API_URL}/notifications`, {
        headers: this.getHeaders(),
      });
      return true;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }
  }
}

export default NotificationService; 