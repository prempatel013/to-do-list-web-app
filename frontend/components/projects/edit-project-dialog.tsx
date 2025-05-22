'use client';

import { useState, useEffect } from 'react';
import { useProjects } from '@/lib/projects/project-context';
import { Project, PROJECT_COLORS } from '@/lib/projects/project-service';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

type EditProjectDialogProps = {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
  const { editProject } = useProjects();
  
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [color, setColor] = useState(project.color);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update form when project changes
  useEffect(() => {
    if (open) {
      setName(project.name);
      setDescription(project.description || '');
      setColor(project.color);
    }
  }, [project, open]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }
    
    setIsSubmitting(true);
    
    editProject(project.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      color,
    })
      .then(() => {
        toast.success('Project updated successfully');
        onOpenChange(false);
      })
      .catch(() => {
        toast.error('Failed to update project');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Project Color</Label>
            <RadioGroup 
              value={color} 
              onValueChange={setColor}
              className="flex flex-wrap gap-2"
            >
              {PROJECT_COLORS.map((c) => (
                <div key={c} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={c} 
                    id={`color-${c}`} 
                    className="sr-only peer" 
                  />
                  <Label
                    htmlFor={`color-${c}`}
                    className="h-8 w-8 rounded-full cursor-pointer flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="h-4 w-4 text-white" />}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}