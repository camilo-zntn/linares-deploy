import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { UserModel } from '../models/user.model';

// Cargar variables de entorno
dotenv.config({ path: '../../.env' });

const createAdmin = async () => {
  try {
    // Verificar conexion
    await mongoose.connect(process.env.MONGODB_URI!);

    // Verificar si existe el admin
    const existingAdmin = await UserModel.findOne({ username: "admin" });
    if (existingAdmin) {
      process.exit(0);
    }

    const adminData = {
      username: "admin",
      email: "admin@corporacion.cl",
      password: await bcrypt.hash("123", 10),
      name: "Administrador",
      role: "admin",
      status: "active", 
      isVerified: true
    };

    const admin = new UserModel(adminData);
    await admin.save();

    process.exit(0);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      console.error('Error de validacion:', error.message);
    } else {
      console.error('Error:', error);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();