import { Request, Response } from 'express';
import { LogModel } from '../models/log.model';

export const logController = {
  getLogs: async (_req: Request, res: Response): Promise<void> => {
    try {
      // Obtener logs con ordenamiento y referencias
      const logs = await LogModel.find()
        .sort({ createdAt: -1 })  // Ordenar por fecha descendente
        .populate('userId', 'username')  // Incluir informacion del usuario
        .lean(); 

      // Respuesta exitosa
      res.status(200).json({
        success: true,
        logs,
        total: logs.length,
        message: logs.length ? 'Logs obtenidos exitosamente' : 'No hay logs registrados'
      });

    } catch (error) {
      // Manejo de errores
      console.error('Error al obtener logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener logs',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
};