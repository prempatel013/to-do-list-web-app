'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useProjects } from '@/lib/projects/project-context';
import { PROJECT_COLORS } from '@/lib/projects/project-service';
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

type CreateProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { requireAuth } = useAuth();
  const { addProject } = useProjects();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const resetForm = () => {
    setName('');
    setDescription('');
    setColor(PROJECT_COLORS[0]);
    setIsSubmitting(false);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }
    
    requireAuth(() => {
      setIsSubmitting(true);
      
      addProject({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      })
        .then(() => {
          toast.success('Project created successfully');
          onOpenChange(false);
          resetForm();
        })
        .catch(() => {
          toast.error('Failed to create project');
          setIsSubmitting(false);
        });
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              placeholder="Enter project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add details about this project"
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
                    id={c} 
                    className="sr-only peer" 
                  />
                  <Label
                    htmlFor={c}
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
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}