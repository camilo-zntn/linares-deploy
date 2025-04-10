'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string | { _id: string; name: string; };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState({
    user: null as User | null,
    token: null as string | null,
    isInitialized: false
  });
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        setState(prev => ({
          ...prev,
          token: storedToken,
          user: storedUser ? JSON.parse(storedUser) : null,
          isInitialized: true
        }));
      } catch (error) {
        console.error('Error loading auth state:', error);
        setState(prev => ({ ...prev, isInitialized: true }));
      }
    };

    initializeAuth();
  }, []);

  const login = (token: string, userData: User) => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setState(prev => ({ ...prev, token, user: userData }));
  };

  const logout = () => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setState(prev => ({ ...prev, token: null, user: null }));
    router.push('/views/auth/login');
  };

  if (!state.isInitialized) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ 
      user: state.user, 
      token: state.token, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};