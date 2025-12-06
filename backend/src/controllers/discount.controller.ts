import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { DiscountModel } from '../models/discount.model';
import { UserModel } from '../models/user.model';
import { CommerceModel } from '../models/commerce.model';

export const createDiscount = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (user?.role !== 'commerce') {
      return res.status(403).json({ message: 'Solo comercios pueden crear descuentos' });
    }

    const dbUser = await UserModel.findById(user.userId).select('commerceId');
    if (!dbUser?.commerceId) {
      return res.status(400).json({ message: 'Usuario comercio sin comercio asignado' });
    }

    const { title, description, percent, minReferrals, active, targetRut, daysOfWeek } = req.body || {};
    // description ya no es obligatorio
    if (!title || !percent || minReferrals === undefined) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    const doc = await DiscountModel.create({
      commerceId: new mongoose.Types.ObjectId(dbUser.commerceId as any),
      title,
      description: description || '',
      percent: Number(percent),
      minReferrals: Number(minReferrals),
      active: active !== undefined ? Boolean(active) : true,
      targetRut: targetRut || undefined,
      daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek : []
    });

    res.status(201).json({ id: doc._id });
  } catch (error) {
    console.error('Error creando descuento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getAvailableDiscounts = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (!user) return res.status(401).json({ message: 'No autenticado' });

    let matchStage: any = { active: true };
    if (user.role === 'user') {
      const dbUser = await UserModel.findById(user.userId).select('referralCount rut');
      if (!dbUser) return res.status(404).json({ message: 'Usuario no encontrado' });
      
      // Lógica para filtrar por RUT objetivo o referidos
      matchStage.$or = [
        // Caso 1: Descuento general (sin targetRut) y cumple referidos
        { 
          targetRut: { $exists: false },
          minReferrals: { $lte: dbUser.referralCount || 0 }
        },
        // Caso 2: Descuento específico para este RUT
        { 
          targetRut: dbUser.rut 
        }
      ];
    } else if (user.role === 'admin') {
      // Admin ve todos sin restriccion
    } else {
      // Otros roles no ven la seccion de usuario
      return res.status(403).json({ message: 'No autorizado' });
    }

    const discounts = await DiscountModel.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'commerces',
          localField: 'commerceId',
          foreignField: '_id',
          as: 'commerceInfo',
        },
      },
      { $unwind: '$commerceInfo' },
      {
        $project: {
          _id: 0,
          discountId: '$_id',
          title: 1,
          description: 1,
          percent: 1,
          minReferrals: 1,
          commerceId: '$commerceId',
          commerceName: '$commerceInfo.name',
          imageUrl: '$commerceInfo.imageUrl',
          daysOfWeek: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.json({ discounts });
  } catch (error) {
    console.error('Error obteniendo descuentos disponibles:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getMyDiscounts = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (user?.role !== 'commerce') {
      return res.status(403).json({ message: 'Solo comercios' });
    }
    const dbUser = await UserModel.findById(user.userId).select('commerceId');
    if (!dbUser?.commerceId) return res.status(400).json({ message: 'Sin comercio asignado' });

    const list = await DiscountModel.find({ commerceId: dbUser.commerceId }).sort({ createdAt: -1 }).lean();
    res.json({ discounts: list });
  } catch (error) {
    console.error('Error obteniendo mis descuentos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const updateDiscount = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (user?.role !== 'commerce') {
      return res.status(403).json({ message: 'Solo comercios' });
    }
    const { id } = req.params as any;
    const dbUser = await UserModel.findById(user.userId).select('commerceId');
    if (!dbUser?.commerceId) return res.status(400).json({ message: 'Sin comercio asignado' });

    const discount = await DiscountModel.findById(id).select('commerceId');
    if (!discount) return res.status(404).json({ message: 'Descuento no encontrado' });
    if (String(discount.commerceId) !== String(dbUser.commerceId)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { title, description, percent, minReferrals, active, daysOfWeek, targetRut } = req.body || {};
    const update: any = { updatedAt: new Date() };
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (percent !== undefined) update.percent = Number(percent);
    if (minReferrals !== undefined) update.minReferrals = Number(minReferrals);
    if (active !== undefined) update.active = Boolean(active);
    if (daysOfWeek !== undefined && Array.isArray(daysOfWeek)) update.daysOfWeek = daysOfWeek;
    if (targetRut !== undefined) update.targetRut = targetRut;

    await DiscountModel.updateOne({ _id: id }, { $set: update });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error actualizando descuento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const deleteDiscount = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (user?.role !== 'commerce') {
      return res.status(403).json({ message: 'Solo comercios' });
    }
    const { id } = req.params as any;
    const dbUser = await UserModel.findById(user.userId).select('commerceId');
    if (!dbUser?.commerceId) return res.status(400).json({ message: 'Sin comercio asignado' });

    const discount = await DiscountModel.findById(id).select('commerceId');
    if (!discount) return res.status(404).json({ message: 'Descuento no encontrado' });
    if (String(discount.commerceId) !== String(dbUser.commerceId)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    await DiscountModel.deleteOne({ _id: id });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error eliminando descuento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
