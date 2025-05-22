// Mock AI assistant service

import { getToken } from '@/lib/auth/auth-service';
import { API_URL } from '@/lib/config';

export interface AISuggestion {
  id: string;
  text: string;
  type: 'task' | 'productivity' | 'reminder';
  timestamp?: string;
}

export interface AIMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export type ChatHistory = AIMessage[];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Sample suggestions
const SAMPLE_SUGGESTIONS: AISuggestion[] = [
  {
    id: '1',
    text: 'Schedule time to review project proposals',
    type: 'task',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    text: 'Take a short break every 50 minutes for better productivity',
    type: 'productivity',
    timestamp: new Date().toISOString(),
  },
  {
    id: '3',
    text: 'Don\'t forget about the team meeting tomorrow at 10 AM',
    type: 'reminder',
    timestamp: new Date().toISOString(),
  },
  {
    id: '4',
    text: 'Group similar tasks together to be more efficient',
    type: 'productivity',
    timestamp: new Date().toISOString(),
  },
  {
    id: '5',
    text: 'Prioritize high-impact tasks for the morning hours',
    type: 'productivity',
    timestamp: new Date().toISOString(),
  },
];

// Mock conversation history
let CHAT_HISTORY: ChatHistory = [
  {
    id: '1',
    content: 'Hello! How can I help you organize your tasks today?',
    role: 'assistant',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

// Add validation constants
const MAX_MESSAGE_LENGTH = 1000;
const MIN_MESSAGE_LENGTH = 1;

// Add validation function
function validateMessage(message: string): void {
  if (!message || message.trim().length < MIN_MESSAGE_LENGTH) {
    throw new Error('Message cannot be empty');
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`);
  }
}

// Add custom error types
export class AIError extends Error {
  constructor(
    message: string,
    public type: 'validation' | 'network' | 'auth' | 'server' | 'unknown',
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AIError';
  }
}

// Add message type definitions
export interface AIMessageRequest {
  text: string;
  tasks?: string[];
  priority?: 'low' | 'medium' | 'high';
  context?: Record<string, any>;
}

// Update validation function
function validateMessageRequest(request: AIMessageRequest): void {
  if (!request.text || request.text.trim().length < MIN_MESSAGE_LENGTH) {
    throw new AIError('Message cannot be empty', 'validation');
  }
  if (request.text.length > MAX_MESSAGE_LENGTH) {
    throw new AIError(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`, 'validation');
  }
  if (request.tasks && request.tasks.length > 10) {
    throw new AIError('Cannot include more than 10 tasks', 'validation');
  }
  if (request.tasks) {
    request.tasks.forEach((task, index) => {
      if (task.length > 200) {
        throw new AIError(`Task ${index + 1} cannot exceed 200 characters`, 'validation');
      }
    });
  }
  if (request.priority && !['low', 'medium', 'high'].includes(request.priority)) {
    throw new AIError('Priority must be low, medium, or high', 'validation');
  }
}

// AI service functions
export const getAISuggestions = async (): Promise<AISuggestion[]> => {
  const token = getToken();
  
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }
  
  try {
    const res = await fetch(`${API_URL}/api/ai/suggestions`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || 'Failed to fetch AI suggestions');
    }
    return await res.json();
  } catch (error) {
    console.error('Failed to get AI suggestions:', error);
    throw error;
  }
};

export async function getChatHistory(): Promise<AIMessage[]> {
  const token = getToken();
  
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }
  
  const response = await fetch(`${API_URL}/api/ai/history`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch chat history');
  }
  
  // Extract the messages array from the response object
  const historyResponse = await response.json();
  if (!historyResponse || !Array.isArray(historyResponse.messages)) {
      throw new Error('Invalid chat history response format');
  }
  return historyResponse.messages as AIMessage[];
}

export async function sendMessage(
  message: string | AIMessageRequest,
  signal?: AbortSignal
): Promise<string> {
  const token = getToken();
  
  if (!token) {
    throw new AIError('No authentication token found. Please log in again.', 'auth');
  }

  try {
    // Convert string message to AIMessageRequest if needed
    const messageRequest: AIMessageRequest = typeof message === 'string' 
      ? { text: message }
      : message;

    // Validate message request
    validateMessageRequest(messageRequest);
    
    const response = await fetch(`${API_URL}/api/ai/mentor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(messageRequest),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to send message';
      let errorType: 'validation' | 'network' | 'auth' | 'server' | 'unknown' = 'unknown';

      // Map HTTP status codes to error types
      switch (response.status) {
        case 400:
          errorType = 'validation';
          errorMessage = errorText || 'Invalid request format';
          break;
        case 401:
          errorType = 'auth';
          errorMessage = 'Authentication failed. Please log in again.';
          break;
        case 422:
          errorType = 'validation';
          errorMessage = errorText || 'Invalid message format';
          break;
        case 429:
          errorType = 'server';
          errorMessage = 'Rate limit exceeded. Please try again later.';
          break;
        case 500:
          errorType = 'server';
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = errorText || 'An unexpected error occurred';
      }

      throw new AIError(errorMessage, errorType, response.status);
    }
    
    // Parse the response body and return the assistant's message
    const responseData = await response.json();
    if (!responseData || typeof responseData.response !== 'string') {
        throw new AIError('Invalid response format from server', 'server');
    }
    
    return responseData.response;

  } catch (error) {
    if (error instanceof AIError) {
      throw error;
    }
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new AIError('Request was cancelled', 'network');
      }
      throw new AIError(error.message, 'network');
    }
    throw new AIError('An unexpected error occurred', 'unknown');
  }
}

export async function clearChatHistory(): Promise<void> {
  const token = getToken();
  
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }
  
  const response = await fetch(`${API_URL}/api/ai/history`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to clear chat history');
  }
}

export async function updateMessage(
  messageId: string,
  content: string
): Promise<void> {
  const token = getToken();
  
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }
  
  const response = await fetch(`${API_URL}/api/ai/messages/${messageId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error('Failed to update message');
  }
}