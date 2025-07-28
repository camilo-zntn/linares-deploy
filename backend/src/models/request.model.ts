import { Schema, model, Document } from 'mongoose';

export interface IMessage {
  _id?: string;
  sender: 'user' | 'admin';
  message: string;
  timestamp: Date;
  senderName: string;
  senderEmail?: string;
}

export interface IRequest extends Document {
  _id: string;
  email: string;
  subject: string;
  description: string;
  type: 'problem' | 'suggestion';
  status: 'pending' | 'in_process' | 'resolved';
  userId?: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema({
  sender: { type: String, enum: ['user', 'admin'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  senderName: { type: String, required: true },
  senderEmail: { type: String }
});

const requestSchema = new Schema({
  email: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['problem', 'suggestion'], required: true },
  status: { type: String, enum: ['pending', 'in_process', 'resolved'], default: 'pending' },
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  messages: [messageSchema]
}, {
  timestamps: true
});

export const RequestModel = model<IRequest>('Request', requestSchema);