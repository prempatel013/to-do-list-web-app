// Mock project data and service

import { getToken } from '@/lib/auth/auth-service';

// Project interface
export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt?: string;
}

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Color options for projects
export const PROJECT_COLORS = [
  '#6C63FF', // Primary violet
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#FFD166', // Yellow
  '#06D6A0', // Green
  '#118AB2', // Blue
  '#7209B7', // Purple
  '#F72585', // Pink
];

// Mock projects data
let MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Work Tasks',
    description: 'Tasks related to my job',
    color: PROJECT_COLORS[0],
    icon: 'briefcase',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: '2',
    name: 'Personal',
    description: 'Personal to-dos and errands',
    color: PROJECT_COLORS[3],
    icon: 'home',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: '3',
    name: 'Health & Fitness',
    description: 'Exercise and health-related tasks',
    color: PROJECT_COLORS[4],
    icon: 'activity',
    createdAt: new Date(Date.now() - 21 * 86400000).toISOString(),
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Project service functions
export const fetchProjects = async (): Promise<Project[]> => {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/projects`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to fetch projects');
  return await res.json();
};

export const createProject = async (projectData: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(projectData),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return await res.json();
};

export const updateProject = async (id: string, updates: Partial<Project>): Promise<Project> => {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/projects/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update project');
  return await res.json();
};

export const deleteProject = async (id: string): Promise<void> => {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/projects/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to delete project');
};