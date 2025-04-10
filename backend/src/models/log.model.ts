// backend/src/models/log.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ILog extends Document {
  userId: mongoose.Types.ObjectId;
  username: string; 
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  resourceType: string;
  resourceId: mongoose.Types.ObjectId;
  details: string;
  createdAt: Date;
}

const LogSchema = new Schema({
  // Usuario 
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },

  // Informacion detallada
  action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
  resourceType: { type: String, required: true },
  resourceId: { type: Schema.Types.ObjectId, required: true },
  details: { type: String, required: true },

  // Metadata
  createdAt: { type: Date, default: Date.now }
});

export const LogModel = mongoose.model<ILog>('Log', LogSchema);