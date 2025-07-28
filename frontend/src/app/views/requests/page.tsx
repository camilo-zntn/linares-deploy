'use client';

import { useState, useEffect } from 'react';
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
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Request {
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
}

interface Message {
  _id: string;
  sender: 'user' | 'admin';
  message: string;
  timestamp: string;
  senderName?: string;
  senderEmail?: string;
}

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

  // Función para cargar solicitudes
  const loadRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = user?.role === 'admin' ? '/api/requests/all' : '/api/requests/my-requests';
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        toast.error('Error al cargar solicitudes');
      }
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      toast.error('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  // Función para enviar mensaje
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRequest) return;

    setIsSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/requests/${selectedRequest._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage })
      });

      if (response.ok) {
        const data = await response.json();
        // Solo actualizar la solicitud seleccionada, no recargar todo
        setSelectedRequest(prev => prev ? {
          ...prev,
          messages: [...prev.messages, data.newMessage],
          status: data.status
        } : null);
        
        // Actualizar también la lista de solicitudes sin recargar
        setRequests(prev => prev.map(req => 
          req._id === selectedRequest._id 
            ? { ...req, status: data.status }
            : req
        ));
        
        setNewMessage('');
        toast.success('Mensaje enviado exitosamente');
      } else {
        toast.error('Error al enviar mensaje');
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast.error('Error al enviar mensaje');
    } finally {
      setIsSending(false);
    }
  };

  // Función para mostrar modal de confirmación de eliminación
  const showDeleteConfirmation = (request: Request, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se abra el modal
    setRequestToDelete(request);
    setShowDeleteModal(true);
  };

  // Función para eliminar solicitud
  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/requests/${requestToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Actualizar la lista de solicitudes eliminando la solicitud
        setRequests(prev => prev.filter(req => req._id !== requestToDelete._id));
        
        // Si la solicitud eliminada estaba seleccionada, cerrar el modal
        if (selectedRequest?._id === requestToDelete._id) {
          closeModal();
        }
        
        toast.success('Solicitud eliminada exitosamente');
      } else {
        toast.error('Error al eliminar la solicitud');
      }
    } catch (error) {
      console.error('Error al eliminar solicitud:', error);
      toast.error('Error al eliminar la solicitud');
    } finally {
      setShowDeleteModal(false);
      setRequestToDelete(null);
    }
  };

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  const filteredRequests = requests.filter(request => {
    const typeMatch = filter === 'all' || request.type === filter;
    const statusMatch = statusFilter === 'all' || request.status === statusFilter;
    return typeMatch && statusMatch;
  });

  const openModal = (request: Request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const closeModal = () => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <MessageSquare className="h-8 w-8 text-emerald-500" />
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Solicitudes</h1>
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

        {/* Lista de Solicitudes */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Solicitudes ({filteredRequests.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay solicitudes que coincidan con los filtros seleccionados.</p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request._id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors relative group"
                  onClick={() => openModal(request)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {request.type === 'problem' ? (
                          <Bug className="h-5 w-5 text-red-500" />
                        ) : (
                          <Lightbulb className="h-5 w-5 text-emerald-500" />
                        )}
                        <span className="font-medium text-gray-900">
                          {request.subject}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getStatusColor(request.status)
                        }`}>
                          {getStatusText(request.status)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {request.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(request.createdAt)}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {request.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {request.type === 'problem' ? (
                        <MessageCircle className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-500" />
                      )}
                      
                      {/* Botón de eliminar reubicado */}
                      <button
                        onClick={(e) => showDeleteConfirmation(request, e)}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 hover:bg-red-50 rounded-full border border-red-200 hover:border-red-300 shadow-sm hover:shadow-md ml-2"
                        title="Eliminar solicitud"
                      >
                        <X className="h-4 w-4 text-red-500 hover:text-red-700" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
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
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
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
                        Conversación
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
                    </div>
                    
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Escribe tu respuesta..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || isSending}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isSending ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  // Vista de Solo Lectura para Sugerencias
                  <div className="p-6 flex flex-col items-center justify-center h-full text-center">
                    <Eye className="h-16 w-16 text-gray-300 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      Sugerencia Recibida
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Las sugerencias son de solo lectura. Puedes revisar el contenido pero no responder directamente.
                    </p>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 w-full">
                      <p className="text-emerald-800 text-sm">
                        💡 Tip: Usa esta información para mejorar la plataforma en futuras actualizaciones.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && requestToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4 text-red-600">Confirmar Eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar la solicitud <strong>"{requestToDelete.subject}"</strong>? 
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setRequestToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-md border"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteRequest}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md"
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


