import { Project } from './project-service';

type ProjectState = {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
};

export const initialState: ProjectState = {
  projects: [],
  isLoading: false,
  error: null,
};

type ProjectAction =
  | { type: 'PROJECTS_LOADING' }
  | { type: 'PROJECTS_LOADED'; payload: Project[] }
  | { type: 'PROJECTS_ERROR'; payload: string }
  | { type: 'PROJECT_ADDED'; payload: Project }
  | { type: 'PROJECT_UPDATED'; payload: Project }
  | { type: 'PROJECT_DELETED'; payload: string };

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'PROJECTS_LOADING':
      return {
        ...state,
        isLoading: true,
      };
    case 'PROJECTS_LOADED':
      return {
        ...state,
        projects: action.payload,
        isLoading: false,
        error: null,
      };
    case 'PROJECTS_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case 'PROJECT_ADDED':
      return {
        ...state,
        projects: [...state.projects, action.payload],
        isLoading: false,
        error: null,
      };
    case 'PROJECT_UPDATED':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? action.payload : project
        ),
        isLoading: false,
        error: null,
      };
    case 'PROJECT_DELETED':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        isLoading: false,
        error: null,
      };
    default:
      return state;
  }
}