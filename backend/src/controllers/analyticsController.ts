import { Request, Response } from 'express';
import { CommerceModel } from '../models/commerce.model';
import { UserModel } from '../models/user.model';
import { CategoryModel } from '../models/category.model';
import { AnalyticsEventModel } from '../models/analyticsEvent.model';
import { UserAnalyticsModel } from '../models/userAnalytics.model';
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

export const postAnalyticsEvent = async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    if (!user?.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    let { sessionId, eventType, categoryId, commerceId, path, durationMs, meta } = req.body || req.query || {} as any;
    const incMs = typeof durationMs === 'number' ? durationMs : Number(durationMs) || 0;
    try {
      if (typeof meta === 'string') meta = JSON.parse(meta);
    } catch {}

    if (!sessionId || !eventType) {
      return res.status(400).json({ error: 'sessionId y eventType son requeridos' });
    }

    const uid = new mongoose.Types.ObjectId(user.userId);
    const now = new Date();

    const persistEvents = (process.env.ANALYTICS_PERSIST_EVENTS === 'true');
    if (persistEvents) {
      await AnalyticsEventModel.create({
        userId: uid,
        sessionId,
        eventType,
        categoryId: categoryId ? new mongoose.Types.ObjectId(categoryId) : undefined,
        commerceId: commerceId ? new mongoose.Types.ObjectId(commerceId) : undefined,
        path,
        durationMs: incMs,
        meta,
        createdAt: now,
      });
    }

    await UserAnalyticsModel.updateOne(
      { userId: uid },
      { $setOnInsert: { userId: uid, mapClicks: 0, socialClicks: {}, contactClicks: {}, commerce: [], categories: [] }, $set: { updatedAt: now } },
      { upsert: true }
    );

    if (commerceId) {
      const cid = new mongoose.Types.ObjectId(commerceId);
      if (eventType === 'VIEW_START') {
        const r = await UserAnalyticsModel.updateOne(
          { userId: uid, 'commerce.commerceId': cid },
          { $inc: { 'commerce.$.visits': 1 }, $set: { 'commerce.$.lastVisit': now } }
        );
        if (r.matchedCount === 0) {
          await UserAnalyticsModel.updateOne(
            { userId: uid },
            { $push: { commerce: { commerceId: cid, totalTimeMs: 0, visits: 1, lastVisit: now } } }
          );
        }
      }
      if (eventType === 'VIEW_PAUSE' || eventType === 'VIEW_END' || eventType === 'VIEW_PROGRESS') {
        const r = await UserAnalyticsModel.updateOne(
          { userId: uid, 'commerce.commerceId': cid },
          { $inc: { 'commerce.$.totalTimeMs': incMs }, $set: { 'commerce.$.lastVisit': now } }
        );
        if (r.matchedCount === 0) {
          await UserAnalyticsModel.updateOne(
            { userId: uid },
            { $push: { commerce: { commerceId: cid, totalTimeMs: incMs, visits: 0, lastVisit: now } } }
          );
        }
      }
    }

    if (categoryId) {
      const catId = new mongoose.Types.ObjectId(categoryId);
      if (eventType === 'VIEW_START') {
        const r = await UserAnalyticsModel.updateOne(
          { userId: uid, 'categories.categoryId': catId },
          { $inc: { 'categories.$.visits': 1 }, $set: { 'categories.$.lastVisit': now } }
        );
        if (r.matchedCount === 0) {
          await UserAnalyticsModel.updateOne(
            { userId: uid },
            { $push: { categories: { categoryId: catId, totalTimeMs: 0, visits: 1, lastVisit: now } } }
          );
        }
      }
      if (eventType === 'VIEW_PAUSE' || eventType === 'VIEW_END' || eventType === 'VIEW_PROGRESS') {
        const r = await UserAnalyticsModel.updateOne(
          { userId: uid, 'categories.categoryId': catId },
          { $inc: { 'categories.$.totalTimeMs': incMs }, $set: { 'categories.$.lastVisit': now } }
        );
        if (r.matchedCount === 0) {
          await UserAnalyticsModel.updateOne(
            { userId: uid },
            { $push: { categories: { categoryId: catId, totalTimeMs: incMs, visits: 0, lastVisit: now } } }
          );
        }
      }
    }

    if (eventType === 'CLICK_SOCIAL') {
      const platform = meta?.platform;
      if (platform) {
        await UserAnalyticsModel.updateOne(
          { userId: uid },
          { $inc: { [`socialClicks.${platform}`]: 1 }, $set: { updatedAt: now } }
        );
      }
    }

    if (eventType === 'CLICK_CONTACT') {
      const type = meta?.type;
      if (type) {
        await UserAnalyticsModel.updateOne(
          { userId: uid },
          { $inc: { [`contactClicks.${type}`]: 1 }, $set: { updatedAt: now } }
        );
      }
    }

    if (eventType === 'CLICK_MAP') {
      await UserAnalyticsModel.updateOne(
        { userId: uid },
        { $inc: { mapClicks: 1 }, $set: { updatedAt: now } }
      );
    }

    res.status(201).json({ ok: true });
  } catch (error) {
    console.error('Error al registrar evento de analítica:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getUserAnalytics = async (req: Request, res: Response) => {
  try {
    const { userId: paramUserId } = req.params as any;
    const { user } = req as any;
    const userId = paramUserId || user?.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId requerido' });
    }

    const uid = new mongoose.Types.ObjectId(userId);
    const doc = await UserAnalyticsModel.findOne({ userId: uid }).lean();

    if (!doc) {
      return res.json({ commerce: [], categories: [], socialClicks: [], mapClicks: 0, contactClicks: [] });
    }

    const commerceIds = (doc.commerce || []).map(c => c.commerceId).filter(Boolean) as mongoose.Types.ObjectId[];
    const categoryIds = (doc.categories || []).map(c => c.categoryId).filter(Boolean) as mongoose.Types.ObjectId[];

    const [commerceInfo, categoryInfo] = await Promise.all([
      CommerceModel.find({ _id: { $in: commerceIds } }, { _id: 1, name: 1 }).lean(),
      CategoryModel.find({ _id: { $in: categoryIds } }, { _id: 1, name: 1 }).lean(),
    ]);

    const cMap = new Map(commerceInfo.map(c => [String(c._id), c.name]));
    const catMap = new Map(categoryInfo.map(c => [String(c._id), c.name]));

    const commerce = (doc.commerce || [])
      .map(item => ({
        commerceId: String(item.commerceId),
        name: cMap.get(String(item.commerceId)) || '',
        totalTimeMs: item.totalTimeMs || 0,
        visits: item.visits || 0,
        lastVisit: item.lastVisit,
      }))
      .sort((a, b) => b.totalTimeMs - a.totalTimeMs);

    const categories = (doc.categories || [])
      .map(item => ({
        categoryId: String(item.categoryId),
        name: catMap.get(String(item.categoryId)) || '',
        totalTimeMs: item.totalTimeMs || 0,
        visits: item.visits || 0,
        lastVisit: item.lastVisit,
      }))
      .sort((a, b) => b.totalTimeMs - a.totalTimeMs);

    const socialClicks = Object.entries(doc.socialClicks || {}).map(([platform, clicks]) => ({ platform, clicks }));
    const contactClicks = Object.entries(doc.contactClicks || {}).map(([type, clicks]) => ({ type, clicks }));
    const mapClicks = doc.mapClicks || 0;

    res.json({ commerce, categories, socialClicks, mapClicks, contactClicks });
  } catch (error) {
    console.error('Error al obtener analítica de usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};