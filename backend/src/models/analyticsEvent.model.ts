import mongoose, { Schema, Document } from 'mongoose';

export type AnalyticsEventType =
  | 'VIEW_START'
  | 'VIEW_PAUSE'
  | 'VIEW_RESUME'
  | 'VIEW_END'
  | 'VIEW_PROGRESS'
  | 'CLICK_SOCIAL'
  | 'CLICK_MAP'
  | 'CLICK_CONTACT';

export interface IAnalyticsEvent extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  eventType: AnalyticsEventType;
  categoryId?: mongoose.Types.ObjectId | null;
  commerceId?: mongoose.Types.ObjectId | null;
  path?: string;
  durationMs?: number;
  meta?: Record<string, any>;
  device?: string;
  createdAt: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true },
  eventType: {
    type: String,
    enum: [
      'VIEW_START',
      'VIEW_PAUSE',
      'VIEW_RESUME',
      'VIEW_END',
      'VIEW_PROGRESS',
      'CLICK_SOCIAL',
      'CLICK_MAP',
      'CLICK_CONTACT',
    ],
    required: true,
  },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  commerceId: { type: Schema.Types.ObjectId, ref: 'Commerce', default: null },
  path: { type: String },
  durationMs: { type: Number },
  meta: { type: Schema.Types.Mixed },
  device: { type: String, default: 'unknown' },
  createdAt: { type: Date, default: Date.now },
});

export const AnalyticsEventModel = mongoose.model<IAnalyticsEvent>(
  'AnalyticsEvent',
  AnalyticsEventSchema
);