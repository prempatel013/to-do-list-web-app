'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, Search, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { useState, useEffect } from 'react';
import { NotificationDropdown } from '@/components/layout/notification-dropdown';
import { useTasks } from '@/lib/tasks/task-context';
import { TaskStatus } from '@/lib/tasks/task-service';
import { type Notification } from '@/services/notification-service';

type HeaderProps = {
  onMenuClick: () => void;
  sidebarOpen: boolean;
};

export function Header({ onMenuClick, sidebarOpen }: HeaderProps) {
  const { user, isAuthenticated, logout, openLoginModal } = useAuth();
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const { tasks } = useTasks();
  const [remindedTasks, setRemindedTasks] = useState<string[]>([]);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);

  // Load reminded tasks from localStorage on component mount
  useEffect(() => {
    const savedRemindedTasks = localStorage.getItem('remindedTasks');
    if (savedRemindedTasks) {
      setRemindedTasks(JSON.parse(savedRemindedTasks));
    }
  }, []);

  // Save reminded tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('remindedTasks', JSON.stringify(remindedTasks));
  }, [remindedTasks]);

  // Get pending notifications (tasks due today that are not done)
  const pendingNotifications = tasks.filter(task => {
    if (!task.dueDate || task.status === TaskStatus.DONE) return false;
    
    try {
      const taskDueDate = new Date(task.dueDate);
      const today = new Date();
      
      // Reset time portions for accurate date comparison
      taskDueDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      // Check if task is due today and hasn't been reminded
      return taskDueDate.getTime() === today.getTime() && !remindedTasks.includes(task.id);
    } catch (error) {
      console.error('Error processing task due date:', error);
      return false;
    }
  }).map((task): Notification => ({
    id: task.id, // Use task ID as notification ID for now
    message: `Task "${task.title}" is due today.`, // Create a simple message
    type: 'task', // Type of notification
    read: false, // Assume unread initially
    createdAt: task.createdAt, // Use task creation date for sorting
    // Include other relevant task fields if needed for display in dropdown
    taskId: task.id,
    title: task.title,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined, // Convert string to Date object only if dueDate exists
  }));

  const handleClearNotifications = () => {
    // Add all current notifications to reminded tasks
    const newRemindedTasks = pendingNotifications.map(notification => notification.id);
    setRemindedTasks(prev => {
      const updated = [...prev, ...newRemindedTasks];
      // Remove duplicates using filter
      return updated.filter((taskId, index) => updated.indexOf(taskId) === index);
    });
  };

  return (
    <header className="sticky top-0 z-[100] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              size="sm"
              onClick={() => setCreateTaskOpen(true)}
              className="gap-1 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline-block">New Task</span>
            </Button>

            {isAuthenticated && (
              <NotificationDropdown 
                notifications={pendingNotifications}
                onClearNotifications={handleClearNotifications}
                open={isNotificationDropdownOpen}
                onOpenChange={setIsNotificationDropdownOpen}
              />
            )}

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[100]">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/settings">Settings</a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => logout()}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" onClick={openLoginModal}>
                Log in
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
      />
    </header>
  );
}