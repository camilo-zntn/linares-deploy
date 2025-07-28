import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  name: string;
  role: 'admin'| 'commerce' | 'user';
  status: 'pending' | 'active' | 'deleted';
  verificationCode?: string;
  verificationCodeExpires?: Date;
  isVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  commerceId?: string;
  favoriteCommerces: string[]; // Nuevo campo para favoritos
}

const userSchema = new Schema({
  // Autenticacion
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  // Control y permisos
  role: { type: String, enum: ['admin', 'commerce', 'user'], default: 'user' },
  status: { type: String, enum: ['pending', 'active', 'deleted'], default: 'pending' },
  isVerified: { type: Boolean, default: false },
  // Verificacion y reseteo de contraseña
  verificationCode: { type: String, default: null },
  verificationCodeExpires: { type: Date, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  // Referencia al comercio
  commerceId: { type: Schema.Types.ObjectId, ref: 'Commerce', default: null },
  // Nuevo campo para favoritos
  favoriteCommerces: [{ type: Schema.Types.ObjectId, ref: 'Commerce', default: [] }]
});

export const UserModel = model<IUser>('User', userSchema);