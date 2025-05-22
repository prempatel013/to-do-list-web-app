'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjects } from '@/lib/projects/project-context';
import { useTasks } from '@/lib/tasks/task-context';
import { TaskStatus } from '@/lib/tasks/task-service';
import { AppShell } from '@/components/layout/app-shell';
import { TaskCard } from '@/components/tasks/task-card';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { EditProjectDialog } from '@/components/projects/edit-project-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, Edit, FilePlus, LayoutGrid, ListIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const { projects, getProjectById, removeProject } = useProjects();
  const { getTasksByProject } = useTasks();
  
  const project = getProjectById(projectId);
  const projectTasks = getTasksByProject(projectId);
  
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isCompactViewEnabled, setIsCompactViewEnabled] = useState(false);
  
  // Load compact view setting from localStorage on mount
  useEffect(() => {
    const savedCompactView = localStorage.getItem('compactViewEnabled');
    if (savedCompactView !== null) {
      setIsCompactViewEnabled(JSON.parse(savedCompactView));
    }
  }, []);
  
  // Redirect if project not found
  if (!project) {
    if (projects.length > 0) {
      router.push('/projects');
      return null;
    } else {
      // Show loading until projects are loaded
      return (
        <AppShell>
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </AppShell>
      );
    }
  }
  
  // Group tasks by status
  const todoTasks = projectTasks.filter(task => task.status === TaskStatus.TODO);
  const inProgressTasks = projectTasks.filter(task => task.status === TaskStatus.IN_PROGRESS);
  const completedTasks = projectTasks.filter(task => task.status === TaskStatus.DONE);
  
  const handleDeleteProject = async () => {
    try {
      await removeProject(project.id);
      toast.success('Project deleted successfully');
      router.push('/projects');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };
  
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-md flex items-center justify-center"
              style={{ backgroundColor: `${project.color}30` }}
            >
              <span
                className="h-5 w-5 rounded-full"
                style={{ backgroundColor: project.color }}
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              {project.description && (
                <p className="text-muted-foreground mt-1">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 h-9"
              onClick={() => setIsEditProjectOpen(true)}
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-1 h-9"
              onClick={() => setIsCreateTaskOpen(true)}
            >
              <FilePlus className="h-4 w-4" />
              <span>Add Task</span>
            </Button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="font-normal px-2 py-0.5 text-sm">
              {projectTasks.length} {projectTasks.length === 1 ? 'task' : 'tasks'}
            </Badge>
            <Badge variant="outline" className="font-normal px-2 py-0.5 text-sm">
              Created {new Date(project.createdAt).toLocaleDateString()}
            </Badge>
          </div>
          
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-none rounded-l-md",
                viewMode === 'grid' && "bg-muted"
              )}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-none rounded-r-md",
                viewMode === 'list' && "bg-muted"
              )}
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
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
          
          <TabsContent value="all">
            {projectTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <FilePlus className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No tasks in this project</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
                  This project doesn't have any tasks yet. Add your first task to get started.
                </p>
                <Button onClick={() => setIsCreateTaskOpen(true)} className="gap-1">
                  <FilePlus className="h-4 w-4" />
                  <span>Add Task</span>
                </Button>
              </div>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "flex flex-col gap-4"
              )}>
                {projectTasks.map((task) => (
                  <TaskCard key={task.id} task={task} isCompact={isCompactViewEnabled} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="todo">
            {todoTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium">No to-do tasks</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
                  There are no to-do tasks in this project.
                </p>
                <Button onClick={() => setIsCreateTaskOpen(true)} className="gap-1">
                  <FilePlus className="h-4 w-4" />
                  <span>Add Task</span>
                </Button>
              </div>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "flex flex-col gap-4"
              )}>
                {todoTasks.map((task) => (
                  <TaskCard key={task.id} task={task} isCompact={isCompactViewEnabled} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="in-progress">
            {inProgressTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium">No in-progress tasks</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
                  There are no in-progress tasks in this project.
                </p>
              </div>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "flex flex-col gap-4"
              )}>
                {inProgressTasks.map((task) => (
                  <TaskCard key={task.id} task={task} isCompact={isCompactViewEnabled} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="done">
            {completedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium">No completed tasks</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
                  There are no completed tasks in this project.
                </p>
              </div>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "flex flex-col gap-4"
              )}>
                {completedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} isCompact={isCompactViewEnabled} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 border-t pt-6">
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete Project
          </Button>
        </div>
      </div>
      
      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        defaultProjectId={project.id}
      />
      
      <EditProjectDialog
        project={project}
        open={isEditProjectOpen}
        onOpenChange={setIsEditProjectOpen}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project "{project.name}" and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}