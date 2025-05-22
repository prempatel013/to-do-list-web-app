import { User } from './auth-context';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Simulate API responses with delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock user data
const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatar: 'https://avatars.githubusercontent.com/u/2?v=4',
  },
];

// Cookie management
export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    // Store in localStorage
    localStorage.setItem('token', token);
    // Store in cookie with proper settings
    document.cookie = `token=Bearer ${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
    console.log('Setting token in localStorage and cookie:', token);
  }
};

export const getToken = () => {
  if (typeof window !== 'undefined') {
    // Try to get from localStorage first
    const token = localStorage.getItem('token');
    if (token) {
      return token;
    }
    // Fallback to cookie
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
    if (tokenCookie) {
      const token = tokenCookie.split('=')[1].trim();
      // If token starts with 'Bearer ', remove it
      return token.startsWith('Bearer ') ? token.substring(7) : token;
    }
    console.log('No token found in localStorage or cookies');
    return null;
  }
  return null;
};

export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    // Remove cookie by setting expiration to past date
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    console.log('Removed token from localStorage and cookies');
  }
};

// Auth service functions
export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.detail || 'Invalid credentials');
    }

    const data = await res.json();
    console.log('Login response:', data); // Debug log
    
    let user: User | null = null;
    if (data.access_token) {
      console.log('Setting token:', data.access_token); // Debug log
      setToken(data.access_token);
      // Immediately fetch user using the received token
      user = await getCurrentUser(data.access_token);
    }

    if (!user) throw new Error('Failed to fetch user after login');
    return user;
  } catch (error) {
    console.error('Login error:', error); // Debug log
    removeToken();
    throw error;
  }
};

export const registerUser = async (name: string, email: string, password: string): Promise<User> => {
  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.detail || 'Registration failed');
    }

    const data = await res.json();
    let user: User | null = null;
    if (data.access_token) {
      setToken(data.access_token);
      // Immediately fetch user using the received token
      user = await getCurrentUser(data.access_token);
    }

    if (!user) throw new Error('Failed to fetch user after registration');
    return user;
  } catch (error) {
    removeToken();
    throw error;
  }
};

export const getCurrentUser = async (token?: string): Promise<User | null> => {
  try {
    const headers: HeadersInit = {};
    // If a token is provided directly, use it in the Authorization header
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Otherwise, try to get the token from localStorage
      const storedToken = getToken();
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      } else {
        // No token available, return null immediately
        return null;
      }
    }

    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: headers,
      credentials: 'include',
    });

    if (!res.ok) {
      if (res.status === 401) {
        removeToken();
      }
      return null;
    }

    const user = await res.json();
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
};

export const logoutUser = async (): Promise<void> => {
  removeToken();
};

export const deleteAccount = async (): Promise<void> => {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const res = await fetch(`${API_URL}/api/auth/me`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to delete account');
  }

  removeToken();
};