import mongoose from 'mongoose';
import { CommerceModel } from '../models/commerce.model';
import { UserAnalyticsModel } from '../models/userAnalytics.model';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const check = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const commerceCount = await CommerceModel.countDocuments();
    console.log(`Commerce count: ${commerceCount}`);

    const commerces = await CommerceModel.find({}, { name: 1, category: 1 }).limit(5);
    console.log('First 5 commerces:', JSON.stringify(commerces, null, 2));

    const analyticsCount = await UserAnalyticsModel.countDocuments();
    console.log(`UserAnalytics count: ${analyticsCount}`);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

check();
