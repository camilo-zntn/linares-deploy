import { Response } from 'express';
import { RequestModel } from '../models/request.model';
import { UserModel } from '../models/user.model';
import { CustomRequest } from '../interfaces/custom.d';
import { sendNewReportNotification, sendNewSuggestionNotification } from '../config/nodemailer.config';

// Crear nueva solicitud de soporte
export const createRequest = async (req: CustomRequest, res: Response) => {
  try {
    const { email, subject, description, type } = req.body;
    const userId = req.user?.userId || null;

    // Validar datos requeridos
    if (!email || !subject || !description || !type) {
      return res.status(400).json({ 
        message: 'Todos los campos son requeridos' 
      });
    }

    // Validar tipo
    if (!['problem', 'suggestion'].includes(type)) {
      return res.status(400).json({ 
        message: 'Tipo de solicitud inválido' 
      });
    }

    // Crear nueva solicitud
    // Crear nueva solicitud
    const newRequest = new RequestModel({
      email,
      subject,
      description,
      type,
      userId,
      status: type === 'suggestion' ? 'resolved' : 'pending', // Sugerencias resolved, problemas pending
      messages: []
    });

    await newRequest.save();

    // Enviar notificación por correo según el tipo
    try {
      if (type === 'problem') {
        await sendNewReportNotification(email, subject, description);
        console.log('Notificación de reporte enviada exitosamente');
      } else if (type === 'suggestion') {
        await sendNewSuggestionNotification(email, subject, description);
        console.log('Notificación de sugerencia enviada exitosamente');
      }
    } catch (emailError) {
      console.error('Error al enviar notificación por correo:', emailError);
      // No fallar la creación de la solicitud si el correo falla
    }

    res.status(201).json({
      message: 'Solicitud creada exitosamente',
      request: newRequest
    });

  } catch (error) {
    console.error('Error al crear solicitud:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener todas las solicitudes (solo admin)
export const getAllRequests = async (req: CustomRequest, res: Response) => {
  try {
    const { type, status, page = 1, limit = 10 } = req.query;
    
    // Construir filtros
    const filters: any = {};
    if (type && ['problem', 'suggestion'].includes(type as string)) {
      filters.type = type;
    }
    if (status && ['pending', 'in_process', 'resolved'].includes(status as string)) {
      filters.status = status;
    }

    // Paginación
    const skip = (Number(page) - 1) * Number(limit);
    
    const requests = await RequestModel
      .find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('userId', 'name email');

    const total = await RequestModel.countDocuments(filters);

    res.json({
      requests,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        count: total
      }
    });

  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener solicitudes del usuario
export const getUserRequests = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userEmail = req.user?.email;

    if (!userId && !userEmail) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Buscar SOLO por userId si existe, sino por email
    const filters: any = {};
    
    if (userId) {
      // Si tiene userId, buscar solo por userId
      filters.userId = userId;
    } else if (userEmail) {
      // Si no tiene userId pero sí email, buscar por email Y que no tenga userId
      filters.email = userEmail;
      filters.userId = { $exists: false };
    }

    const requests = await RequestModel
      .find(filters)
      .sort({ createdAt: -1 });

    res.json({ requests });

  } catch (error) {
    console.error('Error al obtener solicitudes del usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener solicitud por ID
export const getRequestById = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.userId;
    const userEmail = req.user?.email;
    const requestEmail = req.query.email as string; // Para usuarios no autenticados

    const request = await RequestModel
      .findById(id)
      .populate('userId', 'name email');

    if (!request) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    // Verificar permisos
    if (userRole === 'admin') {
      // Los admins pueden ver todas las solicitudes
      return res.json({ request });
    }

    // Para usuarios autenticados, verificar por userId o email
    if (req.user) {
      const isOwner = (request.userId && request.userId.toString() === userId) || 
                     (request.email === userEmail);
      
      if (!isOwner) {
        return res.status(403).json({ message: 'No tienes permisos para ver esta solicitud' });
      }
    } else {
      // Para usuarios no autenticados, verificar por email en query
      if (!requestEmail || request.email !== requestEmail) {
        return res.status(403).json({ message: 'Email requerido para acceder a la solicitud' });
      }
    }

    res.json({ request });

  } catch (error) {
    console.error('Error al obtener solicitud:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Enviar mensaje en el chat
export const sendMessage = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userRole = req.user?.role;
    const userId = req.user?.userId;
    const userName = req.user?.name;
    const userEmail = req.user?.email;
    const requestEmail = req.body.email; // Para usuarios no autenticados

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'El mensaje no puede estar vacío' });
    }

    const request = await RequestModel.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    // Solo permitir chat en problemas
    if (request.type !== 'problem') {
      return res.status(400).json({ 
        message: 'El chat solo está disponible para reportes de problemas' 
      });
    }

    // No permitir mensajes en solicitudes resueltas
    if (request.status === 'resolved') {
      return res.status(400).json({ 
        message: 'No se pueden enviar mensajes en solicitudes resueltas' 
      });
    }

    // Verificar permisos
    if (userRole === 'admin') {
      // Los admins pueden enviar mensajes a cualquier solicitud
    } else if (req.user) {
      // Para usuarios autenticados, verificar por userId o email
      const isOwner = (request.userId && request.userId.toString() === userId) || 
                     (request.email === userEmail);
      
      if (!isOwner) {
        return res.status(403).json({ 
          message: 'No tienes permisos para enviar mensajes en esta solicitud' 
        });
      }
    } else {
      // Para usuarios no autenticados, verificar por email
      if (!requestEmail || request.email !== requestEmail) {
        return res.status(403).json({ 
          message: 'Email requerido para enviar mensajes' 
        });
      }
    }

    // Crear nuevo mensaje
    const newMessage = {
      sender: userRole === 'admin' ? 'admin' as const : 'user' as const,
      message: message.trim(),
      timestamp: new Date(),
      senderName: userName || 'Usuario',
      senderEmail: userEmail || requestEmail
    };

    // Agregar mensaje y actualizar estado
    request.messages.push(newMessage);
    
    // Si es la primera respuesta del admin, cambiar estado a "en proceso"
    if (userRole === 'admin' && request.status === 'pending') {
      request.status = 'in_process';
    }

    await request.save();

    res.json({
      message: 'Mensaje enviado exitosamente',
      newMessage,
      status: request.status
    });

  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Cambiar estado de solicitud (solo admin)
export const updateRequestStatus = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ 
        message: 'Solo los administradores pueden cambiar el estado' 
      });
    }

    if (!['pending', 'in_process', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    const request = await RequestModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    res.json({
      message: 'Estado actualizado exitosamente',
      request
    });

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Eliminar solicitud (solo admin)
export const deleteRequest = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    // Solo los administradores pueden eliminar solicitudes
    if (userRole !== 'admin') {
      return res.status(403).json({ 
        message: 'Solo los administradores pueden eliminar solicitudes' 
      });
    }

    const request = await RequestModel.findByIdAndDelete(id);

    if (!request) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    res.json({
      message: 'Solicitud eliminada exitosamente',
      deletedRequest: request
    });

  } catch (error) {
    console.error('Error al eliminar solicitud:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Agregar esta función
export const markAsResolved = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const userEmail = req.user?.email;
    const requestEmail = req.body.email; // Para usuarios no autenticados

    const request = await RequestModel.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    // Verificar permisos
    if (userRole === 'admin') {
      // Los admins pueden marcar cualquier solicitud como resuelta
    } else if (req.user) {
      // Para usuarios autenticados, verificar por userId o email
      const isOwner = (request.userId && request.userId.toString() === userId) || 
                     (request.email === userEmail);
      
      if (!isOwner) {
        return res.status(403).json({ 
          message: 'No tienes permisos para modificar esta solicitud' 
        });
      }
    } else {
      // Para usuarios no autenticados, verificar por email
      if (!requestEmail || request.email !== requestEmail) {
        return res.status(403).json({ 
          message: 'Email requerido para modificar la solicitud' 
        });
      }
    }

    request.status = 'resolved';
    await request.save();

    res.json({
      message: 'Solicitud marcada como resuelta',
      request
    });

  } catch (error) {
    console.error('Error al marcar como resuelta:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};