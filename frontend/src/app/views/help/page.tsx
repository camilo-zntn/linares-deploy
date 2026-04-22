'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircleQuestion, Bug, Lightbulb, Send, MessageCircle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL, apiRoutes } from '@/config/api';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id: string;
  message: string;
  sender: 'user' | 'admin';
  timestamp: string;
  senderName?: string;
  senderEmail?: string;
}

interface Request {
  _id: string;
  email: string;
  subject: string;
  description: string;
  type: 'problem' | 'suggestion';
  status: 'pending' | 'in_process' | 'resolved';
  createdAt: string;
  messages?: Message[];
  _tempSuggestion?: boolean;
}

interface FormData {
  type: 'problem' | 'suggestion';
  subject: string;
  description: string;
  email: string;
}

export default function HelpPage() {
  const { user, activeRequest, setActiveRequest, markRequestAsResolved } = useAuth();
  
  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_process':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'in_process':
        return 'En Proceso';
      case 'resolved':
        return 'Resuelto';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return 'Ahora';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // State
  const [formData, setFormData] = useState<FormData>({
    type: 'problem',
    subject: '',
    description: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);

  // Función para refrescar la solicitud activa
  const refreshActiveRequest = async () => {
    if (!activeRequest || !user) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiRoutes.requests.byId(activeRequest._id), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveRequest(data.request);
      }
    } catch (error) {
      console.error('Error al refrescar solicitud:', error);
    }
  };

  // Función para enviar mensaje
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRequest || isSendingMessage) return;
    
    setIsSendingMessage(true);
    const requestId = activeRequest._id;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: newMessage,
          sender: 'user'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Crear el mensaje con todos los campos necesarios
        const newMessageObj = {
          _id: data.message?._id || `temp-${Date.now()}`,
          message: newMessage,
          sender: 'user' as const,
          timestamp: data.message?.timestamp || new Date().toISOString()
        };
        
        // Actualizar la solicitud activa con el nuevo mensaje
        setActiveRequest(prev => {
          if (!prev) return prev;
          if (prev._id !== requestId) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), newMessageObj]
          };
        });
        
        setNewMessage('');
        
        // Opcional: Refrescar después de un breve delay para sincronizar con el servidor
        setTimeout(() => {
          refreshActiveRequest();
        }, 500);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al enviar mensaje');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al enviar mensaje');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Efecto para rellenar el email si el usuario esta logueado
  useEffect(() => {
    if (user && user.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  useEffect(() => {
    activeRequestIdRef.current = activeRequest?._id || null;
  }, [activeRequest?._id]);
  
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    const socketInstance = io(API_BASE_URL, {
      auth: {
        token,
        email: user.email
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true
    });

    socketInstance.on('connect', () => {
      const requestId = activeRequestIdRef.current;
      if (!requestId) return;
      socketInstance.emit('join_request_room', { requestId, email: user.email });
      setCurrentRoom(requestId);
    });

    socketInstance.on('new_message', (data) => {
      const { requestId, message, status } = data;

      setActiveRequest(prev => {
        if (!prev || prev._id !== requestId) return prev;

        const prevMessages = prev.messages || [];
        const exists = prevMessages.some(m => m._id === message._id);
        if (exists) {
          return { ...prev, status };
        }

        return {
          ...prev,
          status,
          messages: [...prevMessages, message]
        };
      });
    });

    socketInstance.on('request_resolved', (data) => {
      const { requestId, status } = data;
      setActiveRequest(prev => (prev && prev._id === requestId ? { ...prev, status } : prev));
    });

    socketInstance.on('request_deleted', (data) => {
      const { requestId } = data;
      setActiveRequest(prev => (prev && prev._id === requestId ? null : prev));
      setShowChat(false);
    });

    socketInstance.on('error', (err) => {
      if (err?.message) {
        toast.error(err.message);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user, setActiveRequest]);

  useEffect(() => {
    if (!socket || !user) return;
    if (!activeRequest?._id) return;

    if (currentRoom && currentRoom !== activeRequest._id) {
      socket.emit('leave_request_room', { requestId: currentRoom });
    }

    socket.emit('join_request_room', { requestId: activeRequest._id, email: user.email });
    setCurrentRoom(activeRequest._id);
  }, [socket, user, activeRequest?._id, currentRoom]);

  // Efecto para cargar la solicitud más reciente del usuario
  useEffect(() => {
    if (user) {
      loadUserRequest();
    } else {
      // ✅ Si no hay usuario, limpiar solicitud activa
      setActiveRequest(null);
      setShowChat(false);
    }
  }, [user]); // ✅ Dependencia correcta

  useEffect(() => {
    if (!user) return;
    if (!activeRequest || activeRequest.type !== 'problem') return;

    const interval = setInterval(() => {
      refreshActiveRequest();
    }, 3000);

    return () => clearInterval(interval);
  }, [user, activeRequest?._id, activeRequest?.type]);

  // Función para cargar solicitud del usuario
  const loadUserRequest = async () => {
    // Solo cargar solicitudes del servidor si el usuario está autenticado
    if (!user) {
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiRoutes.requests.myRequests, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (response.ok) {
        const data = await response.json();
        const requests = data.requests || [];
        // Solo buscar problemas activos, no sugerencias
        const activeReq = requests.find((req: Request) => 
          req.status !== 'resolved' && req.type === 'problem'
        );
        
        if (activeReq) {
          setActiveRequest(activeReq);
          setShowChat(true); // Solo problemas tienen chat
        } else {
          // Si no hay problemas activos para este usuario, limpiar
          setActiveRequest(null);
          setShowChat(false);
        }
      }
    } catch (error) {
      console.error('Error al cargar solicitud:', error);
    }
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.description.trim() || !formData.email.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }
  
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          email: formData.email,
          subject: formData.subject,
          description: formData.description,
          type: formData.type
        })
      });
  
      if (response.ok) {
        const result = await response.json();
        toast.success(
          formData.type === 'problem' 
            ? 'Reporte enviado exitosamente. Puedes continuar la conversación abajo.' 
            : 'Sugerencia enviada exitosamente. Gracias por tu aporte!'
        );
        
        // En la función handleSubmit, cambiar esta parte:
        if (formData.type === 'problem') {
          // Para problemas, establecer la solicitud normalmente
          setActiveRequest(result.request);
          setShowChat(true);
        } else {
          // Para sugerencias, crear un objeto temporal con estado resolved
          setActiveRequest({
            ...result.request,
            status: 'resolved', // Estado resolved por defecto para sugerencias
            _tempSuggestion: true // Flag temporal para identificar sugerencias
          });
          setShowChat(false);
          
          // Limpiar después de 3 segundos
          setTimeout(() => {
            setActiveRequest(null);
          }, 3000);
        }
        
        // Limpiar formulario
        setFormData({
          type: 'problem',
          subject: '',
          description: '',
          email: user?.email || ''
        });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al enviar la solicitud');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al enviar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para marcar como resuelta
  const handleMarkAsResolved = () => {
    if (activeRequest) {
      markRequestAsResolved(activeRequest._id);
    }
  };

  // Función para eliminar solicitud
  const handleDeleteRequest = async () => {
    if (!activeRequest) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiRoutes.requests.byId(activeRequest._id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Limpiar la solicitud activa del estado
        setActiveRequest(null);
        setShowChat(false);
        toast.success('Solicitud eliminada exitosamente');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al eliminar la solicitud');
      }
    } catch (error) {
      console.error('Error al eliminar solicitud:', error);
      toast.error('Error al eliminar la solicitud');
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <MessageCircleQuestion className="h-8 w-8 text-emerald-500" />
            <h1 className="text-3xl font-bold text-gray-800">Centro de Ayuda</h1>
          </div>
        </div>

        {/* Solicitud Actual */}
        {activeRequest && activeRequest.status !== 'resolved' && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                {/* Mostrar mensaje especial para sugerencias temporales */}
                {activeRequest._tempSuggestion ? (
                  <div className="flex items-center gap-3">
                    <Lightbulb className="h-6 w-6 text-emerald-500" />
                    <h3 className="text-lg font-semibold text-emerald-700">
                      Tu sugerencia ha sido enviada
                    </h3>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      {activeRequest.type === 'problem' ? (
                        <Bug className="h-5 w-5 text-red-500" />
                      ) : (
                        <Lightbulb className="h-5 w-5 text-emerald-500" />
                      )}
                      <h3 className="font-semibold text-gray-900">{activeRequest.subject}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getStatusColor(activeRequest.status)
                      }`}>
                        {getStatusText(activeRequest.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      Enviado el {formatDate(activeRequest.createdAt)}
                    </p>
                    <p className="text-gray-700">{activeRequest.description}</p>
                  </>
                )}
              </div>
              {/* Solo mostrar botones para problemas, no para sugerencias temporales */}
              {!activeRequest._tempSuggestion && activeRequest.type === 'problem' && (
                <div className="flex gap-2">
                  <button
                    onClick={handleMarkAsResolved}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Marcar como Resuelto
                  </button>
                </div>
              )}
            </div>

            {/* Chat para problemas */}
            {showChat && activeRequest.type === 'problem' && !activeRequest._tempSuggestion && (
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                  <h4 className="font-medium text-gray-900">Conversación</h4>
                </div>
                
                {/* Mensajes */}
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {activeRequest.messages?.map((message: Message) => {
                    // Determinar si el mensaje es del usuario actual
                    const isCurrentUserMessage = user?.role === 'admin' 
                      ? message.sender === 'admin' 
                      : message.sender === 'user';
                    
                    return (
                      <div
                        key={message._id}
                        className={`flex ${
                          isCurrentUserMessage ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender === 'admin'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender === 'admin' ? 'text-emerald-100' : 'text-gray-500'
                          }`}>
                            {formatDate(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input para nuevo mensaje */}
                {(activeRequest.status === 'pending' || activeRequest.status === 'in_process') && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribe tu mensaje..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isSendingMessage || !newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSendingMessage ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Formulario para nueva solicitud */}
        {(!activeRequest || activeRequest.status === 'resolved') && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">¿Necesitas ayuda?</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de solicitud */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de solicitud
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'problem' }))}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      formData.type === 'problem'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Bug className={`h-6 w-6 ${
                        formData.type === 'problem' ? 'text-red-500' : 'text-gray-400'
                      }`} />
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">Reportar Problema</h3>
                        <p className="text-sm text-gray-500">Reporta errores o problemas técnicos</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'suggestion' }))}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      formData.type === 'suggestion'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Lightbulb className={`h-6 w-6 ${
                        formData.type === 'suggestion' ? 'text-emerald-500' : 'text-gray-400'
                      }`} />
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">Enviar Sugerencia</h3>
                        <p className="text-sm text-gray-500">Comparte ideas para mejorar</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email de contacto
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!!user} // Deshabilitar si el usuario está logueado
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    !!user ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder={user ? user.email : "tu@email.com"}
                  required
                />
                {user && (
                  <p className="text-xs text-gray-500 mt-1">
                    Email autocompletado desde tu cuenta
                  </p>
                )}
              </div>

              {/* Asunto */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto
                </label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe brevemente tu consulta"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción detallada
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={formData.type === 'problem' 
                    ? "Describe el problema que estás experimentando, incluyendo pasos para reproducirlo si es posible..."
                    : "Describe tu sugerencia y cómo crees que podría mejorar la aplicación..."
                  }
                  required
                />
              </div>

              {/* Botón de envío */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {formData.type === 'problem' ? 'Reportar Problema' : 'Enviar Sugerencia'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
