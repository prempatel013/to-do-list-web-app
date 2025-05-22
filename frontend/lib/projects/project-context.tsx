'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';
import { projectReducer, initialState } from './project-reducer';
import { Project, fetchProjects, createProject, updateProject, deleteProject } from './project-service';
import { useAuth } from '@/lib/auth/auth-context';

type ProjectContextType = {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  fetchAllProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<Project>;
  editProject: (id: string, updates: Partial<Project>) => Promise<Project>;
  removeProject: (id: string) => Promise<void>;
  getProjectById: (id: string) => Project | undefined;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAllProjects();
    }
  }, [user]);

  const fetchAllProjects = async () => {
    dispatch({ type: 'PROJECTS_LOADING' });
    try {
      const projects = await fetchProjects();
      dispatch({ type: 'PROJECTS_LOADED', payload: projects });
    } catch (error) {
      dispatch({ type: 'PROJECTS_ERROR', payload: 'Failed to load projects' });
    }
  };

  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    dispatch({ type: 'PROJECTS_LOADING' });
    try {
      const newProject = await createProject(projectData);
      dispatch({ type: 'PROJECT_ADDED', payload: newProject });
      return newProject;
    } catch (error) {
      dispatch({ type: 'PROJECTS_ERROR', payload: 'Failed to add project' });
      throw error;
    }
  };

  const editProject = async (id: string, updates: Partial<Project>) => {
    dispatch({ type: 'PROJECTS_LOADING' });
    try {
      const updatedProject = await updateProject(id, updates);
      dispatch({ type: 'PROJECT_UPDATED', payload: updatedProject });
      return updatedProject;
    } catch (error) {
      dispatch({ type: 'PROJECTS_ERROR', payload: 'Failed to update project' });
      throw error;
    }
  };

  const removeProject = async (id: string) => {
    dispatch({ type: 'PROJECTS_LOADING' });
    try {
      await deleteProject(id);
      dispatch({ type: 'PROJECT_DELETED', payload: id });
    } catch (error) {
      dispatch({ type: 'PROJECTS_ERROR', payload: 'Failed to delete project' });
      throw error;
    }
  };

  const getProjectById = (id: string) => {
    return state.projects.find(project => project.id === id);
  };

  return (
    <ProjectContext.Provider
      value={{
        projects: state.projects,
        isLoading: state.isLoading,
        error: state.error,
        fetchAllProjects,
        addProject,
        editProject,
        removeProject,
        getProjectById,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}