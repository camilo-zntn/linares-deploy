"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsResolved = exports.deleteRequest = exports.updateRequestStatus = exports.sendMessage = exports.getRequestById = exports.getUserRequests = exports.getAllRequests = exports.createRequest = void 0;
const request_model_1 = require("../models/request.model");
const user_model_1 = require("../models/user.model");
const nodemailer_config_1 = require("../config/nodemailer.config");
// Crear nueva solicitud de soporte
const createRequest = async (req, res) => {
    var _a;
    try {
        const { email, subject, description, type } = req.body;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || null;
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
        const newRequest = new request_model_1.RequestModel({
            email,
            subject,
            description,
            type,
            userId,
            status: type === 'suggestion' ? 'resolved' : 'pending',
            messages: []
        });
        await newRequest.save();
        // Emitir evento WebSocket para notificar nueva solicitud
        const io = req.app.get('io');
        if (io) {
            io.emit('new_request', {
                request: newRequest,
                type: 'new_request'
            });
        }
        // Enviar notificación por correo según el tipo
        try {
            if (type === 'problem') {
                await (0, nodemailer_config_1.sendNewReportNotification)(email, subject, description);
                console.log('Notificación de reporte enviada exitosamente');
            }
            else if (type === 'suggestion') {
                await (0, nodemailer_config_1.sendNewSuggestionNotification)(email, subject, description);
                console.log('Notificación de sugerencia enviada exitosamente');
            }
        }
        catch (emailError) {
            console.error('Error al enviar notificación por correo:', emailError);
        }
        res.status(201).json({
            message: 'Solicitud creada exitosamente',
            request: newRequest
        });
    }
    catch (error) {
        console.error('Error al crear solicitud:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.createRequest = createRequest;
// Obtener todas las solicitudes (solo admin)
const getAllRequests = async (req, res) => {
    try {
        const { type, status, page = 1, limit = 10 } = req.query;
        // Construir filtros
        const filters = {};
        if (type && ['problem', 'suggestion'].includes(type)) {
            filters.type = type;
        }
        if (status && ['pending', 'in_process', 'resolved'].includes(status)) {
            filters.status = status;
        }
        // Paginación
        const skip = (Number(page) - 1) * Number(limit);
        const requests = await request_model_1.RequestModel
            .find(filters)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('userId', 'name email role');
        const total = await request_model_1.RequestModel.countDocuments(filters);
        // Agregar logs de debug
        console.log('Solicitudes encontradas:', requests.length);
        console.log('Ejemplo de solicitud:', requests[0] ? {
            _id: requests[0]._id,
            email: requests[0].email,
            userId: requests[0].userId,
            type: requests[0].type,
            status: requests[0].status
        } : 'No hay solicitudes');
        res.json({
            requests,
            pagination: {
                current: Number(page),
                total: Math.ceil(total / Number(limit)),
                count: total
            }
        });
    }
    catch (error) {
        console.error('Error al obtener solicitudes:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getAllRequests = getAllRequests;
// Obtener solicitudes del usuario
const getUserRequests = async (req, res) => {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const userEmail = (_b = req.user) === null || _b === void 0 ? void 0 : _b.email;
        if (!userId && !userEmail) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        // Buscar SOLO por userId si existe, sino por email
        const filters = {};
        if (userId) {
            filters.userId = userId;
        }
        else if (userEmail) {
            filters.email = userEmail;
            filters.userId = { $exists: false };
        }
        const requests = await request_model_1.RequestModel
            .find(filters)
            .sort({ createdAt: -1 });
        res.json({ requests });
    }
    catch (error) {
        console.error('Error al obtener solicitudes del usuario:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getUserRequests = getUserRequests;
// Obtener solicitud por ID
const getRequestById = async (req, res) => {
    var _a, _b, _c, _d;
    try {
        const { id } = req.params;
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
        const userEmail = (_c = req.user) === null || _c === void 0 ? void 0 : _c.email;
        const requestEmail = req.query.email;
        const request = await request_model_1.RequestModel
            .findById(id)
            .populate('userId', 'name email');
        if (!request) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        // Verificar permisos de acceso
        const hasAccess = userRole === 'admin' ||
            (userId && ((_d = request.userId) === null || _d === void 0 ? void 0 : _d.toString()) === userId) ||
            (requestEmail && request.email === requestEmail) ||
            (userEmail && request.email === userEmail);
        if (!hasAccess) {
            return res.status(403).json({ message: 'No tienes acceso a esta solicitud' });
        }
        res.json({ request });
    }
    catch (error) {
        console.error('Error al obtener solicitud:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getRequestById = getRequestById;
// Enviar mensaje (ahora principalmente para compatibilidad HTTP)
const sendMessage = async (req, res) => {
    var _a, _b, _c, _d;
    try {
        const { id } = req.params;
        const { message } = req.body;
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
        const userEmail = (_c = req.user) === null || _c === void 0 ? void 0 : _c.email;
        const requestEmail = req.query.email;
        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'El mensaje es requerido' });
        }
        const request = await request_model_1.RequestModel.findById(id);
        if (!request) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        // Verificar permisos
        const hasAccess = userRole === 'admin' ||
            (userId && ((_d = request.userId) === null || _d === void 0 ? void 0 : _d.toString()) === userId) ||
            (requestEmail && request.email === requestEmail) ||
            (userEmail && request.email === userEmail);
        if (!hasAccess) {
            return res.status(403).json({ message: 'No tienes acceso a esta solicitud' });
        }
        // Determinar información del remitente
        let senderName = 'Usuario Anónimo';
        let senderEmail = requestEmail || userEmail;
        const sender = userRole === 'admin' ? 'admin' : 'user';
        if (req.user) {
            const user = await user_model_1.UserModel.findById(userId);
            if (user) {
                senderName = user.name;
                senderEmail = user.email;
            }
        }
        // Crear nuevo mensaje
        const newMessage = {
            sender,
            message: message.trim(),
            timestamp: new Date(),
            senderName,
            senderEmail
        };
        request.messages.push(newMessage);
        // Actualizar estado si es necesario
        if (request.status === 'pending' && sender === 'admin') {
            request.status = 'in_process';
        }
        await request.save();
        // Emitir evento WebSocket
        const io = req.app.get('io');
        if (io) {
            const savedMessage = request.messages[request.messages.length - 1];
            io.to(`request_${id}`).emit('new_message', {
                requestId: id,
                message: savedMessage,
                status: request.status
            });
        }
        res.json({
            message: 'Mensaje enviado exitosamente',
            newMessage: request.messages[request.messages.length - 1],
            status: request.status
        });
    }
    catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.sendMessage = sendMessage;
// Actualizar estado de solicitud (solo admin)
const updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['pending', 'in_process', 'resolved'].includes(status)) {
            return res.status(400).json({ message: 'Estado inválido' });
        }
        const request = await request_model_1.RequestModel.findByIdAndUpdate(id, { status }, { new: true });
        if (!request) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        // Emitir evento WebSocket
        const io = req.app.get('io');
        if (io) {
            io.to(`request_${id}`).emit('status_updated', {
                requestId: id,
                status: request.status
            });
        }
        res.json({
            message: 'Estado actualizado exitosamente',
            request
        });
    }
    catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.updateRequestStatus = updateRequestStatus;
// Eliminar solicitud (solo admin)
const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await request_model_1.RequestModel.findByIdAndDelete(id);
        if (!request) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        // Emitir evento WebSocket
        const io = req.app.get('io');
        if (io) {
            io.to(`request_${id}`).emit('request_deleted', { requestId: id });
        }
        res.json({ message: 'Solicitud eliminada exitosamente' });
    }
    catch (error) {
        console.error('Error al eliminar solicitud:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.deleteRequest = deleteRequest;
// Marcar solicitud como resuelta
const markAsResolved = async (req, res) => {
    var _a, _b, _c, _d;
    try {
        const { id } = req.params;
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
        const userEmail = (_c = req.user) === null || _c === void 0 ? void 0 : _c.email;
        const requestEmail = req.query.email;
        const request = await request_model_1.RequestModel.findById(id);
        if (!request) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        // Verificar permisos
        const hasAccess = userRole === 'admin' ||
            (userId && ((_d = request.userId) === null || _d === void 0 ? void 0 : _d.toString()) === userId) ||
            (requestEmail && request.email === requestEmail) ||
            (userEmail && request.email === userEmail);
        if (!hasAccess) {
            return res.status(403).json({ message: 'No tienes acceso a esta solicitud' });
        }
        request.status = 'resolved';
        await request.save();
        // Emitir evento WebSocket
        const io = req.app.get('io');
        if (io) {
            io.to(`request_${id}`).emit('request_resolved', {
                requestId: id,
                status: 'resolved'
            });
        }
        res.json({
            message: 'Solicitud marcada como resuelta',
            request
        });
    }
    catch (error) {
        console.error('Error al marcar como resuelta:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.markAsResolved = markAsResolved;
