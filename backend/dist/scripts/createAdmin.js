"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_model_1 = require("../models/user.model");
const referralGenerator_1 = require("../utils/referralGenerator");
// Cargar variables de entorno
dotenv_1.default.config({ path: '../../.env' });
const createAdmin = async () => {
    try {
        // Verificar conexion
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('Conectado a MongoDB');
        // Verificar si existe el admin
        const existingAdmin = await user_model_1.UserModel.findOne({ rut: "20993176-1" });
        if (existingAdmin) {
            console.log('El administrador ya existe');
            process.exit(0);
        }
        // Generar código de referido único
        const referralCode = await (0, referralGenerator_1.generateUniqueReferralCode)();
        console.log('Código de referido generado:', referralCode);
        const adminData = {
            rut: "20993176-1",
            email: "camilo.zntn30@gmail.com",
            password: await bcryptjs_1.default.hash("123", 10),
            name: "Camilo Zenteno",
            role: "admin",
            status: "active",
            isVerified: true,
            referralCode: referralCode,
            referralCount: 0
        };
        const admin = new user_model_1.UserModel(adminData);
        await admin.save();
        console.log('✅ Administrador creado exitosamente');
        console.log('Email:', adminData.email);
        console.log('RUT:', adminData.rut);
        console.log('Código de referido:', adminData.referralCode);
        process.exit(0);
    }
    catch (error) {
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            console.error('❌ Error de validación:', error.message);
        }
        else {
            console.error('❌ Error:', error);
        }
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
};
createAdmin();
