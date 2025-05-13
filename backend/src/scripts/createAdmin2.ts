import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { UserModel } from '../models/user.model';

// Cargar variables de entorno
dotenv.config({ path: '../../.env' });

const createSecondAdmin = async () => {
  try {
    // Verificar conexion
    await mongoose.connect(process.env.MONGODB_URI!);

    // Verificar si existe el admin
    const existingAdmin = await UserModel.findOne({ username: "ruly" });
    if (existingAdmin) {
      console.log('El usuario tomi ya existe');
      process.exit(0);
    }

    const adminData = {
      username: "ruly",
      email: "monsalveraul45@gmail.com",
      password: await bcrypt.hash("123", 10),
      name: "Raul",
      role: "admin",
      status: "active", 
      isVerified: true
    };

    const admin = new UserModel(adminData);
    await admin.save();
    console.log('Administrador ruly creado exitosamente');

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

createSecondAdmin();