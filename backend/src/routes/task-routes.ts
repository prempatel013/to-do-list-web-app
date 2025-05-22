import express, { Request, Response } from 'express';
import TaskService from '../services/task-service';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const taskService = TaskService.getInstance();

// Get all tasks for the authenticated user
router.get('/tasks', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
    } else {
      const userId = req.user.id;
      const tasks = await taskService.getTasksByUserId(userId);
      res.json(tasks);
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create a new task
router.post('/tasks', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
    } else {
      const userId = req.user.id;
      const task = {
        ...req.body,
        userId,
        id: Date.now().toString(), // Simple ID generation
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const createdTask = await taskService.createTask(task);
      res.status(201).json(createdTask);
    }
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update a task
router.put('/tasks/:taskId', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
    } else {
      const { taskId } = req.params;
      const userId = req.user.id;
      const updates = {
        ...req.body,
        updatedAt: new Date()
      };
      const updatedTask = await taskService.updateTask(taskId, userId, updates);
      
      if (!updatedTask) {
        res.status(404).json({ error: 'Task not found' });
      } else {
        res.json(updatedTask);
      }
    }
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
router.delete('/tasks/:taskId', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
    } else {
      const { taskId } = req.params;
      const userId = req.user.id;
      const success = await taskService.deleteTask(taskId, userId);
      
      if (!success) {
        res.status(404).json({ error: 'Task not found' });
      } else {
        res.json({ success: true });
      }
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router; 