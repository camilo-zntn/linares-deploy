import { Request, Response } from 'express';
import { CommerceModel } from '../models/commerce.model';
import { UserModel } from '../models/user.model';
import { CategoryModel } from '../models/category.model';
import { AnalyticsEventModel } from '../models/analyticsEvent.model';
import { UserAnalyticsModel } from '../models/userAnalytics.model';
import mongoose from 'mongoose';

export const getCategoryAnalytics = async (req: Request, res: Response) => {
  try {
    const { category, period } = req.query; // category name or 'all', period '7d', '30d', '90d'

    let dateFilter = {};
    const now = new Date();
    if (period === '7d') dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) } };
    else if (period === '30d') dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 30)) } };
    else if (period === '90d') dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 90)) } };

    let matchStage: any = { ...dateFilter };

    if (category && category !== 'all') {
      // Búsqueda insensible a mayúsculas/minúsculas para mayor robustez
      const catDoc = await CategoryModel.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
      if (catDoc) {
        matchStage.categoryId = catDoc._id;
      } else {
        // Si la categoría no existe, forzamos que no coincida nada (o podríamos ignorarlo, pero mejor ser explícitos)
        // Sin embargo, si el frontend envía una categoría válida, esto no debería pasar.
        // Si queremos que "si no encuentra, muestre 0", ponemos un ID inexistente.
        matchStage.categoryId = new mongoose.Types.ObjectId(); 
      }
    }

    console.log(`getCategoryAnalytics: category=${category}, period=${period}, matchStage=`, JSON.stringify(matchStage));

    // 1. Visits by Month
    const visitsByMonth = await AnalyticsEventModel.aggregate([
      { $match: { ...matchStage, eventType: 'VIEW_START' } },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const formattedVisits = visitsByMonth.map(v => ({
      month: monthNames[v._id.month - 1],
      visits: v.count
    }));

    // 2. Device Distribution
    const deviceDistribution = await AnalyticsEventModel.aggregate([
      { $match: { ...matchStage, eventType: 'VIEW_START' } },
      {
        $group: {
          _id: "$device",
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedDevices = deviceDistribution.map(d => ({
      name: d._id.charAt(0).toUpperCase() + d._id.slice(1),
      value: d.count
    }));

    // 3. CTR (Clicks)
    const clicks = await AnalyticsEventModel.aggregate([
      { $match: { ...matchStage, eventType: { $in: ['CLICK_SOCIAL', 'CLICK_MAP', 'CLICK_CONTACT'] } } },
      {
        $group: {
          _id: "$eventType",
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedClicks = clicks.map(c => {
      let action = '';
      if (c._id === 'CLICK_SOCIAL') action = 'Social';
      if (c._id === 'CLICK_MAP') action = 'Mapa';
      if (c._id === 'CLICK_CONTACT') action = 'Contacto';
      return {
        action,
        ctr: c.count // Using count as CTR for now, or raw clicks
      };
    });

    res.json({
      visitsByMonth: formattedVisits,
      deviceDistribution: formattedDevices,
      clicks: formattedClicks
    });

  } catch (error) {
    console.error('Error al obtener analítica por categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getCommerceAnalytics = async (req: Request, res: Response) => {
  try {
    const { commerceId, period } = req.query; // commerceId or name, period '7d', '30d', '90d'

    let dateFilter = {};
    const now = new Date();
    if (period === '7d') dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) } };
    else if (period === '30d') dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 30)) } };
    else if (period === '90d') dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 90)) } };

    let matchStage: any = { ...dateFilter };
    let foundCommerce = false;

    if (commerceId) {
      // Try by ID first
      if (mongoose.Types.ObjectId.isValid(commerceId as string)) {
        matchStage.commerceId = new mongoose.Types.ObjectId(commerceId as string);
        foundCommerce = true;
      } else {
        // Try by name (regex)
        const commerce = await CommerceModel.findOne({ name: { $regex: new RegExp(commerceId as string, 'i') } });
        if (commerce) {
          matchStage.commerceId = commerce._id;
          foundCommerce = true;
        }
      }
    }

    if (!foundCommerce && commerceId) {
      // If a commerce was requested but not found, return empty
      return res.json({
        visitsByMonth: [],
        deviceDistribution: [],
        clicks: []
      });
    }

    // If no commerce requested, what should we do? 
    // The requirement says "por locales", implying specific selection.
    // If no selection, maybe return nothing or aggregate all (like category).
    // Let's assume if no commerceId is provided, we return empty or user must search.
    if (!commerceId) {
       return res.json({
        visitsByMonth: [],
        deviceDistribution: [],
        clicks: []
      });
    }

    // 1. Visits by Month
    const visitsByMonth = await AnalyticsEventModel.aggregate([
      { $match: { ...matchStage, eventType: 'VIEW_START' } },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const formattedVisits = visitsByMonth.map(v => ({
      month: monthNames[v._id.month - 1],
      visits: v.count
    }));

    // 2. Device Distribution
    const deviceDistribution = await AnalyticsEventModel.aggregate([
      { $match: { ...matchStage, eventType: 'VIEW_START' } },
      {
        $group: {
          _id: "$device",
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedDevices = deviceDistribution.map(d => ({
      name: d._id.charAt(0).toUpperCase() + d._id.slice(1),
      value: d.count
    }));

    // 3. CTR (Clicks)
    const clicks = await AnalyticsEventModel.aggregate([
      { $match: { ...matchStage, eventType: { $in: ['CLICK_SOCIAL', 'CLICK_MAP', 'CLICK_CONTACT'] } } },
      {
        $group: {
          _id: "$eventType",
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedClicks = clicks.map(c => {
      let action = '';
      if (c._id === 'CLICK_SOCIAL') action = 'Social';
      if (c._id === 'CLICK_MAP') action = 'Mapa';
      if (c._id === 'CLICK_CONTACT') action = 'Contacto';
      return {
        action,
        ctr: c.count
      };
    });

    res.json({
      visitsByMonth: formattedVisits,
      deviceDistribution: formattedDevices,
      clicks: formattedClicks
    });

  } catch (error) {
    console.error('Error al obtener analítica por comercio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

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

    // Si tenemos commerceId pero no categoryId, intentamos buscar la categoría del comercio
    if (commerceId && !categoryId) {
      const commerce = await CommerceModel.findById(commerceId).select('category');
      if (commerce?.category) {
        categoryId = commerce.category;
      }
    }

    const uid = new mongoose.Types.ObjectId(user.userId);
    const now = new Date();

    // Detectar dispositivo
    const userAgent = req.headers['user-agent'] || '';
    let device = 'desktop';
    if (/mobile/i.test(userAgent)) device = 'mobile';
    else if (/tablet/i.test(userAgent)) device = 'tablet';

    // Force persist events or check env
    const persistEvents = true; // Always true based on user request, or use env
    // const persistEvents = (process.env.ANALYTICS_PERSIST_EVENTS === 'true');
    
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
        device,
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

export const getTopCommerces = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'visits'; // 'visits', 'totalTimeMs', 'name'
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;
    const search = (req.query.search as string) || '';

    console.log(`getTopCommerces: page=${page}, limit=${limit}, search=${search}`);

    // 1. Obtener analíticas agrupadas
    const analytics = await UserAnalyticsModel.aggregate([
      { $unwind: '$commerce' },
      {
        $group: {
          _id: '$commerce.commerceId',
          visits: { $sum: '$commerce.visits' },
          totalTimeMs: { $sum: '$commerce.totalTimeMs' }
        }
      }
    ]);

    console.log(`Analytics found: ${analytics.length}`);

    const analyticsMap = new Map(analytics.map(item => [String(item._id), item]));

    // 2. Construir filtro de búsqueda para comercios
    const filter: any = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // 3. Obtener comercios
    const commerces = await CommerceModel.find(filter)
      .select('name category')
      .populate('category', 'name')
      .lean();

    console.log(`Commerces found: ${commerces.length}`);

    // 4. Combinar datos
    let data = commerces.map((commerce: any) => {
      const stats = analyticsMap.get(String(commerce._id));
      return {
        _id: commerce._id,
        name: commerce.name,
        category: commerce.category?.name || 'Sin Categoría',
        visits: stats?.visits || 0,
        totalTimeMs: stats?.totalTimeMs || 0
      };
    });

    // 5. Ordenar
    data.sort((a: any, b: any) => {
      if (typeof a[sortBy] === 'string') {
        return sortOrder * a[sortBy].localeCompare(b[sortBy]);
      }
      return sortOrder * (a[sortBy] - b[sortBy]);
    });

    // 6. Paginar
    const total = data.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedData = data.slice((page - 1) * limit, page * limit);

    console.log(`Returning ${paginatedData.length} items`);

    res.json({
      data: paginatedData,
      total,
      page,
      pages: totalPages
    });

  } catch (error) {
    console.error('Error al obtener top comercios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
