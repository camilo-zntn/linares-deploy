'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  rut: string; // Agregar el campo rut
}

interface Message {
  _id: string;
  sender: 'user' | 'admin';
  message: string;
  timestamp: string;
  senderName?: string;
  senderEmail?: string;
}

interface SupportRequest {
  _id: string;
  type: 'problem' | 'suggestion';
  email: string;
  subject: string;
  description: string;
  status: 'pending' | 'in_process' | 'resolved';
  createdAt: string;
  updatedAt: string;
  userId?: string;
  messages: Message[];
  _tempSuggestion?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  activeRequest: SupportRequest | null;
  setActiveRequest: (request: SupportRequest | null) => void;
  markRequestAsResolved: (requestId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState({
    user: null as User | null,
    token: null as string | null,
    isInitialized: false
  });
  const [activeRequest, setActiveRequestState] = useState<SupportRequest | null>(null);
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
        
        // NO restaurar activeRequest desde localStorage
        // Las solicitudes se cargarán desde la base de datos cuando sea necesario
        
      } catch (error) {
        console.error('Error loading auth state:', error);
        setState(prev => ({ ...prev, isInitialized: true }));
      }
    };

    initializeAuth();
  }, []);

  // Función para setActiveRequest SIN persistencia en localStorage
  const setActiveRequest = (request: SupportRequest | null) => {
    // Solo actualizar el estado en memoria
    setActiveRequestState(request);
  };

  // Limpieza al hacer login
  const login = (token: string, userData: User) => {
    // Limpiar cualquier solicitud activa anterior
    setActiveRequest(null);
      
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setState(prev => ({ ...prev, token, user: userData }));
  };
  
  // Cargar solicitud activa del usuario desde la base de datos
  const loadUserActiveRequest = async () => {
    if (!state.user || !state.token) return;
    
    try {
      const response = await fetch('/api/requests/my-requests', {
        headers: {
          'Authorization': `Bearer ${state.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const requests = data.requests || [];
        const activeReq = requests.find((req: SupportRequest) => req.status !== 'resolved');
        
        if (activeReq) {
          setActiveRequestState(activeReq);
        } else {
          setActiveRequestState(null);
        }
      }
    } catch (error) {
      console.error('Error loading user active request:', error);
    }
  };

  // Cargar solicitud activa cuando el usuario cambie o se inicialice
  useEffect(() => {
    if (state.user && state.isInitialized && state.token) {
      loadUserActiveRequest();
    } else {
      // Si no hay usuario, limpiar solicitud activa
      setActiveRequestState(null);
    }
  }, [state.user, state.isInitialized, state.token]); // ✅ Cambiar de state.user?._id a state.user

  const logout = () => {
    // Limpiar completamente localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    
    // Limpiar cualquier clave de solicitud activa
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('activeRequest_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Limpiar estado
    setState({ user: null, token: null, isInitialized: true });
    setActiveRequest(null);
    
    // ✅ Usar window.location.href para recargar la página y redirigir al home
    window.location.href = '/views/home';
  };

  const markRequestAsResolved = async (requestId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const body: any = {};
      
      // Si no hay usuario autenticado, incluir email de la solicitud activa
      if (!state.user && activeRequest) {
        body.email = activeRequest.email;
      }
      
      const response = await fetch(`/api/requests/${requestId}/resolve`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body)
      });
  
      if (response.ok) {
        setActiveRequest(null);
        toast.success('Solicitud marcada como resuelta');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al marcar como resuelta');
      }
    } catch (error) {
      console.error('Error al marcar como resuelta:', error);
      toast.error('Error al marcar como resuelta');
    }
  };

  if (!state.isInitialized) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ 
      user: state.user, 
      token: state.token, 
      login, 
      logout,
      activeRequest,
      setActiveRequest,
      markRequestAsResolved
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