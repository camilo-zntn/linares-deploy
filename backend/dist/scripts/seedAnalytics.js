"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const analyticsEvent_model_1 = require("../models/analyticsEvent.model");
const commerce_model_1 = require("../models/commerce.model");
const category_model_1 = require("../models/category.model");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const seedAnalytics = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found');
        }
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        // Limpiar eventos anteriores si se desea (opcional, aquí solo agregamos)
        // await AnalyticsEventModel.deleteMany({});
        const commerces = await commerce_model_1.CommerceModel.find({});
        const categories = await category_model_1.CategoryModel.find({});
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
            const category = categories.find(c => c._id.toString() === commerce.category.toString());
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Últimos 90 días
            // Evento de Visita
            events.push({
                userId: new mongoose_1.default.Types.ObjectId(), // Fake user ID
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
                if (clickType === 'CLICK_SOCIAL')
                    meta = { platform: ['instagram', 'facebook', 'whatsapp'][Math.floor(Math.random() * 3)] };
                if (clickType === 'CLICK_CONTACT')
                    meta = { type: ['phone', 'email'][Math.floor(Math.random() * 2)] };
                events.push({
                    userId: new mongoose_1.default.Types.ObjectId(),
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
        await analyticsEvent_model_1.AnalyticsEventModel.insertMany(events);
        console.log(`Inserted ${events.length} fake analytics events.`);
        process.exit(0);
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
};
seedAnalytics();
