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
  const messageRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Configurar WebSocket - SIN selectedRequest en las dependencias
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
        auth: {
          token: token,
          email: user.email
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true
      });
  
      socketInstance.on('connect', () => {
        console.log('Conectado a WebSocket');
        setIsConnected(true);
        
        // Si es admin, unirse a todas las salas de solicitudes existentes
        if (user.role === 'admin' && requests.length > 0) {
          console.log('Admin uniéndose a todas las salas de solicitudes');
          requests.forEach(request => {
            socketInstance.emit('join_request_room', { requestId: request._id });
          });
        }
      });
  
      socketInstance.on('disconnect', (reason) => {
        console.log('Desconectado de WebSocket:', reason);
        setIsConnected(false);
      });
  
      socketInstance.on('connect_error', (error) => {
        console.error('Error de conexión WebSocket:', error);
        setIsConnected(false);
      });
  
      socketInstance.on('reconnect', (attemptNumber) => {
        console.log('Reconectado a WebSocket después de', attemptNumber, 'intentos');
        setIsConnected(true);
        
        // Reunirse a las salas después de reconectar
        if (user.role === 'admin' && requests.length > 0) {
          requests.forEach(request => {
            socketInstance.emit('join_request_room', { requestId: request._id });
          });
        }
        
        // Si hay una solicitud seleccionada, reunirse a su sala
        if (selectedRequest) {
          socketInstance.emit('join_request_room', { 
            requestId: selectedRequest._id, 
            email: user.role !== 'admin' ? selectedRequest.email : undefined 
          });
        }
      });
  
      socketInstance.on('reconnect_error', (error) => {
        console.error('Error de reconexión WebSocket:', error);
      });
  
      // Escuchar nuevos mensajes - MEJORADO CON LOGS DETALLADOS
      socketInstance.on('new_message', (data) => {
        console.log('🔔 [WEBSOCKET] Nuevo mensaje recibido:', data);
        console.log('🔍 [WEBSOCKET] Detalles del mensaje:', {
          requestId: data.requestId,
          messageId: data.message._id,
          sender: data.message.sender,
          content: data.message.message,
          timestamp: data.message.timestamp
        });
        
        const { requestId, message, status } = data;
        
        // Verificar si este mensaje es para la solicitud actualmente seleccionada
        console.log('🎯 [WEBSOCKET] Verificando solicitud seleccionada:', {
          solicitudSeleccionada: selectedRequest?._id,
          mensajeParaSolicitud: requestId,
          coincide: selectedRequest?._id === requestId
        });
        
        // Actualizar la solicitud seleccionada si coincide
        setSelectedRequest(prev => {
          if (prev && prev._id === requestId) {
            console.log('🔄 [WEBSOCKET] Actualizando solicitud seleccionada con nuevo mensaje');
            console.log('📋 [WEBSOCKET] Mensajes actuales:', prev.messages.length);
            
            // Verificar si el mensaje ya existe para evitar duplicados
            const messageExists = prev.messages.some(msg => {
              const exists = msg._id === message._id || 
                (msg.message === message.message && 
                 msg.sender === message.sender && 
                 Math.abs(new Date(msg.timestamp).getTime() - new Date(message.timestamp).getTime()) < 2000);
              
              if (exists) {
                console.log('🔍 [WEBSOCKET] Mensaje duplicado detectado:', {
                  existente: { id: msg._id, sender: msg.sender, message: msg.message },
                  nuevo: { id: message._id, sender: message.sender, message: message.message }
                });
              }
              
              return exists;
            });
            
            if (messageExists) {
              console.log('📋 [WEBSOCKET] Mensaje ya existe, no se duplicará');
              return prev;
            }
            
            // Verificar si hay un mensaje temporal que reemplazar
            const existingTempMessage = prev.messages.find(msg => 
              msg._id.startsWith('temp-') && 
              msg.message === message.message &&
              msg.sender === message.sender &&
              Math.abs(new Date(msg.timestamp).getTime() - new Date(message.timestamp).getTime()) < 5000
            );
            
            if (existingTempMessage) {
              console.log('🔄 [WEBSOCKET] Reemplazando mensaje temporal con mensaje real');
              const updatedRequest = {
                ...prev,
                messages: prev.messages.map(msg => 
                  msg._id === existingTempMessage._id ? message : msg
                ),
                status: status
              };
              console.log('✅ [WEBSOCKET] Solicitud actualizada con mensaje reemplazado, total mensajes:', updatedRequest.messages.length);
              return updatedRequest;
            } else {
              console.log('➕ [WEBSOCKET] Agregando nuevo mensaje');
              const updatedRequest = {
                ...prev,
                messages: [...prev.messages, message],
                status: status
              };
              console.log('✅ [WEBSOCKET] Solicitud actualizada con nuevo mensaje, total mensajes:', updatedRequest.messages.length);
              console.log('📝 [WEBSOCKET] Nuevo mensaje agregado:', {
                id: message._id,
                sender: message.sender,
                content: message.message,
                timestamp: message.timestamp
              });
              return updatedRequest;
            }
          } else {
            console.log('⏭️ [WEBSOCKET] Mensaje no es para la solicitud seleccionada, ignorando');
            return prev;
          }
        });
      
        // Actualizar la lista de solicitudes con el nuevo mensaje y estado
        setRequests(prev => {
          console.log('📋 [WEBSOCKET] Actualizando lista general de solicitudes');
          return prev.map(req => {
            if (req._id === requestId) {
              console.log('🔄 [WEBSOCKET] Actualizando solicitud en la lista:', req._id);
              
              // Verificar si el mensaje ya existe en la lista para evitar duplicados
              const messageExists = req.messages.some(msg => 
                msg._id === message._id || 
                (msg.message === message.message && 
                 msg.sender === message.sender && 
                 Math.abs(new Date(msg.timestamp).getTime() - new Date(message.timestamp).getTime()) < 2000)
              );
              
              const updatedReq = {
                ...req,
                status: status,
                messages: messageExists ? req.messages : [...req.messages, message]
              };
              
              console.log('✅ [WEBSOCKET] Solicitud en lista actualizada, total mensajes:', updatedReq.messages.length);
              return updatedReq;
            }
            return req;
          });
        });

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
  }, [user]);

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
    console.log('🏠 [ROOM] Intentando unirse a la sala:', requestId);
    console.log('👤 [ROOM] Email del usuario:', email);
    console.log('🔌 [ROOM] Estado del socket:', socket?.connected ? 'conectado' : 'desconectado');
    
    if (socket && socket.connected) {
      // Salir de la sala anterior si existe
      if (currentRoom) {
        console.log('🚪 [ROOM] Saliendo de la sala anterior:', currentRoom);
        socket.emit('leave_request_room', { requestId: currentRoom });
      }

      // Unirse a la nueva sala
      console.log('🏠 [ROOM] Uniéndose a la nueva sala:', requestId);
      socket.emit('join_request_room', { requestId, email });
      setCurrentRoom(requestId);

      socket.once('joined_room', (data) => {
        console.log('✅ [ROOM] Confirmación de unión a la sala:', data);
        console.log(`🎯 [ROOM] Unido exitosamente a la sala del request ${requestId}`);
      });

      // Agregar listener para errores de sala
      socket.once('room_error', (error) => {
        console.error('❌ [ROOM] Error al unirse a la sala:', error);
        toast.error('Error al acceder a la solicitud');
      });
    } else {
      console.error('❌ [ROOM] No se puede unir a la sala - Socket no conectado');
      toast.error('Conexión no disponible');
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
    
    // Crear mensaje temporal para actualización optimista
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`, // ID temporal
      sender: user?.role === 'admin' ? 'admin' : 'user',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      senderName: user?.name || 'Usuario',
      senderEmail: user?.email || selectedRequest.email
    };

    // Actualización optimista - mostrar el mensaje inmediatamente
    setSelectedRequest(prev => prev ? {
      ...prev,
      messages: [...prev.messages, tempMessage]
    } : null);

    // Limpiar el campo de mensaje inmediatamente
    const messageToSend = newMessage.trim();
    setNewMessage('');

    // Scroll automático inmediato
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    
    try {
      // Enviar mensaje via WebSocket
      socket.emit('send_message', {
        requestId: selectedRequest._id,
        message: messageToSend,
        email: user?.role === 'admin' ? undefined : selectedRequest.email
      });

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast.error('Error al enviar mensaje');
      
      // Revertir la actualización optimista en caso de error
      setSelectedRequest(prev => prev ? {
        ...prev,
        messages: prev.messages.filter(msg => msg._id !== tempMessage._id)
      } : null);
      
      // Restaurar el mensaje en el campo de entrada
      setNewMessage(messageToSend);
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

  // Función para recargar mensajes de una solicitud específica - MEJORADA
  const reloadRequestMessages = async (requestId: string) => {
    console.log(`🔄 [CHAT REFRESH] ===== INICIANDO RECARGA DE MENSAJES =====`);
    console.log(`🔄 [CHAT REFRESH] Solicitud: ${requestId}`);
    console.log(`🕐 [CHAT REFRESH] Timestamp: ${new Date().toLocaleTimeString()}`);
    console.log(`🎯 [CHAT REFRESH] Solicitud seleccionada actual: ${selectedRequest?._id}`);
    console.log(`📊 [CHAT REFRESH] Mensajes actuales en selectedRequest: ${selectedRequest?.messages?.length || 0}`);
    
    try {
      // Verificar que tenemos una solicitud válida antes de hacer la petición
      if (!requestId || requestId === 'undefined') {
        console.error('❌ [CHAT REFRESH] ID de solicitud inválido:', requestId);
        return;
      }

      // Corregir la URL - usar la función correctamente
      const url = apiRoutes.requests.byId(requestId);
      console.log(`🌐 [CHAT REFRESH] URL de solicitud: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const updatedRequest = await response.json();
        console.log(`✅ [CHAT REFRESH] Respuesta de API recibida exitosamente`);
        console.log(`📊 [CHAT REFRESH] Total de mensajes en respuesta: ${updatedRequest.messages?.length || 0}`);
        console.log(`🆔 [CHAT REFRESH] ID de solicitud obtenida: ${updatedRequest._id}`);
        console.log(`📝 [CHAT REFRESH] Mensajes obtenidos:`, updatedRequest.messages?.map((msg: Message) => ({
          id: msg._id,
          sender: msg.sender,
          message: msg.message.substring(0, 50) + '...',
          timestamp: msg.timestamp
        })));
        
        // Verificar que la solicitud obtenida coincide with la esperada
        if (updatedRequest._id !== requestId) {
          console.warn('⚠️ [CHAT REFRESH] ID de solicitud no coincide:', {
            esperado: requestId,
            obtenido: updatedRequest._id
          });
          return;
        }
        
        // Actualizar la solicitud seleccionada si es la misma
        setSelectedRequest(prev => {
          if (prev && prev._id === requestId) {
            console.log(`🔄 [CHAT REFRESH] Actualizando selectedRequest`);
            console.log(`📊 [CHAT REFRESH] Mensajes anteriores: ${prev.messages?.length || 0}`);
            console.log(`📊 [CHAT REFRESH] Mensajes nuevos: ${updatedRequest.messages?.length || 0}`);
            
            const hasNewMessages = updatedRequest.messages?.length > prev.messages?.length;
            if (hasNewMessages) {
              console.log(`🆕 [CHAT REFRESH] Se detectaron nuevos mensajes!`);
              console.log(`📈 [CHAT REFRESH] Diferencia: +${(updatedRequest.messages?.length || 0) - (prev.messages?.length || 0)} mensajes`);
              
              // Mostrar los nuevos mensajes
              const newMessages = updatedRequest.messages?.slice(prev.messages?.length || 0);
              console.log(`📝 [CHAT REFRESH] Nuevos mensajes detectados:`, newMessages?.map((msg: Message) => ({
                id: msg._id,
                sender: msg.sender,
                message: msg.message,
                timestamp: msg.timestamp
              })));
            } else {
              console.log(`📊 [CHAT REFRESH] No hay nuevos mensajes`);
            }
            
            console.log(`✅ [CHAT REFRESH] Retornando solicitud actualizada con ${updatedRequest.messages?.length || 0} mensajes`);
            return updatedRequest;
          } else {
            console.log(`⏭️ [CHAT REFRESH] No se actualiza selectedRequest (no coincide o es null)`);
            console.log(`🔍 [CHAT REFRESH] prev._id: ${prev?._id}, requestId: ${requestId}`);
            return prev;
          }
        });

        // Actualizar también en la lista general de solicitudes
        setRequests(prevRequests => {
          console.log(`📋 [CHAT REFRESH] Actualizando lista general de solicitudes`);
          const updatedRequests = prevRequests.map(req => 
            req._id === requestId ? updatedRequest : req
          );
          console.log(`✅ [CHAT REFRESH] Lista de solicitudes actualizada`);
          return updatedRequests;
        });
        
        console.log(`🏁 [CHAT REFRESH] ===== RECARGA COMPLETADA EXITOSAMENTE =====`);
      } else {
        console.error(`❌ [CHAT REFRESH] Error al obtener mensajes:`, response.status, response.statusText);
        if (response.status === 404) {
          console.error('❌ [CHAT REFRESH] Solicitud no encontrada - posible problema de sincronización');
          toast.error('Solicitud no encontrada');
        }
      }
    } catch (error) {
      console.error('❌ [CHAT REFRESH] Error en la recarga de mensajes:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  // useEffect para recarga automática de mensajes
  useEffect(() => {
    // Limpiar intervalo anterior si existe
    if (messageRefreshInterval.current) {
      console.log('🧹 [CHAT REFRESH] Limpiando intervalo anterior');
      clearInterval(messageRefreshInterval.current);
      messageRefreshInterval.current = null;
    }

    // Solo activar recarga automática si hay una solicitud seleccionada, el modal está abierto y es de tipo 'problem'
    if (selectedRequest && isModalOpen && selectedRequest.type === 'problem') {
      console.log(`🚀 [CHAT REFRESH] Iniciando recarga automática para solicitud: ${selectedRequest._id}`);
      console.log(`⏰ [CHAT REFRESH] Intervalo configurado: cada 3 segundos`);
      console.log(`👤 [CHAT REFRESH] Usuario: ${user?.role || 'desconocido'}`);
      console.log(`🏠 [CHAT REFRESH] Sala actual: ${currentRoom}`);
      
      // Esperar un poco antes de iniciar la recarga automática para evitar conflictos
      const timeoutId = setTimeout(() => {
        messageRefreshInterval.current = setInterval(() => {
          console.log(`🔄 [CHAT REFRESH] ===== EJECUTANDO RECARGA AUTOMÁTICA =====`);
          console.log(`🎯 [CHAT REFRESH] Solicitud actual: ${selectedRequest._id}`);
          console.log(`🏠 [CHAT REFRESH] Sala actual: ${currentRoom}`);
          
          // Solo recargar si estamos en la sala correcta
          if (currentRoom === selectedRequest._id) {
            reloadRequestMessages(selectedRequest._id);
          } else {
            console.warn('⚠️ [CHAT REFRESH] No se recarga - sala no coincide:', {
              salaActual: currentRoom,
              solicitudSeleccionada: selectedRequest._id
            });
          }
        }, 3000);
      }, 1000); // Esperar 1 segundo antes de iniciar

      return () => {
        clearTimeout(timeoutId);
        if (messageRefreshInterval.current) {
          console.log('🧹 [CHAT REFRESH] Limpiando intervalo en cleanup');
          clearInterval(messageRefreshInterval.current);
          messageRefreshInterval.current = null;
        }
      };
    } else {
      console.log('⏸️ [CHAT REFRESH] Recarga automática pausada - Condiciones no cumplidas');
      if (!selectedRequest) console.log('   - No hay solicitud seleccionada');
      if (!isModalOpen) console.log('   - Modal no está abierto');
      if (selectedRequest && selectedRequest.type !== 'problem') console.log('   - Solicitud no es de tipo "problem"');
    }
  }, [selectedRequest, isModalOpen, user, currentRoom]);

  // Nuevo useEffect para unir al admin a todas las salas cuando se cargan las solicitudes
  useEffect(() => {
    if (user?.role === 'admin' && socket && socket.connected && requests.length > 0) {
      console.log('Admin uniéndose a todas las salas de solicitudes');
      requests.forEach(request => {
        socket.emit('join_request_room', { requestId: request._id });
      });
    }
  }, [requests, socket, user]);




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
    console.log('🚪 [MODAL] Abriendo modal para solicitud:', request._id);
    console.log('📋 [MODAL] Datos de la solicitud:', {
      id: request._id,
      email: request.email,
      type: request.type,
      status: request.status,
      messagesCount: request.messages?.length || 0
    });
    
    setSelectedRequest(request);
    setIsModalOpen(true);
    
    // Unirse a la sala de chat con un pequeño delay para asegurar que el estado se actualice
    setTimeout(() => {
      joinRequestRoom(request._id, user?.role !== 'admin' ? request.email : undefined);
    }, 100);
  };

  const closeModal = () => {
    // Limpiar intervalo de recarga automática
    if (messageRefreshInterval.current) {
      console.log('🧹 [CHAT REFRESH] Limpiando intervalo al cerrar modal');
      clearInterval(messageRefreshInterval.current);
      messageRefreshInterval.current = null;
    }

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
