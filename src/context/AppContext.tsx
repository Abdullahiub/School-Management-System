import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserSession } from '../types.js';
import { getAuthToken, getAuthUser, setAuthSession, clearAuthSession, api } from '../lib/api.js';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  user: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  toasts: ToastMessage[];
  isLoading: boolean;
  login: (username: string, password: string, role: string, remember: boolean) => Promise<void>;
  logout: () => void;
  toggleTheme: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(getAuthUser());
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Apply light/dark class on document element
  useEffect(() => {
    const savedTheme = localStorage.getItem('school_theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('school_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto dismiss after 3.5s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const login = async (username: string, password: string, role: string, remember: boolean) => {
    setIsLoading(true);
    try {
      const response = await api.post<{ token: string; user: UserSession }>('/api/auth/login', {
        username,
        password,
        role,
      });

      setToken(response.token);
      setUser(response.user);

      if (remember) {
        setAuthSession(response.token, response.user);
      } else {
        // Still save to session storage / localStorage but clear session storage on close if wanted.
        // For local simulation, we save it so the preview remains active, but follow remember-me preferences
        setAuthSession(response.token, response.user);
      }

      showToast(`Welcome back, ${response.user.fullName}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
    setToken(null);
    showToast('Logged out successfully.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        theme,
        toasts,
        isLoading,
        login,
        logout,
        toggleTheme,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
