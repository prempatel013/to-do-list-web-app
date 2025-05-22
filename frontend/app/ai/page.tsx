'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/lib/auth/auth-context';
import { sendMessage, getChatHistory, clearChatHistory, AIMessage, AIMessageRequest } from '@/lib/ai/ai-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Send, Trash, Bot, UserCircle, Copy, StopCircle, MoreVertical, Keyboard, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { sanitizeInput } from '@/lib/utils/sanitize';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTasks } from '@/lib/tasks/task-context';
import { Task, TaskStatus, TaskPriority } from '@/lib/tasks/task-service';
import { isToday, isTomorrow, isThisWeek, isPast } from 'date-fns';

// Message type definition
interface Message extends AIMessage {
  isSending?: boolean;
  error?: string;
}

// Add this new component at the top of the file, after the imports
const ThinkingAnimation = () => (
  <div className="flex items-center gap-2 text-muted-foreground">
    <div className="flex gap-1">
      <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
      <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
      <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
    </div>
    <span className="text-sm">Thinking...</span>
  </div>
);

export default function AIPage() {
  const { requireAuth } = useAuth();
  const { tasks, getTodayTasks } = useTasks();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userScrolled, setUserScrolled] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [messageQueue, setMessageQueue] = useState<Message[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  
  // Add keyboard shortcuts help
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Debounce input changes
  const debouncedInputValue = useDebounce(inputValue, 300);
  
  useEffect(() => {
    const loadChatHistory = async () => {
      setIsLoading(true);
      try {
        const history = await getChatHistory();
        setMessages(history);
      } catch (error) {
        console.error('Failed to load chat history:', error);
        toast.error('Failed to load chat history. Please try again later.', {
          action: {
            label: 'Retry',
            onClick: loadChatHistory
          }
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChatHistory();
    // Auto-focus input on load
    inputRef.current?.focus();
  }, []);
  
  useEffect(() => {
    if (!userScrolled) {
      scrollToBottom();
    }
  }, [messages, userScrolled]);
  
  const scrollToBottom = useCallback(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setUserScrolled(!isNearBottom);
  }, []);
  
  // Handle optimistic updates for sending messages
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    requireAuth(async () => {
      const sanitizedMessage = sanitizeInput(inputValue);
      const tempId = `temp-${Date.now()}`;
      
      // Optimistically add message
      const optimisticMessage: Message = {
        id: tempId,
        content: sanitizedMessage,
        role: 'user',
        timestamp: new Date().toISOString(),
        isSending: true
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setInputValue('');
      setIsSending(true);
      setIsGenerating(true);
      
      // Create new AbortController for this request
      const controller = new AbortController();
      setAbortController(controller);
      
      try {
        const normalizedQuery = sanitizedMessage.toLowerCase().trim();
        let tasksForBackend: string[] = [];

        // Determine which task data to send based on the query
        if (normalizedQuery.includes("today")) {
          tasksForBackend = getTodayTasks().map(task => task.title);
        } else if (normalizedQuery.includes("pending") || normalizedQuery.includes("incomplete")) {
          tasksForBackend = tasks.filter(task => task.status !== TaskStatus.DONE).map(task => task.title);
        } else if (normalizedQuery.includes("completed")) {
          tasksForBackend = tasks.filter(task => task.status === TaskStatus.DONE).map(task => task.title);
        } else if (normalizedQuery.includes("overdue")) {
           const now = new Date();
           tasksForBackend = tasks.filter(task => task.dueDate && isPast(new Date(task.dueDate)) && task.status !== TaskStatus.DONE).map(task => task.title);
        } else if (normalizedQuery.includes("upcoming")) {
             const now = new Date();
             tasksForBackend = tasks.filter(task => task.dueDate && !isPast(new Date(task.dueDate)) && task.status !== TaskStatus.DONE).map(task => task.title);
        } else if (normalizedQuery.includes("highest priority")) {
            // Find the task with the highest priority
            const highestPriorityTask = tasks.sort((a, b) => {
                 const priorityOrder = { [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
                 return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            })[0]; // Get the first task after sorting
            if (highestPriorityTask) {
                 tasksForBackend = [highestPriorityTask.title]; // Send only the title of the highest priority task
            }
        } else if (normalizedQuery.includes("due tomorrow")) {
             tasksForBackend = tasks.filter(task => task.dueDate && isTomorrow(new Date(task.dueDate)) && task.status !== TaskStatus.DONE).map(task => task.title);
        } else if (normalizedQuery.includes("due this week")) {
              tasksForBackend = tasks.filter(task => task.dueDate && isThisWeek(new Date(task.dueDate), { weekStartsOn: 1 }) && task.status !== TaskStatus.DONE).map(task => task.title);
        } else if (normalizedQuery.includes("sort my tasks by priority")) {
             tasksForBackend = tasks.sort((a, b) => {
                 const priorityOrder = { [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
                 return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            }).map(task => task.title);
        } else if (normalizedQuery.includes("personal tasks")) {
            // Assuming personal tasks have a specific tag or project ID
            // You might need to adjust this filter based on your task structure
            tasksForBackend = tasks.filter(task => task.tags?.includes('personal')).map(task => task.title); // Example: filtering by 'personal' tag
        } else if (normalizedQuery.includes("tasks due today")) {
             tasksForBackend = getTodayTasks().map(task => task.title);
        } else if (normalizedQuery.includes("tasks due this weekend")) {
            // You would need to implement a helper function similar to isToday/isTomorrow for weekend
             tasksForBackend = tasks.filter(task => 
                 task.dueDate && 
                 (new Date(task.dueDate).getDay() === 6 || new Date(task.dueDate).getDay() === 0) && // Saturday or Sunday
                 task.status !== TaskStatus.DONE
            ).map(task => task.title);
        }
        // Add more conditions for other list-based queries as needed (e.g., for Monday, next week, in the next 3 days, by category/list, by team, etc.)

        // Send the message with task context if applicable
        const messageRequest: AIMessageRequest = {
          text: sanitizedMessage,
          tasks: tasksForBackend
        };

        const assistantResponseText = await sendMessage(messageRequest, controller.signal);

        // Update messages state with user message and assistant response
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, isSending: false, error: undefined } // Clear sending state on user message
            : msg
        ));
        
        const assistantMessage: Message = {
          id: `ai-${Date.now()}`,
          content: assistantResponseText,
          role: 'assistant',
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, assistantMessage]);

        setUserScrolled(false);

      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          toast.info('Message generation stopped');
        } else {
          console.error('Failed to send message:', error);
          // Update optimistic message with error state
          setMessages(prev => prev.map(msg => 
            msg.id === tempId 
              ? { ...msg, isSending: false, error: 'Failed to send message' }
              : msg
          ));
          toast.error('Failed to send message. Please try again.', {
            action: {
              label: 'Retry',
              onClick: () => handleSendMessage()
            }
          });
        }
      } finally {
        setIsSending(false);
        setIsGenerating(false);
        setAbortController(null);
      }
    });
  };
  
  const handleClearChat = async () => {
    requireAuth(async () => {
      try {
        await clearChatHistory();
        setMessages([]);
        toast.success('Chat history cleared');
      } catch (error) {
        console.error('Failed to clear chat history:', error);
        toast.error('Failed to clear chat history. Please try again.');
      }
    });
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Message copied to clipboard');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const stopGenerating = () => {
    if (abortController) {
      abortController.abort();
      setIsGenerating(false);
      setMessages(prev => prev.map(msg => 
        msg.isSending ? { ...msg, isSending: false, error: 'Generation stopped' } : msg
      ));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-96px)]">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">AI Mentor</h1>
          </div>
          <div className="flex items-center gap-2">
             {isGenerating && (
              <Button variant="outline" size="sm" onClick={stopGenerating}>
                <StopCircle className="h-4 w-4 mr-2" />
                Stop Generating
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleClearChat} disabled={messages.length === 0 || isSending || isGenerating}>
              <Trash className="h-4 w-4 mr-2" />
              Clear Chat
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4" onScroll={handleScroll} ref={scrollAreaRef}>
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {isLoading ? (
              // Skeleton loading state
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-start gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : messages.length === 0 ? (
              // Empty state
              <Card className="w-full text-center py-8 opacity-80">
                <CardContent className="flex flex-col items-center justify-center">
                  <Sparkles className="h-8 w-8 mb-4 text-muted-foreground" />
                  <h2 className="text-lg font-semibold mb-2">Start Chatting with your AI Mentor</h2>
                  <p className="text-sm text-muted-foreground mb-4">Ask questions about your tasks, productivity, or anything else!</p>
                </CardContent>
              </Card>
            ) : (
              // Display messages
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className={
                    `flex items-start gap-3 group ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`
                  }
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5" />
                    </div>
                  )}
                  <div
                    className={
                      `flex flex-col ${
                        message.role === 'user'
                          ? 'items-end bg-blue-500 text-white rounded-lg rounded-tr-none'
                          : 'items-start bg-muted rounded-lg rounded-tl-none'
                      } p-3 max-w-[80%] shadow-sm`
                    }
                  >

                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              {message.isSending ? (
                                <ThinkingAnimation />
                              ) : (
                                <p className="whitespace-pre-wrap">{message.content}</p>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs opacity-70">
                                {message.timestamp
                                  ? new Date(message.timestamp).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'No time'}
                              </p>
                              {message.role === 'assistant' && !message.isSending && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        aria-label="Message actions"
                                      >
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => handleCopyMessage(message.content)}
                                      >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </div>
                      </div>
                      
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center flex-shrink-0">
                      <UserCircle className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messageEndRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-3xl mx-auto">
            <Input
              ref={inputRef}
              placeholder="Ask your AI Mentor..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending || isGenerating}
            />
            <Button type="submit" disabled={!inputValue.trim() || isSending || isGenerating}>
              {isSending || isGenerating ? <StopCircle className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send message</span>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10" aria-label="Keyboard shortcuts">
                  <Keyboard className="h-5 w-5" />
                  <span className="sr-only">Keyboard shortcuts</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Keyboard Shortcuts</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <p className="font-medium">Focus Input</p>
                    <p className="text-sm text-muted-foreground">Ctrl + K or Cmd + K</p>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <p className="font-medium">Send Message</p>
                    <p className="text-sm text-muted-foreground">Enter</p>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <p className="font-medium">New Line</p>
                    <p className="text-sm text-muted-foreground">Shift + Enter</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </form>
          {userScrolled && messages.length > 1 && (
            <div className="fixed bottom-24 right-8 transform transition-all duration-200 hover:scale-110">
              <Button
                variant="secondary"
                size="icon"
                onClick={scrollToBottom}
                className="h-10 w-10 rounded-full shadow-lg bg-background/80 backdrop-blur-sm"
                aria-label="Scroll to latest message"
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}