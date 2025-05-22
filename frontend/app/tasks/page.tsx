'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useTasks } from '@/lib/tasks/task-context';
import { TaskPriority, TaskStatus } from '@/lib/tasks/task-service';
import { AppShell } from '@/components/layout/app-shell';
import { TaskCard } from '@/components/tasks/task-card';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, Filter, Plus, Search, SlidersHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjects } from '@/lib/projects/project-context';
import { FloatingAddTaskButton } from '@/components/tasks/floating-add-task-button';

export default function TasksPage() {
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { requireAuth } = useAuth();
  
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'dueDate'>('dueDate');
  const [isCompactViewEnabled, setIsCompactViewEnabled] = useState(false);
  
  // Load compact view setting from localStorage on mount
  useEffect(() => {
    const savedCompactView = localStorage.getItem('compactViewEnabled');
    if (savedCompactView !== null) {
      setIsCompactViewEnabled(JSON.parse(savedCompactView));
    }
  }, []);
  
  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = !statusFilter || task.status === statusFilter;
    
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    
    const matchesProject = !projectFilter || 
      (projectFilter === 'none' && !task.project) || 
      task.project === projectFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });
  
  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0;
  });
  
  // Group tasks by status for tab view
  const todoTasks = sortedTasks.filter(task => task.status === TaskStatus.TODO);
  const inProgressTasks = sortedTasks.filter(task => task.status === TaskStatus.IN_PROGRESS);
  const completedTasks = sortedTasks.filter(task => task.status === TaskStatus.DONE);
  
  const handleCreateTask = () => {
    requireAuth(() => {
      setIsCreateTaskOpen(true);
    });
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter(null);
    setPriorityFilter(null);
    setProjectFilter(null);
  };
  
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <Button onClick={handleCreateTask} className="gap-1 sm:self-end">
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </Button>
          </div>
          <p className="text-muted-foreground mt-1">
            Manage and organize all your tasks in one place
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1">
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={statusFilter === null}
                  onCheckedChange={() => setStatusFilter(null)}
                >
                  All
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilter === TaskStatus.TODO}
                  onCheckedChange={() => setStatusFilter(statusFilter === TaskStatus.TODO ? null : TaskStatus.TODO)}
                >
                  To Do
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilter === TaskStatus.IN_PROGRESS}
                  onCheckedChange={() => setStatusFilter(statusFilter === TaskStatus.IN_PROGRESS ? null : TaskStatus.IN_PROGRESS)}
                >
                  In Progress
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilter === TaskStatus.DONE}
                  onCheckedChange={() => setStatusFilter(statusFilter === TaskStatus.DONE ? null : TaskStatus.DONE)}
                >
                  Done
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Priority</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={priorityFilter === null}
                  onCheckedChange={() => setPriorityFilter(null)}
                >
                  All
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={priorityFilter === TaskPriority.HIGH}
                  onCheckedChange={() => setPriorityFilter(priorityFilter === TaskPriority.HIGH ? null : TaskPriority.HIGH)}
                >
                  High
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={priorityFilter === TaskPriority.MEDIUM}
                  onCheckedChange={() => setPriorityFilter(priorityFilter === TaskPriority.MEDIUM ? null : TaskPriority.MEDIUM)}
                >
                  Medium
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={priorityFilter === TaskPriority.LOW}
                  onCheckedChange={() => setPriorityFilter(priorityFilter === TaskPriority.LOW ? null : TaskPriority.LOW)}
                >
                  Low
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Project</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={projectFilter === null}
                  onCheckedChange={() => setProjectFilter(null)}
                >
                  All
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={projectFilter === 'none'}
                  onCheckedChange={() => setProjectFilter(projectFilter === 'none' ? null : 'none')}
                >
                  No Project
                </DropdownMenuCheckboxItem>
                {projects.map(project => (
                  <DropdownMenuCheckboxItem
                    key={project.id}
                    checked={projectFilter === project.id}
                    onCheckedChange={() => setProjectFilter(projectFilter === project.id ? null : project.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                
                <DropdownMenuSeparator />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="gap-1 w-[150px]">
                <SlidersHorizontal className="h-4 w-4" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="todo" className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>To Do</span>
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                {todoTasks.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="done" className="flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Done</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {sortedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No tasks found</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
                  {searchQuery || statusFilter || priorityFilter || projectFilter
                    ? "No tasks match your filters. Try adjusting your filters or create a new task."
                    : "You don't have any tasks yet. Create your first task to get started."}
                </p>
                <div className="flex gap-3">
                  {(searchQuery || statusFilter || priorityFilter || projectFilter) && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                  <Button onClick={handleCreateTask} className="gap-1">
                    <Plus className="h-4 w-4" />
                    <span>New Task</span>
                  </Button>
                </div>
              </div>
            ) : (
              sortedTasks.map((task) => (
                <TaskCard key={task.id} task={task} isCompact={isCompactViewEnabled} />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="todo" className="space-y-4">
            {todoTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium">No to-do tasks</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
                  {searchQuery || priorityFilter || projectFilter
                    ? "No to-do tasks match your filters. Try adjusting your filters or create a new task."
                    : "You don't have any to-do tasks. Create a new task to get started."}
                </p>
                <Button onClick={handleCreateTask} className="gap-1">
                  <Plus className="h-4 w-4" />
                  <span>New Task</span>
                </Button>
              </div>
            ) : (
              todoTasks.map((task) => (
                <TaskCard key={task.id} task={task} isCompact={isCompactViewEnabled} />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="in-progress" className="space-y-4">
            {inProgressTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium">No in-progress tasks</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
                  {searchQuery || priorityFilter || projectFilter
                    ? "No in-progress tasks match your filters. Try adjusting your filters."
                    : "You don't have any in-progress tasks yet."}
                </p>
              </div>
            ) : (
              inProgressTasks.map((task) => (
                <TaskCard key={task.id} task={task} isCompact={isCompactViewEnabled} />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="done" className="space-y-4">
            {completedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium">No completed tasks</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
                  {searchQuery || priorityFilter || projectFilter
                    ? "No completed tasks match your filters. Try adjusting your filters."
                    : "You haven't completed any tasks yet. Start by completing a task."}
                </p>
              </div>
            ) : (
              completedTasks.map((task) => (
                <TaskCard key={task.id} task={task} isCompact={isCompactViewEnabled} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
      />
      <FloatingAddTaskButton />
    </AppShell>
  );
}