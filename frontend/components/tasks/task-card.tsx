'use client';

import { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '@/lib/tasks/task-service';
import { useAuth } from '@/lib/auth/auth-context';
import { useTasks } from '@/lib/tasks/task-context';
import { useProjects } from '@/lib/projects/project-context';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { EditTaskDialog } from './edit-task-dialog';
import { toast } from 'sonner';

type TaskCardProps = {
  task: Task;
  isCompact?: boolean;
};

export function TaskCard({ task, isCompact }: TaskCardProps) {
  const { requireAuth } = useAuth();
  const { editTask, removeTask } = useTasks();
  const { getProjectById } = useProjects();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const project = task.project ? getProjectById(task.project) : undefined;
  
  const priorityClasses = {
    [TaskPriority.LOW]: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
    [TaskPriority.MEDIUM]: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
    [TaskPriority.HIGH]: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
  };
  
  const priorityLabels = {
    [TaskPriority.LOW]: 'Low',
    [TaskPriority.MEDIUM]: 'Medium',
    [TaskPriority.HIGH]: 'High',
  };
  
  const handleStatusChange = () => {
    requireAuth(() => {
      const newStatus = task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
      
      editTask(task.id, {
        status: newStatus,
        completedAt: newStatus === TaskStatus.DONE ? new Date().toISOString() : undefined,
      }).then(() => {
        if (newStatus === TaskStatus.DONE) {
          toast.success('Task completed!');
        }
      });
    });
  };
  
  const handleDeleteTask = () => {
    requireAuth(() => {
      removeTask(task.id).then(() => {
        toast.success('Task deleted successfully');
      });
    });
  };

  const isCompleted = task.status === TaskStatus.DONE;
  
  return (
    <>
      <Card className={cn(
        "transition-all hover:shadow-md border",
        isCompleted && "opacity-70",
        isCompact && "p-2"
      )}>
        <CardContent className={cn("p-4", isCompact && "p-2")}>
          <div className="flex items-start gap-3">
            <Checkbox 
              checked={isCompleted}
              onCheckedChange={handleStatusChange}
              className="mt-1"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className={cn(
                  "text-sm font-medium leading-none",
                  isCompleted && "line-through text-muted-foreground",
                  isCompact && "text-xs"
                )}>
                  {task.title}
                </h3>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDeleteTask}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {task.description && (
                <p className={cn(
                  "text-xs text-muted-foreground mt-1 mb-2 line-clamp-2",
                  isCompleted && "line-through",
                  isCompact && "hidden"
                )}>
                  {task.description}
                </p>
              )}
              
              <div className={cn("flex flex-wrap items-center gap-2 mt-2", isCompact && "mt-1 gap-1")}>
                {task.dueDate && (
                  <div className={cn("flex items-center", isCompact && "items-start")}>
                    <Calendar className={cn("h-3 w-3 mr-1 text-muted-foreground", isCompact && "h-2.5 w-2.5 mt-0.5")} />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(task.dueDate), 'MMM d')}
                    </span>
                  </div>
                )}
                
                <Badge variant="outline" className={cn(
                  "text-xs font-normal",
                  priorityClasses[task.priority],
                  isCompact && "text- міні px-1 py-0"
                )}>
                  {priorityLabels[task.priority]}
                </Badge>
                
                {project && (
                  <Badge 
                    variant="outline" 
                    className="text-xs font-normal"
                    style={{ 
                      backgroundColor: `${project.color}20`, 
                      color: project.color, 
                      borderColor: `${project.color}40` 
                    }}
                  >
                    {project.name}
                  </Badge>
                )}
                
                {task.tags && task.tags.length > 0 && (
                  task.tags.slice(0, 1).map(tag => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className={cn("text-xs font-normal", isCompact && "text- міні px-1 py-0")}
                    >
                      {tag}
                    </Badge>
                  ))
                )}
                
                {task.tags && task.tags.length > 1 && (
                  <Badge variant="secondary" className={cn("text-xs font-normal", isCompact && "text- міні px-1 py-0")}>
                    +{task.tags.length - 1}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <EditTaskDialog
        task={task}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  );
}