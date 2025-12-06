import mongoose, { Schema, Document } from 'mongoose';

interface CommerceStat {
  commerceId: mongoose.Types.ObjectId;
  totalTimeMs: number;
  visits: number;
  lastVisit: Date;
}

interface CategoryStat {
  categoryId: mongoose.Types.ObjectId;
  totalTimeMs: number;
  visits: number;
  lastVisit: Date;
}

export interface IUserAnalytics extends Document {
  userId: mongoose.Types.ObjectId;
  commerce: CommerceStat[];
  categories: CategoryStat[];
  socialClicks: Record<string, number>;
  contactClicks: Record<string, number>;
  mapClicks: number;
  updatedAt: Date;
}

const CommerceStatSchema = new Schema<CommerceStat>({
  commerceId: { type: Schema.Types.ObjectId, ref: 'Commerce', required: true },
  totalTimeMs: { type: Number, default: 0 },
  visits: { type: Number, default: 0 },
  lastVisit: { type: Date, default: Date.now },
});

const CategoryStatSchema = new Schema<CategoryStat>({
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  totalTimeMs: { type: Number, default: 0 },
  visits: { type: Number, default: 0 },
  lastVisit: { type: Date, default: Date.now },
});

const UserAnalyticsSchema = new Schema<IUserAnalytics>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  commerce: { type: [CommerceStatSchema], default: [] },
  categories: { type: [CategoryStatSchema], default: [] },
  socialClicks: { type: Schema.Types.Mixed, default: {} },
  contactClicks: { type: Schema.Types.Mixed, default: {} },
  mapClicks: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

export const UserAnalyticsModel = mongoose.model<IUserAnalytics>('UserAnalytics', UserAnalyticsSchema);