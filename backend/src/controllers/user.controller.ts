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

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    // Obtener datos de la solicitud
    const { userId } = req.params;
    const { role } = req.body;

    // Validar rol permitido
    const allowedRoles = ['user', 'admin', 'commerce'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol no válido'
      });
    }

    // Buscar el usuario primero
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Si el nuevo rol no es 'commerce', eliminar el commerceId
    if (role !== 'commerce') {
      user.commerceId = undefined;
    }

    // Actualizar rol del usuario
    user.role = role;
    await user.save();

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Rol actualizado correctamente',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        commerceId: user.commerceId
      }
    });

  } catch (error) {
    // Manejo de errores
    console.error('Error al actualizar rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar rol',
      error: error instanceof Error ? error.message : 'Error desconocido'
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


export const assignCommerceToUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { commerceId } = req.body;

    // Buscar y actualizar el usuario
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Si el commerceId está vacío, eliminar la asociación
    if (!commerceId) {
      user.commerceId = undefined;
      await user.save();
      
      return res.json({
        success: true,
        message: 'Comercio desvinculado correctamente',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          commerceId: user.commerceId
        }
      });
    }

    // Verificar que el usuario tenga rol de comercio
    if (user.role !== 'commerce') {
      return res.status(400).json({
        success: false,
        message: 'Solo se puede asignar un comercio a usuarios con rol de comercio'
      });
    }

    // Actualizar el comercio del usuario
    user.commerceId = commerceId;
    await user.save();

    res.json({
      success: true,
      message: 'Comercio asignado correctamente',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        commerceId: user.commerceId
      }
    });

  } catch (error) {
    console.error('Error al asignar comercio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar comercio al usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};


export const updateUser = async (req: Request, res: Response) => {
  try {
    // Obtener datos de la solicitud
    const { userId } = req.params;
    const { name, email } = req.body;

    // Validar que se proporcionaron los campos requeridos
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y correo son requeridos'
      });
    }

    // Buscar y actualizar el usuario
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true }
    ).select('-password');

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
      message: 'Usuario actualizado correctamente',
      user
    });

  } catch (error) {
    // Manejo de errores
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};