"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const commerce_model_1 = require("../models/commerce.model");
const userAnalytics_model_1 = require("../models/userAnalytics.model");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const check = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found');
        }
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        const commerceCount = await commerce_model_1.CommerceModel.countDocuments();
        console.log(`Commerce count: ${commerceCount}`);
        const commerces = await commerce_model_1.CommerceModel.find({}, { name: 1, category: 1 }).limit(5);
        console.log('First 5 commerces:', JSON.stringify(commerces, null, 2));
        const analyticsCount = await userAnalytics_model_1.UserAnalyticsModel.countDocuments();
        console.log(`UserAnalytics count: ${analyticsCount}`);
        process.exit(0);
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
};
check();
