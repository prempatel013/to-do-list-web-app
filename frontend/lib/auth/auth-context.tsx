'use client';

import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { authReducer, initialState } from './auth-reducer';
import { LoginModal } from '@/components/auth/login-modal';
import { loginUser, registerUser, getCurrentUser, removeToken } from './auth-service';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  openLoginModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  requireAuth: (callback: () => void) => void;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      dispatch({ type: 'AUTH_LOADING' });
      try {
        const user = await getCurrentUser();
        if (user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
        } else {
          dispatch({ type: 'AUTH_FAILURE' });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: 'AUTH_FAILURE' });
      }
    };

    initAuth();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        initAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (state.isAuthenticated && pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
      setIsModalOpen(false);
    }
  }, [state.isAuthenticated, pendingCallback]);

  const openLoginModal = () => {
    setIsModalOpen(true);
  };

  const login = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const user = await loginUser(email, password);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      return Promise.resolve();
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      return Promise.reject(error);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const user = await registerUser(name, email, password);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      return Promise.resolve();
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      return Promise.reject(error);
    }
  };

  const logout = () => {
    dispatch({ type: 'AUTH_LOGOUT' });
    removeToken();
  };

  const requireAuth = (callback: () => void) => {
    if (state.isAuthenticated) {
      callback();
    } else {
      setPendingCallback(() => callback);
      setIsModalOpen(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        isLoading: state.isLoading,
        isAuthenticated: state.isAuthenticated,
        openLoginModal,
        login,
        register,
        logout,
        requireAuth,
      }}
    >
      {children}
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}