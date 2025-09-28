'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  X, 
  Send, 
  Mail, 
  FileText, 
  Clock,
  Eye,
  MessageCircle,
  Store,
  Users,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { io, Socket } from 'socket.io-client';
import { apiRoutes } from '../../../config/api';

interface Request {
  _id: string;
  type: 'problem' | 'suggestion';
  email: string;
  subject: string;
  description: string;
  status: 'pending' | 'in_process' | 'resolved';
  createdAt: string;
  updatedAt: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | string;
  messages: Message[];
}

interface Message {
  _id: string;
  sender: 'user' | 'admin';
  message: string;
  timestamp: string;
  senderName?: string;
  senderEmail?: string;
}

interface RequestItemProps {
  request: Request;
  onOpen: (request: Request) => void;
  onDelete: (request: Request, e: React.MouseEvent) => void;
  formatDate: (date: string) => string;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  getTypeText: (type: string) => string;
}

const RequestItem = ({
  request,
  onOpen,
  onDelete,
  formatDate,
  getStatusColor,
  getStatusText,
  getTypeText
}: RequestItemProps) => (
  <div
    key={request._id}
    onClick={() => onOpen(request)}
    className="p-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer group"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          {request.type === 'problem' ? (
            <Bug className="h-4 w-4 text-red-500" />
          ) : (
            <Lightbulb className="h-4 w-4 text-emerald-500" />
          )}
          <h3 className="font-medium text-gray-900">{request.subject}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Mail className="h-4 w-4" />
            <span>{request.email}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatDate(request.createdAt)}</span>
          </div>
          <span>•</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
            {getStatusText(request.status)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => onDelete(request, e)}
          className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 hover:bg-red-50 rounded-full border border-red-200 hover:border-red-300 shadow-sm hover:shadow-md ml-2"
          title="Eliminar solicitud"
        >
          <X className="h-4 w-4 text-red-500 hover:text-red-700" />
        </button>
      </div>
    </div>
  </div>
);

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'problem' | 'suggestion'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_process' | 'resolved'>('all');
  
  // Estados para el modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<Request | null>(null);

  // Estados para WebSocket
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Configurar WebSocket
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
        auth: {
          token: token,
          email: user.email
        }
      });

      socketInstance.on('connect', () => {
        console.log('Conectado a WebSocket');
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Desconectado de WebSocket');
        setIsConnected(false);
      });

      // Escuchar nuevos mensajes
      socketInstance.on('new_message', (data) => {
        console.log('Nuevo mensaje recibido:', data);
        const { requestId, message, status } = data;
        
        // Actualizar la solicitud seleccionada si coincide
        if (selectedRequest && selectedRequest._id === requestId) {
          console.log('Actualizando solicitud seleccionada con nuevo mensaje');
          setSelectedRequest(prev => prev ? {
            ...prev,
            messages: [...prev.messages, message],
            status: status
          } : null);
        }

        // Actualizar la lista de solicitudes
        setRequests(prev => prev.map(req => 
          req._id === requestId 
            ? { ...req, status: status }
            : req
        ));

        // Scroll automático al final
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });

      // Escuchar cambios de estado
      socketInstance.on('status_updated', (data) => {
        console.log('Estado actualizado:', data);
        const { requestId, status } = data;
        
        if (selectedRequest && selectedRequest._id === requestId) {
          setSelectedRequest(prev => prev ? { ...prev, status } : null);
        }

        setRequests(prev => prev.map(req => 
          req._id === requestId ? { ...req, status } : req
        ));
      });

      // Escuchar cuando se resuelve una solicitud
      socketInstance.on('request_resolved', (data) => {
        console.log('Solicitud resuelta:', data);
        const { requestId, status } = data;
        
        if (selectedRequest && selectedRequest._id === requestId) {
          setSelectedRequest(prev => prev ? { ...prev, status } : null);
        }

        setRequests(prev => prev.map(req => 
          req._id === requestId ? { ...req, status } : req
        ));

        toast.success('Solicitud marcada como resuelta');
      });

      // Escuchar eliminación de solicitudes
      socketInstance.on('request_deleted', (data) => {
        console.log('Solicitud eliminada:', data);
        const { requestId } = data;
        
        setRequests(prev => prev.filter(req => req._id !== requestId));
        
        if (selectedRequest && selectedRequest._id === requestId) {
          closeModal();
          toast('La solicitud ha sido eliminada');
        }
      });

      // Escuchar nuevas solicitudes (para admins)
      socketInstance.on('new_request', (data) => {
        console.log('Nueva solicitud recibida:', data);
        if (user.role === 'admin') {
          setRequests(prev => [data.request, ...prev]);
          toast.success('Nueva solicitud recibida');
        }
      });

      // Escuchar errores
      socketInstance.on('error', (data) => {
        console.error('Error de WebSocket:', data);
        toast.error(data.message);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [user, selectedRequest]);

  // Función para cargar solicitudes
  const loadRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = user?.role === 'admin' ? apiRoutes.requests.all : apiRoutes.requests.myRequests;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Datos recibidos:', data); // Para debug
        console.log('Número de solicitudes:', data.requests?.length || 0);
        console.log('Ejemplo de solicitud:', data.requests?.[0]);
        setRequests(data.requests || []);
      } else {
        console.error('Error en la respuesta:', response.status, response.statusText);
        toast.error('Error al cargar solicitudes');
      }
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      toast.error('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  // Función para unirse a una sala de chat
  const joinRequestRoom = (requestId: string, email?: string) => {
    if (socket && socket.connected) {
      // Salir de la sala anterior si existe
      if (currentRoom) {
        socket.emit('leave_request_room', { requestId: currentRoom });
      }

      // Unirse a la nueva sala
      socket.emit('join_request_room', { requestId, email });
      setCurrentRoom(requestId);

      socket.once('joined_room', () => {
        console.log(`Unido a la sala del request ${requestId}`);
      });
    }
  };

  // Función para enviar mensaje via WebSocket
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRequest || !socket) return;

    console.log('Enviando mensaje:', {
      requestId: selectedRequest._id,
      message: newMessage.trim(),
      email: user?.role === 'admin' ? undefined : selectedRequest.email
    });

    setIsSending(true);
    
    try {
      // Enviar mensaje via WebSocket
      socket.emit('send_message', {
        requestId: selectedRequest._id,
        message: newMessage.trim(),
        email: user?.role === 'admin' ? undefined : selectedRequest.email
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast.error('Error al enviar mensaje');
    } finally {
      setIsSending(false);
    }
  };

  // Función para mostrar modal de confirmación de eliminación
  const showDeleteConfirmation = (request: Request, e: React.MouseEvent) => {
    e.stopPropagation();
    setRequestToDelete(request);
    setShowDeleteModal(true);
  };

  // Función para eliminar solicitud via WebSocket
  const handleDeleteRequest = async () => {
    if (!requestToDelete || !socket) return;

    try {
      socket.emit('delete_request', { requestId: requestToDelete._id });
      toast.success('Solicitud eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar solicitud:', error);
      toast.error('Error al eliminar la solicitud');
    } finally {
      setShowDeleteModal(false);
      setRequestToDelete(null);
    }
  };

  // Función para marcar como resuelta via WebSocket
  const handleResolveRequest = () => {
    if (!selectedRequest || !socket) return;

    socket.emit('resolve_request', {
      requestId: selectedRequest._id,
      email: user?.role !== 'admin' ? selectedRequest.email : undefined
    });
  };

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  // Scroll automático al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedRequest?.messages]);

  const filteredRequests = requests.filter(request => {
    const typeMatch = filter === 'all' || request.type === filter;
    const statusMatch = statusFilter === 'all' || request.status === statusFilter;
    return typeMatch && statusMatch;
  });

  // Separar solicitudes por tipo de usuario - CORREGIDO
  const commerceRequests = filteredRequests.filter(request => 
    request.userId && typeof request.userId === 'object' && request.userId.role === 'commerce'
  );
  
  const userRequests = filteredRequests.filter(request => 
    !request.userId || (typeof request.userId === 'object' && request.userId.role !== 'commerce')
  );

  const openModal = (request: Request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
    
    // Unirse a la sala de chat
    joinRequestRoom(request._id, user?.role !== 'admin' ? request.email : undefined);
  };

  const closeModal = () => {
    // Salir de la sala de chat
    if (currentRoom && socket) {
      socket.emit('leave_request_room', { requestId: currentRoom });
      setCurrentRoom(null);
    }

    setIsModalOpen(false);
    setSelectedRequest(null);
    setNewMessage('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_process': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_process': return 'En Proceso';
      case 'resolved': return 'Resuelto';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'problem': return 'problema';
      case 'suggestion': return 'sugerencia';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <MessageSquare className="h-8 w-8 text-emerald-500" />
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Solicitudes</h1>
          </div>
          
          {/* Indicador de conexión WebSocket */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-2 text-green-600">
                <Wifi className="h-5 w-5" />
                <span className="text-sm font-medium">Conectado</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <WifiOff className="h-5 w-5" />
                <span className="text-sm font-medium">Desconectado</span>
              </div>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Solicitud
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">Todas</option>
                <option value="problem">Problemas</option>
                <option value="suggestion">Sugerencias</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="in_process">En Proceso</option>
                <option value="resolved">Resueltos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid de dos columnas para las solicitudes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna de Solicitudes de Comercios */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Store className="h-5 w-5 text-emerald-500" />
                Solicitudes de Comercios ({commerceRequests.length})
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {commerceRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay solicitudes de comercios que coincidan con los filtros.</p>
                </div>
              ) : (
                commerceRequests.map((request) => (
                  <RequestItem 
                    key={request._id} 
                    request={request} 
                    onOpen={openModal}
                    onDelete={showDeleteConfirmation}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                    getStatusText={getStatusText}
                    getTypeText={getTypeText}
                  />
                ))
              )}
            </div>
          </div>

          {/* Columna de Solicitudes de Usuarios */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Solicitudes de Usuarios ({userRequests.length})
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {userRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay solicitudes de usuarios que coincidan con los filtros.</p>
                </div>
              ) : (
                userRequests.map((request) => (
                  <RequestItem 
                    key={request._id} 
                    request={request} 
                    onOpen={openModal}
                    onDelete={showDeleteConfirmation}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                    getStatusText={getStatusText}
                    getTypeText={getTypeText}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalle */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {selectedRequest.type === 'problem' ? (
                  <Bug className="h-6 w-6 text-red-500" />
                ) : (
                  <Lightbulb className="h-6 w-6 text-emerald-500" />
                )}
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedRequest.subject}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  getStatusColor(selectedRequest.status)
                }`}>
                  {getStatusText(selectedRequest.status)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Indicador de conexión en el modal */}
                {isConnected ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex h-[calc(90vh-120px)]">
              {/* Información de la Solicitud */}
              <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correo del Usuario
                    </label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Mail className="h-4 w-4" />
                      {selectedRequest.email}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Creación
                    </label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Clock className="h-4 w-4" />
                      {formatDate(selectedRequest.createdAt)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <div className="flex items-center gap-2">
                      {selectedRequest.type === 'problem' ? (
                        <>
                          <Bug className="h-4 w-4 text-red-500" />
                          <span className="text-red-700 font-medium">Reporte de Problema</span>
                        </>
                      ) : (
                        <>
                          <Lightbulb className="h-4 w-4 text-emerald-500" />
                          <span className="text-emerald-700 font-medium">Sugerencia</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción Detallada
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {selectedRequest.description}
                      </p>
                    </div>
                  </div>

                  {/* Botón para marcar como resuelta */}
                  {selectedRequest.status !== 'resolved' && (
                    <div className="pt-4">
                      <button
                        onClick={handleResolveRequest}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Marcar como Resuelta
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat o Vista de Solo Lectura */}
              <div className="w-1/2 flex flex-col">
                {selectedRequest.type === 'problem' ? (
                  // Chat para Problemas
                  <>
                    <div className="p-4 border-b border-gray-200">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-blue-500" />
                        Conversación en Tiempo Real
                        {isConnected && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            Conectado
                          </span>
                        )}
                      </h4>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {selectedRequest.messages.map((msg, index) => {
                        const isCurrentUserMessage = user?.role === 'admin' 
                          ? msg.sender === 'admin' 
                          : msg.sender === 'user';
                        
                        return (
                          <div
                            key={`${msg.timestamp}-${index}`}
                            className={`flex mb-4 ${
                              isCurrentUserMessage ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isCurrentUserMessage
                                  ? user?.role === 'admin'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-200 text-gray-800'
                                  : msg.sender === 'admin'
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-gray-200 text-gray-800'
                              }`}
                            >
                              <div className="text-sm font-medium mb-1">
                                {msg.senderName}
                              </div>
                              <div>{msg.message}</div>
                              <div className="text-xs mt-1 opacity-75">
                                {formatDate(msg.timestamp)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                    
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Escribe tu respuesta..."
                          disabled={!isConnected}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || isSending || !isConnected}
                          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {isSending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Enviar
                        </button>
                      </div>
                      {!isConnected && (
                        <p className="text-xs text-red-600 mt-2">
                          Conexión perdida. Reintentando...
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  // Vista de solo lectura para Sugerencias
                  <div className="p-6 flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <h4 className="text-lg font-medium mb-2">Sugerencia Recibida</h4>
                      <p>Las sugerencias se marcan automáticamente como resueltas.</p>
                      <p className="text-sm mt-2">Gracias por tu aporte para mejorar nuestro servicio.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && requestToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar esta solicitud? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteRequest}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


