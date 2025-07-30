import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { UserModel } from '../models/user.model';
import { generateUniqueReferralCode } from '../utils/referralGenerator';

// Cargar variables de entorno
dotenv.config({ path: '../../.env' });

const createAdmin = async () => {
  try {
    // Verificar conexion
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Conectado a MongoDB');

    // Verificar si existe el admin
    const existingAdmin = await UserModel.findOne({ rut: "20993176-1" });
    if (existingAdmin) {
      console.log('El administrador ya existe');
      process.exit(0);
    }

    // Generar código de referido único
    const referralCode = await generateUniqueReferralCode();
    console.log('Código de referido generado:', referralCode);

    const adminData = {
      rut: "20993176-1",
      email: "camilo.zntn30@gmail.com",
      password: await bcrypt.hash("123", 10),
      name: "Camilo Zenteno",
      role: "admin" as const,
      status: "active" as const,
      isVerified: true,
      referralCode: referralCode,
      referralCount: 0
    };

    const admin = new UserModel(adminData);
    await admin.save();
    
    console.log('✅ Administrador creado exitosamente');
    console.log('Email:', adminData.email);
    console.log('RUT:', adminData.rut);
    console.log('Código de referido:', adminData.referralCode);

    process.exit(0);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      console.error('❌ Error de validación:', error.message);
    } else {
      console.error('❌ Error:', error);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();