import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Obtener usuarios ordenados por fecha de creacion
    const users = await UserModel.find()
      .sort({ createdAt: -1 })
      .select('-password');
    
    // Enviar respuesta exitosa
    res.json(users);

  } catch (error) {
    // Manejo de errores
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener usuarios' 
    });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    // Obtener datos de la solicitud
    const { userId } = req.params;
    const { status } = req.body;

    // Actualizar estado del usuario
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    );

    // Validar si existe el usuario
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        status: user.status
      }
    });

  } catch (error) {
    // Manejo de errores
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar estado' 
    });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Obtener ID del usuario
    const { id } = req.params;

    // Eliminar usuario
    const deletedUser = await UserModel.findByIdAndDelete(id);

    // Validar si existe el usuario
    if (!deletedUser) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Usuario eliminado permanentemente'
    });

  } catch (error) {
    // Manejo de errores
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};