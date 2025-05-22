import { Task } from './task-service';

type TaskState = {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
};

export const initialState: TaskState = {
  tasks: [],
  isLoading: false,
  error: null,
};

type TaskAction =
  | { type: 'TASKS_LOADING' }
  | { type: 'TASKS_LOADED'; payload: Task[] }
  | { type: 'TASKS_ERROR'; payload: string }
  | { type: 'TASK_ADDED'; payload: Task }
  | { type: 'TASK_UPDATED'; payload: Task }
  | { type: 'TASK_DELETED'; payload: string };

export function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'TASKS_LOADING':
      return {
        ...state,
        isLoading: true,
      };
    case 'TASKS_LOADED':
      return {
        ...state,
        tasks: action.payload,
        isLoading: false,
        error: null,
      };
    case 'TASKS_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case 'TASK_ADDED':
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
        isLoading: false,
        error: null,
      };
    case 'TASK_UPDATED':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
        isLoading: false,
        error: null,
      };
    case 'TASK_DELETED':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
        isLoading: false,
        error: null,
      };
    default:
      return state;
  }
}