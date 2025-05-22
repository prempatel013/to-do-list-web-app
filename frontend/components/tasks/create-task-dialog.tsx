'use client';

import { useState } from 'react';
import { useTasks } from '@/lib/tasks/task-context';
import { useProjects } from '@/lib/projects/project-context';
import { TaskStatus, TaskPriority } from '@/lib/tasks/task-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
}

const PRIORITY_ICONS = {
  [TaskPriority.HIGH]: '🔴',
  [TaskPriority.MEDIUM]: '🟠',
  [TaskPriority.LOW]: '🔵',
};

export function CreateTaskDialog({ open, onOpenChange, defaultProjectId }: CreateTaskDialogProps) {
  const { addTask, fetchAllTasks } = useTasks();
  const { projects } = useProjects();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId || 'none');
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        status: TaskStatus.TODO,
        priority,
        dueDate: dueDate?.toISOString(),
        project: selectedProjectId === 'none' ? undefined : selectedProjectId,
        tags,
        updatedAt: new Date().toISOString(),
      };
      
      await addTask(taskData);
      toast.success('Task created successfully');
      onOpenChange(false);
      resetForm();
      fetchAllTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority(TaskPriority.MEDIUM);
    setDueDate(undefined);
    setSelectedProjectId(defaultProjectId || 'none');
    setTags([]);
    setTag('');
    setIsSubmitting(false);
  };

  const handleAddTag = (valueToAdd: string) => {
    const trimmedValue = valueToAdd.trim();
    if (trimmedValue && !tags.includes(trimmedValue)) {
      setTags([...tags, trimmedValue]);
      setTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-foreground">
            🎯 Create New Task
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5" onKeyDown={handleKeyDown}>
          <div className="space-y-2">
            <Label htmlFor="title" className="font-semibold">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="font-semibold">
              Description <span className="text-muted-foreground font-normal text-sm">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Add task details..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-semibold">Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
                <SelectTrigger className="h-12">
                  <SelectValue>{PRIORITY_ICONS[priority]} {priority.charAt(0).toUpperCase() + priority.slice(1)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                  <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="font-semibold">Due Date <span className="text-muted-foreground font-normal text-sm">(optional)</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="font-semibold">Project <span className="text-muted-foreground font-normal text-sm">(optional)</span></Label>
            <Select 
              value={selectedProjectId} 
              onValueChange={(value) => setSelectedProjectId(value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Project</SelectItem>
                {projects
                  .filter(project => project.id && project.id !== '')
                  .map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="font-semibold">Tags <span className="text-muted-foreground font-normal text-sm">(optional)</span></Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add tags..."
                id="tag-input"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="h-12 flex-grow"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
                    const latestTagValue = (e.target as HTMLInputElement).value;
                    handleAddTag(latestTagValue);
                    e.preventDefault();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => {
                  const inputElement = document.getElementById('tag-input') as HTMLInputElement;
                  if (inputElement) {
                    handleAddTag(inputElement.value);
                  }
                }}
                id="add-tag-button"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="px-3 py-1 text-sm"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 px-6"
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 