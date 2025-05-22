'use client';

import { Project } from '@/lib/projects/project-service';
import { useProjects } from '@/lib/projects/project-context';
import { useTasks } from '@/lib/tasks/task-context';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit, FilePlus, FolderOpen, MoreHorizontal, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EditProjectDialog } from './edit-project-dialog';
import { CreateTaskDialog } from '../tasks/create-task-dialog';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/auth-context';
import Link from 'next/link';

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const { requireAuth } = useAuth();
  const { removeProject } = useProjects();
  const { getTasksByProject } = useTasks();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  
  const taskCount = getTasksByProject(project.id).length;
  
  const handleDelete = () => {
    requireAuth(() => {
      removeProject(project.id)
        .then(() => {
          toast.success('Project deleted successfully');
          setIsDeleteDialogOpen(false);
        })
        .catch(() => {
          toast.error('Failed to delete project');
        });
    });
  };
  
  return (
    <>
      <Card className="h-full transition-all hover:shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div
              className="h-10 w-10 rounded-md flex items-center justify-center"
              style={{ backgroundColor: `${project.color}30` }}
            >
              <span
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: project.color }}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsAddTaskDialogOpen(true)}>
                  <FilePlus className="mr-2 h-4 w-4" />
                  Add Task
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-1">{project.name}</h3>
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between items-center border-t p-4">
          <span className="text-sm text-muted-foreground">
            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
          </span>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1" 
            asChild
          >
            <Link href={`/projects/${project.id}`}>
              <FolderOpen className="h-4 w-4" />
              <span>Open</span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
      
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
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <EditProjectDialog
        project={project}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
      
      <CreateTaskDialog
        open={isAddTaskDialogOpen}
        onOpenChange={setIsAddTaskDialogOpen}
        defaultProjectId={project.id}
      />
    </>
  );
}