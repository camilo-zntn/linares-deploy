import { Schema, model, Document } from 'mongoose';
import { validateRut } from '../utils/rutValidator';
import { generateUniqueReferralCode } from '../utils/referralGenerator';

export interface IUser extends Document {
  _id: string;
  rut: string;
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
  favoriteCommerces: string[];
  // Nuevos campos para sistema de referidos
  referralCode: string;
  referredBy?: string;
  referralCount: number;
}

const userSchema = new Schema({
  // Autenticacion
  rut: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(rut: string) {
        return validateRut(rut).isValid;
      },
      message: 'RUT inválido'
    }
  },
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
  // Campo para favoritos
  favoriteCommerces: [{ type: Schema.Types.ObjectId, ref: 'Commerce', default: [] }],
  // Nuevos campos para sistema de referidos
  referralCode: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  referredBy: { 
    type: String, 
    default: null,
    index: true
  },
  referralCount: { 
    type: Number, 
    default: 0
  }
});

// Middleware pre-save para generar referralCode si no existe
userSchema.pre('save', async function(next) {
  if (!this.referralCode) {
    try {
      this.referralCode = await generateUniqueReferralCode();
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

export const UserModel = model<IUser>('User', userSchema);