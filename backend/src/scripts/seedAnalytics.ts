import mongoose from 'mongoose';
import { AnalyticsEventModel } from '../models/analyticsEvent.model';
import { CommerceModel } from '../models/commerce.model';
import { CategoryModel } from '../models/category.model';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedAnalytics = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Limpiar eventos anteriores si se desea (opcional, aquí solo agregamos)
    // await AnalyticsEventModel.deleteMany({});

    const commerces = await CommerceModel.find({});
    const categories = await CategoryModel.find({});
    
    if (commerces.length === 0) {
      console.log('No commerces found to attach events to.');
      process.exit(0);
    }

    const events = [];
    const now = new Date();
    const monthsBack = 3;

    // Generar eventos para los últimos 3 meses
    for (let i = 0; i < 50; i++) {
      const commerce = commerces[Math.floor(Math.random() * commerces.length)];
      // Intentar encontrar la categoría del comercio
      const category = categories.find(c => (c as any)._id.toString() === (commerce as any).category.toString());
      
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Últimos 90 días

      // Evento de Visita
      events.push({
        userId: new mongoose.Types.ObjectId(), // Fake user ID
        sessionId: 'fake-session-' + i,
        eventType: 'VIEW_START',
        commerceId: commerce._id,
        categoryId: category ? category._id : undefined,
        path: `/commerce/${commerce._id}`,
        device: Math.random() > 0.7 ? 'desktop' : 'mobile',
        createdAt: date
      });

      // Evento de Click (menos frecuente)
      if (Math.random() > 0.7) {
        const clickType = ['CLICK_SOCIAL', 'CLICK_MAP', 'CLICK_CONTACT'][Math.floor(Math.random() * 3)];
        let meta = {};
        if (clickType === 'CLICK_SOCIAL') meta = { platform: ['instagram', 'facebook', 'whatsapp'][Math.floor(Math.random() * 3)] };
        if (clickType === 'CLICK_CONTACT') meta = { type: ['phone', 'email'][Math.floor(Math.random() * 2)] };

        events.push({
          userId: new mongoose.Types.ObjectId(),
          sessionId: 'fake-session-' + i,
          eventType: clickType,
          commerceId: commerce._id,
          categoryId: category ? category._id : undefined,
          path: `/commerce/${commerce._id}`,
          device: Math.random() > 0.7 ? 'desktop' : 'mobile',
          meta,
          createdAt: date
        });
      }
    }

    await AnalyticsEventModel.insertMany(events);
    console.log(`Inserted ${events.length} fake analytics events.`);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAnalytics();
