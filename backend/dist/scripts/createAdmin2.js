"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_model_1 = require("../models/user.model");
// Cargar variables de entorno
dotenv_1.default.config({ path: '../../.env' });
const createSecondAdmin = async () => {
    try {
        // Verificar conexion
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        // Verificar si existe el admin
        const existingAdmin = await user_model_1.UserModel.findOne({ username: "ruly" });
        if (existingAdmin) {
            console.log('El usuario tomi ya existe');
            process.exit(0);
        }
        const adminData = {
            username: "ruly",
            email: "monsalveraul45@gmail.com",
            password: await bcryptjs_1.default.hash("123", 10),
            name: "Raul",
            role: "admin",
            status: "active",
            isVerified: true
        };
        const admin = new user_model_1.UserModel(adminData);
        await admin.save();
        console.log('Administrador ruly creado exitosamente');
        process.exit(0);
    }
    catch (error) {
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            console.error('Error de validacion:', error.message);
        }
        else {
            console.error('Error:', error);
        }
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
};
createSecondAdmin();
