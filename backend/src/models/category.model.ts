import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  icon: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema({
  name: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  icon: { 
    type: String, 
    required: true 
  },
  color: { 
    type: String, 
    required: true,
    default: '#4F46E5'
  }
}, {
  timestamps: true
});

export const CategoryModel = mongoose.model<ICategory>('Category', CategorySchema);