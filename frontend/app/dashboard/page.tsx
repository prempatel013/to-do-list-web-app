'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useTasks } from '@/lib/tasks/task-context';
import { TaskStatus, Task } from '@/lib/tasks/task-service';
import { useProjects } from '@/lib/projects/project-context';
import { getAISuggestions, AISuggestion } from '@/lib/ai/ai-service';
import { AppShell } from '@/components/layout/app-shell';
import { TaskCard } from '@/components/tasks/task-card';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarClock, CheckCircle, Circle, Clock, LightbulbIcon, Plus, RefreshCw, Bell, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import { FloatingAddTaskButton } from '@/components/tasks/floating-add-task-button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { NotificationDropdown } from '@/components/layout/notification-dropdown';
import NotificationService, { type Notification } from '@/services/notification-service';
import { Input } from '@/components/ui/input';

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, openLoginModal } = useAuth();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [remindedTasks, setRemindedTasks] = useState<string[]>([]);
  const [pendingNotifications, setPendingNotifications] = useState<Notification[]>([]);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const notificationService = NotificationService.getInstance();

  const filteredTasks = tasks.filter(task => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return task.title.toLowerCase().includes(lowerCaseQuery) ||
           (task.description?.toLowerCase().includes(lowerCaseQuery) || false);
  });

  console.log('Search Query:', searchQuery, 'Filtered Tasks:', filteredTasks);

  const todayTasks = filteredTasks.filter(task => {
    if (!task.dueDate) {
       console.log('Task', task.id, 'has no dueDate');
      return false;
    }

    try {
      const taskDueDate = new Date(task.dueDate);
      const today = new Date();

      console.log('Checking task', task.id, ': dueDate string =', task.dueDate, '; taskDueDate object =', taskDueDate, '; today object =', today);

      if (isNaN(taskDueDate.getTime())) {
        console.error('Invalid dueDate string for task:', task.id, task.dueDate);
        return false;
      }

      taskDueDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      console.log('Task', task.id, ': taskDueDate start of day =', taskDueDate, '; today start of day =', today, '; Match =', taskDueDate.getTime() === today.getTime());

      return taskDueDate.getTime() === today.getTime();
    } catch (error) {
      console.error('Error processing dueDate for task:', task.id, task.dueDate, error);
      return false;
    }
  });
  const pendingTasks = filteredTasks.filter(t => t.status !== TaskStatus.DONE);
  const completedTasks = filteredTasks.filter(t => t.status === TaskStatus.DONE);
  
  useEffect(() => {
    if (isAuthenticated && user) {
      // Display welcome message on login
      toast.success(`Welcome back, ${user.name}!`);
      
      const loadSuggestions = async () => {
        setLoadingSuggestions(true);
        try {
          const data = await getAISuggestions();
          setSuggestions(data);
        } catch (error) {
          console.error('Failed to load suggestions:', error);
        } finally {
          setLoadingSuggestions(false);
        }
      };
      
      loadSuggestions();
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    // Set up hourly reminder interval
    const reminderInterval = setInterval(() => {
      const now = new Date();
      todayTasks.forEach(task => {
        if (task.dueDate && task.status !== TaskStatus.DONE && !remindedTasks.includes(task.id)) {
          const dueDate = new Date(task.dueDate);
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date();
          todayEnd.setHours(23, 59, 59, 999);

          // Check if the task is due today and in the future
          if (dueDate >= todayStart && dueDate <= todayEnd && dueDate > now) {
            // Check if a notification for this task already exists in pendingNotifications
            if (!pendingNotifications.some(notif => notif.taskId === task.id)) {
              // Create a Notification object from the Task
              const notification: Notification = {
                id: `task-reminder-${task.id}-${Date.now()}`, // Unique ID for the notification
                taskId: task.id, // Link back to the task
                title: task.title, // Include task title
                dueDate: task.dueDate ? new Date(task.dueDate) : undefined, // Include task due date
                message: `Task "${task.title}" is due today.`, // Simple message
                type: 'task',
                read: false,
                createdAt: new Date().toISOString(),
              };
              setPendingNotifications(prev => [...prev, notification]);
              setRemindedTasks(prev => [...prev, task.id]);
            }
          }
        }
      });
    }, 60 * 60 * 1000); // Check every hour

    // Clear interval on component unmount
    return () => clearInterval(reminderInterval);

  }, [isAuthenticated, tasks, remindedTasks, pendingNotifications]);
  
  const refreshSuggestions = async () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    setLoadingSuggestions(true);
    try {
      const data = await getAISuggestions();
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to refresh suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddTask = () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    setIsCreateTaskOpen(true);
  };
  
  // Function to clear notifications
  const handleClearNotifications = async () => {
    const success = await notificationService.clearNotifications();
    if (success) {
      setPendingNotifications([]);
      setRemindedTasks([]); // Also clear reminded tasks when clearing notifications
    }
  };

  // Function to mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    const success = await notificationService.markAsRead(notificationId);
    if (success) {
      setPendingNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6 dark:bg-black dark:text-white">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground dark:text-gray-400">
            {isAuthenticated
              ? `Welcome back, ${user?.name}!`
              : 'Welcome to TaskSphere!'}
          </p>
        </div>
        
        {/* Notification Icon and Dropdown */}
        {isAuthenticated && (
          <div className="absolute top-4 right-4 z-10">
             <NotificationDropdown 
               notifications={pendingNotifications} 
               onClearNotifications={handleClearNotifications}
               onMarkAsRead={handleMarkAsRead}
               open={isNotificationDropdownOpen}
               onOpenChange={setIsNotificationDropdownOpen}
             />
          </div>
        )}
        
        <div className="flex w-full flex-1 md:w-auto md:flex-none">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px] dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isAuthenticated ? pendingTasks.length : '—'}</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400">
                {isAuthenticated 
                  ? `${pendingTasks.length === 1 ? 'task' : 'tasks'} pending`
                  : 'Sign in to view tasks'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isAuthenticated ? completedTasks.length : '—'}</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400">
                {isAuthenticated 
                  ? `${completedTasks.length === 1 ? 'task' : 'tasks'} completed`
                  : 'Sign in to view tasks'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isAuthenticated ? projects.length : '—'}</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400">
                {isAuthenticated 
                  ? `${projects.length === 1 ? 'project' : 'projects'} created`
                  : 'Sign in to view projects'}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">Today's Tasks</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={handleAddTask}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Task</span>
                </Button>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  todayTasks.length > 0 ? (
                    <div className="space-y-4">
                      {todayTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <CalendarClock className="h-12 w-12 text-muted-foreground/50 mb-3" />
                      <h3 className="text-lg font-medium">No tasks for today</h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
                        You don't have any tasks scheduled for today. Add a new task to get started.
                      </p>
                      <Button 
                        onClick={handleAddTask}
                        className="gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Task</span>
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CalendarClock className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <h3 className="text-lg font-medium">Sign in to view tasks</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
                      Create an account or sign in to start managing your tasks.
                    </p>
                    <Button 
                      onClick={() => openLoginModal()}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Sign In</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Task Overview</CardTitle>
                <CardDescription>Your recent task activity</CardDescription>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  <Tabs defaultValue="pending">
                    <TabsList>
                      <TabsTrigger value="pending" className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Pending</span>
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Completed</span>
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending" className="mt-4 space-y-4">
                      {pendingTasks.slice(0, 5).map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      {pendingTasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Circle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                          <h3 className="text-lg font-medium">No pending tasks</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            All your tasks are completed. Good job!
                          </p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="completed" className="mt-4 space-y-4">
                      {completedTasks.slice(0, 5).map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      {completedTasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <CheckCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                          <h3 className="text-lg font-medium">No completed tasks</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Complete some tasks to see them here.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Circle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <h3 className="text-lg font-medium">Sign in to view tasks</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create an account or sign in to start managing your tasks.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">AI Suggestions</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={loadingSuggestions}
                  onClick={refreshSuggestions}
                >
                  <RefreshCw className={`h-4 w-4 ${loadingSuggestions ? 'animate-spin' : ''}`} />
                </Button>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  loadingSuggestions ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="space-y-4">
                      {suggestions.map((suggestion) => (
                        <Card key={suggestion.id}>
                          <CardContent className="p-4 flex items-start gap-3">
                            <div
                              className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10"
                            >
                              <LightbulbIcon className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm">{suggestion.text}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)} suggestion
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <LightbulbIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
                      <h3 className="text-lg font-medium">No suggestions yet</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add some tasks to get personalized suggestions.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <LightbulbIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <h3 className="text-lg font-medium">Sign in for AI suggestions</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create an account or sign in to get personalized task suggestions.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
      />
      
      {isAuthenticated && <FloatingAddTaskButton />}
    </AppShell>
  );
}