import { Request, Response } from 'express';
import { CommerceModel } from '../models/commerce.model';
import { UserModel } from '../models/user.model';
import { CategoryModel } from '../models/category.model';
import mongoose from 'mongoose';

export const getCommerceByCategory = async (req: Request, res: Response) => {
  try {
    // Primero obtener todas las categorías
    const allCategories = await CategoryModel.find({}, { name: 1 });
    
    // Obtener el conteo de comercios por categoría
    const commerceByCategory = await CommerceModel.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: '$categoryInfo'
      },
      {
        $group: {
          _id: '$categoryInfo._id',
          category: { $first: '$categoryInfo.name' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          category: 1,
          count: 1
        }
      }
    ]);

    // Crear un mapa de los conteos
    const countMap = new Map(commerceByCategory.map(item => [item.category, item.count]));
    
    // Asegurar que todas las categorías estén incluidas
    const result = allCategories.map(cat => ({
      category: cat.name,
      count: countMap.get(cat.name) || 0
    }));

    res.json(result);
  } catch (error) {
    console.error('Error al obtener comercios por categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userStats = await UserModel.aggregate([
      {
        $group: {
          _id: '$role',
          active: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          },
          inactive: {
            $sum: {
              $cond: [{ $in: ['$status', ['pending', 'deleted']] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          role: '$_id',
          active: 1,
          inactive: 1
        }
      }
    ]);

    // Asegurar que todos los roles estén representados
    const roles = ['admin', 'commerce', 'user'];
    const statsMap = new Map(userStats.map(stat => [stat.role, stat]));
    
    const result = roles.map(role => ({
      role,
      active: (statsMap.get(role)?.active || 0),
      inactive: (statsMap.get(role)?.inactive || 0)
    }));

    res.json(result);
  } catch (error) {
    console.error('Error al obtener estadísticas de usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};