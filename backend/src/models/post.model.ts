import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  title: string;
  details: string;
  imageUrl: string;
  status: 'active' | 'inactive';
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema({
  title: { type: String, required: true },
  details: { type: String, required: true },
  imageUrl: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  },
  layout: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    w: { type: Number, default: 1 },
    h: { type: Number, default: 1 }
  }
}, {
  timestamps: true
});

export const PostModel = mongoose.model<IPost>('Post', PostSchema);
