import mongoose, { Schema, Document } from 'mongoose';

export interface IDiscount extends Document {
  commerceId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  percent: number;
  minReferrals: number;
  active: boolean;
  daysOfWeek: string[];
  targetRut?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DiscountSchema = new Schema<IDiscount>({
  commerceId: { type: Schema.Types.ObjectId, ref: 'Commerce', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: false },
  percent: { type: Number, required: true, min: 1, max: 100 },
  minReferrals: { type: Number, required: true, min: 0 },
  active: { type: Boolean, default: true },
  daysOfWeek: { 
    type: [String], 
    default: [] 
  },
  targetRut: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const DiscountModel = mongoose.model<IDiscount>('Discount', DiscountSchema);
