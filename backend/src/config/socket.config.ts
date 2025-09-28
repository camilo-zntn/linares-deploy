import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { RequestModel, IMessage } from '../models/request.model';
import { UserModel } from '../models/user.model';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userEmail?: string;
  userName?: string;
}

interface JoinRoomData {
  requestId: string;
  email?: string;
}

interface SendMessageData {
  requestId: string;
  message: string;
  email?: string;
}

export const setupSocketIO = (io: Server) => {
  // Middleware de autenticación para Socket.IO
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const email = socket.handshake.auth.email;

      if (token) {
        // Usuario autenticado
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await UserModel.findById(decoded.userId);
        
        if (user) {
          socket.userId = user._id.toString();
          socket.userRole = user.role;
          socket.userEmail = user.email;
          socket.userName = user.name;
        }
      } else if (email) {
        // Usuario no autenticado pero con email
        socket.userEmail = email;
        socket.userName = 'Usuario Anónimo';
      }

      next();
    } catch (error) {
      console.error('Error en autenticación de socket:', error);
      next();
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Usuario conectado: ${socket.userName || socket.userEmail || 'Anónimo'} (${socket.id})`);

    // Unirse a una sala de chat específica
    socket.on('join_request_room', async (data: JoinRoomData) => {
      try {
        const { requestId, email } = data;
        
        // Verificar que el usuario tiene acceso a esta solicitud
        const request = await RequestModel.findById(requestId);
        if (!request) {
          socket.emit('error', { message: 'Solicitud no encontrada' });
          return;
        }

        // Verificar permisos
        const hasAccess = 
          socket.userRole === 'admin' || 
          (socket.userId && request.userId?.toString() === socket.userId) ||
          (email && request.email === email) ||
          (socket.userEmail && request.email === socket.userEmail);

        if (!hasAccess) {
          socket.emit('error', { message: 'No tienes acceso a esta solicitud' });
          return;
        }

        // Unirse a la sala
        socket.join(`request_${requestId}`);
        socket.emit('joined_room', { requestId });
        
        console.log(`${socket.userName || socket.userEmail} se unió a la sala request_${requestId}`);
      } catch (error) {
        console.error('Error al unirse a la sala:', error);
        socket.emit('error', { message: 'Error al unirse al chat' });
      }
    });

    // Enviar mensaje
    socket.on('send_message', async (data: SendMessageData) => {
      try {
        const { requestId, message, email } = data;

        if (!message.trim()) {
          socket.emit('error', { message: 'El mensaje no puede estar vacío' });
          return;
        }

        // Buscar la solicitud
        const request = await RequestModel.findById(requestId);
        if (!request) {
          socket.emit('error', { message: 'Solicitud no encontrada' });
          return;
        }

        // Verificar permisos
        const hasAccess = 
          socket.userRole === 'admin' || 
          (socket.userId && request.userId?.toString() === socket.userId) ||
          (email && request.email === email) ||
          (socket.userEmail && request.email === socket.userEmail);

        if (!hasAccess) {
          socket.emit('error', { message: 'No tienes acceso a esta solicitud' });
          return;
        }

        // Determinar el tipo de remitente
        const sender: 'user' | 'admin' = socket.userRole === 'admin' ? 'admin' : 'user';
        const senderName = socket.userName || 'Usuario Anónimo';
        const senderEmail = socket.userEmail;

        // Crear el nuevo mensaje con el tipo correcto
        const newMessage: IMessage = {
          sender,
          message: message.trim(),
          timestamp: new Date(),
          senderName,
          senderEmail
        };

        // Agregar mensaje a la solicitud
        request.messages.push(newMessage);
        
        // Actualizar estado si es necesario
        if (request.status === 'pending' && sender === 'admin') {
          request.status = 'in_process';
        }

        await request.save();

        // Obtener el mensaje guardado con su ID
        const savedMessage = request.messages[request.messages.length - 1];

        // Emitir el mensaje a todos en la sala
        io.to(`request_${requestId}`).emit('new_message', {
          requestId,
          message: savedMessage,
          status: request.status
        });

        console.log(`Mensaje enviado en request_${requestId} por ${senderName}`);
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        socket.emit('error', { message: 'Error al enviar el mensaje' });
      }
    });

    // Salir de una sala
    socket.on('leave_request_room', (data: { requestId: string }) => {
      const { requestId } = data;
      socket.leave(`request_${requestId}`);
      console.log(`${socket.userName || socket.userEmail} salió de la sala request_${requestId}`);
    });

    // Marcar solicitud como resuelta
    socket.on('resolve_request', async (data: { requestId: string, email?: string }) => {
      try {
        const { requestId, email } = data;
        
        const request = await RequestModel.findById(requestId);
        if (!request) {
          socket.emit('error', { message: 'Solicitud no encontrada' });
          return;
        }

        // Verificar permisos
        const hasAccess = 
          socket.userRole === 'admin' || 
          (socket.userId && request.userId?.toString() === socket.userId) ||
          (email && request.email === email) ||
          (socket.userEmail && request.email === socket.userEmail);

        if (!hasAccess) {
          socket.emit('error', { message: 'No tienes acceso a esta solicitud' });
          return;
        }

        // Actualizar estado
        request.status = 'resolved';
        await request.save();

        // Notificar a todos en la sala
        io.to(`request_${requestId}`).emit('request_resolved', {
          requestId,
          status: 'resolved'
        });

        console.log(`Solicitud ${requestId} marcada como resuelta por ${socket.userName || socket.userEmail}`);
      } catch (error) {
        console.error('Error al resolver solicitud:', error);
        socket.emit('error', { message: 'Error al resolver la solicitud' });
      }
    });

    // Eliminar solicitud (solo admin)
    socket.on('delete_request', async (data: { requestId: string }) => {
      try {
        if (socket.userRole !== 'admin') {
          socket.emit('error', { message: 'No tienes permisos para eliminar solicitudes' });
          return;
        }

        const { requestId } = data;
        
        const request = await RequestModel.findByIdAndDelete(requestId);
        if (!request) {
          socket.emit('error', { message: 'Solicitud no encontrada' });
          return;
        }

        // Notificar a todos en la sala y cerrar la sala
        io.to(`request_${requestId}`).emit('request_deleted', { requestId });
        
        // Hacer que todos salgan de la sala
        const socketsInRoom = await io.in(`request_${requestId}`).fetchSockets();
        socketsInRoom.forEach(s => s.leave(`request_${requestId}`));

        console.log(`Solicitud ${requestId} eliminada por ${socket.userName}`);
      } catch (error) {
        console.error('Error al eliminar solicitud:', error);
        socket.emit('error', { message: 'Error al eliminar la solicitud' });
      }
    });

    // Desconexión
    socket.on('disconnect', () => {
      console.log(`Usuario desconectado: ${socket.userName || socket.userEmail || 'Anónimo'} (${socket.id})`);
    });
  });
};