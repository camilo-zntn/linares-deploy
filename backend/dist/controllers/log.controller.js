"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const log_model_1 = require("../models/log.model");
exports.logController = {
    // Obtener todos los logs (solo admin)
    getLogs: async (_req, res) => {
        try {
            // Obtener logs con ordenamiento y referencias
            const logs = await log_model_1.LogModel.find()
                .sort({ createdAt: -1 }) // Ordenar por fecha descendente
                .populate('userId', 'name email role') // Incluir información del usuario (ajustado: 'name' en lugar de 'username')
                .lean();
            // Respuesta exitosa
            res.status(200).json({
                success: true,
                logs,
                total: logs.length,
                message: logs.length ? 'Logs obtenidos exitosamente' : 'No hay logs registrados'
            });
        }
        catch (error) {
            console.error('Error al obtener logs:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener logs',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    },
    // Crear un nuevo log (autenticado)
    createLog: async (req, res) => {
        var _a, _b;
        try {
            const { action, resourceType, resourceId, details, changes } = req.body;
            // Validar autenticación
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const username = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.name) || 'Usuario';
            if (!userId) {
                res.status(401).json({ success: false, message: 'Usuario no autenticado' });
                return;
            }
            // Validar campos mínimos
            const normalizedAction = action && ['CREATE', 'UPDATE', 'DELETE'].includes(action) ? action : 'UPDATE';
            const normalizedResourceType = resourceType || 'Commerce';
            if (!resourceId || !mongoose_1.default.Types.ObjectId.isValid(resourceId)) {
                res.status(400).json({ success: false, message: 'resourceId inválido o faltante' });
                return;
            }
            const normalizedDetails = typeof details === 'string' && details.trim().length > 0
                ? details.trim()
                : changes
                    ? `Cambios: ${JSON.stringify(changes)}`
                    : 'Sin detalles';
            // Crear log
            const newLog = await log_model_1.LogModel.create({
                userId,
                username,
                action: normalizedAction,
                resourceType: normalizedResourceType,
                resourceId,
                details: normalizedDetails
            });
            res.status(201).json({
                success: true,
                log: newLog,
                message: 'Log creado exitosamente'
            });
        }
        catch (error) {
            console.error('Error al crear log:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear log',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
};
