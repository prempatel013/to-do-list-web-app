'use client';

import { useState } from 'react';
import { useProjects } from '@/lib/projects/project-context';
import { useAuth } from '@/lib/auth/auth-context';
import { AppShell } from '@/components/layout/app-shell';
import { ProjectCard } from '@/components/projects/project-card';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderPlus, LayoutGrid, ListIcon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProjectsPage() {
  const { projects } = useProjects();
  const { requireAuth } = useAuth();
  
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const handleCreateProject = () => {
    requireAuth(() => {
      setIsCreateProjectOpen(true);
    });
  };
  
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <Button onClick={handleCreateProject} className="gap-1 sm:self-end">
              <FolderPlus className="h-4 w-4" />
              <span>New Project</span>
            </Button>
          </div>
          <p className="text-muted-foreground mt-1">
            Organize your tasks into projects
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
        
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <FolderPlus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No projects found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
              {searchQuery
                ? "No projects match your search. Try a different search term or create a new project."
                : "You don't have any projects yet. Create your first project to get started."}
            </p>
            <Button onClick={handleCreateProject} className="gap-1">
              <FolderPlus className="h-4 w-4" />
              <span>New Project</span>
            </Button>
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "flex flex-col gap-4"
          )}>
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
      
      <CreateProjectDialog
        open={isCreateProjectOpen}
        onOpenChange={setIsCreateProjectOpen}
      />
    </AppShell>
  );
}