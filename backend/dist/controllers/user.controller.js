"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.checkRutAvailability = exports.checkIfFavorite = exports.getFavoriteCommerces = exports.removeFromFavorites = exports.addToFavorites = exports.updateUserProfile = exports.updateUser = exports.assignCommerceToUser = exports.deleteUser = exports.updateUserRole = exports.updateUserStatus = exports.getAllUsers = void 0;
const user_model_1 = require("../models/user.model");
const rutValidator_1 = require("../utils/rutValidator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const getAllUsers = async (req, res) => {
    try {
        // Obtener usuarios ordenados por fecha de creacion
        const users = await user_model_1.UserModel.find()
            .sort({ createdAt: -1 })
            .select('-password');
        // Enviar respuesta exitosa
        res.json(users);
    }
    catch (error) {
        // Manejo de errores
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios'
        });
    }
};
exports.getAllUsers = getAllUsers;
const updateUserStatus = async (req, res) => {
    try {
        // Obtener datos de la solicitud
        const { userId } = req.params;
        const { status } = req.body;
        // Actualizar estado del usuario
        const user = await user_model_1.UserModel.findByIdAndUpdate(userId, { status }, { new: true });
        // Validar si existe el usuario
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Estado actualizado correctamente',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                status: user.status
            }
        });
    }
    catch (error) {
        // Manejo de errores
        console.error('Error al actualizar estado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado'
        });
    }
};
exports.updateUserStatus = updateUserStatus;
const updateUserRole = async (req, res) => {
    try {
        // Obtener datos de la solicitud
        const { userId } = req.params;
        const { role } = req.body;
        // Validar rol permitido
        const allowedRoles = ['user', 'admin', 'commerce'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Rol no válido'
            });
        }
        // Buscar el usuario primero
        const user = await user_model_1.UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        // Si el nuevo rol no es 'commerce', eliminar el commerceId
        if (role !== 'commerce') {
            user.commerceId = undefined;
        }
        // Actualizar rol del usuario
        user.role = role;
        await user.save();
        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Rol actualizado correctamente',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                commerceId: user.commerceId
            }
        });
    }
    catch (error) {
        // Manejo de errores
        console.error('Error al actualizar rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar rol',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.updateUserRole = updateUserRole;
const deleteUser = async (req, res) => {
    try {
        // Obtener ID del usuario
        const { id } = req.params;
        // Eliminar usuario
        const deletedUser = await user_model_1.UserModel.findByIdAndDelete(id);
        // Validar si existe el usuario
        if (!deletedUser) {
            res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
            return;
        }
        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Usuario eliminado permanentemente'
        });
    }
    catch (error) {
        // Manejo de errores
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.deleteUser = deleteUser;
const assignCommerceToUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { commerceId } = req.body;
        // Buscar y actualizar el usuario
        const user = await user_model_1.UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        // Si el commerceId está vacío, eliminar la asociación
        if (!commerceId) {
            user.commerceId = undefined;
            await user.save();
            return res.json({
                success: true,
                message: 'Comercio desvinculado correctamente',
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    commerceId: user.commerceId
                }
            });
        }
        // Verificar que el usuario tenga rol de comercio
        if (user.role !== 'commerce') {
            return res.status(400).json({
                success: false,
                message: 'Solo se puede asignar un comercio a usuarios con rol de comercio'
            });
        }
        // Actualizar el comercio del usuario
        user.commerceId = commerceId;
        await user.save();
        res.json({
            success: true,
            message: 'Comercio asignado correctamente',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                commerceId: user.commerceId
            }
        });
    }
    catch (error) {
        console.error('Error al asignar comercio:', error);
        res.status(500).json({
            success: false,
            message: 'Error al asignar comercio al usuario',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.assignCommerceToUser = assignCommerceToUser;
const updateUser = async (req, res) => {
    try {
        // Obtener datos de la solicitud
        const { userId } = req.params;
        const { name, email } = req.body;
        // Validar que se proporcionaron los campos requeridos
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y correo son requeridos'
            });
        }
        // Buscar y actualizar el usuario
        const user = await user_model_1.UserModel.findByIdAndUpdate(userId, { name, email }, { new: true }).select('-password');
        // Validar si existe el usuario
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Usuario actualizado correctamente',
            user
        });
    }
    catch (error) {
        // Manejo de errores
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.updateUser = updateUser;
// Actualizar perfil del usuario autenticado
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { rut, fullName, email } = req.body;
        // Validar que se proporcionaron los campos requeridos
        if (!fullName || !email) {
            return res.status(400).json({
                success: false,
                message: 'Nombre completo y correo son requeridos'
            });
        }
        // Validar RUT si se proporciona
        if (rut && !(0, rutValidator_1.validateRut)(rut)) {
            return res.status(400).json({
                success: false,
                message: 'RUT inválido'
            });
        }
        // Verificar si el email ya existe (excluyendo el usuario actual)
        if (email) {
            const existingUser = await user_model_1.UserModel.findOne({
                email,
                _id: { $ne: userId }
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'El correo electrónico ya está en uso'
                });
            }
        }
        // Verificar si el RUT ya existe (excluyendo el usuario actual)
        if (rut) {
            const existingRutUser = await user_model_1.UserModel.findOne({
                rut,
                _id: { $ne: userId }
            });
            if (existingRutUser) {
                return res.status(400).json({
                    success: false,
                    message: 'El RUT ya está registrado'
                });
            }
        }
        // Preparar datos para actualizar
        const updateData = {
            name: fullName,
            email
        };
        // Solo actualizar RUT si se proporciona (para admin)
        if (rut) {
            updateData.rut = rut;
        }
        // Buscar y actualizar el usuario
        const user = await user_model_1.UserModel.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        res.json({
            success: true,
            message: 'Perfil actualizado correctamente',
            user
        });
    }
    catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar perfil',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.updateUserProfile = updateUserProfile;
// Agregar comercio a favoritos
const addToFavorites = async (req, res) => {
    try {
        const { commerceId } = req.body;
        const userId = req.user.userId; // Cambiar de .id a .userId
        const user = await user_model_1.UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        // Verificar si ya está en favoritos
        if (user.favoriteCommerces.includes(commerceId)) {
            return res.status(400).json({
                success: false,
                message: 'El comercio ya está en favoritos'
            });
        }
        // Agregar a favoritos
        user.favoriteCommerces.push(commerceId);
        await user.save();
        res.json({
            success: true,
            message: 'Comercio agregado a favoritos',
            favoriteCommerces: user.favoriteCommerces
        });
    }
    catch (error) {
        console.error('Error al agregar a favoritos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar a favoritos'
        });
    }
};
exports.addToFavorites = addToFavorites;
// Remover comercio de favoritos
const removeFromFavorites = async (req, res) => {
    try {
        const { commerceId } = req.params;
        const userId = req.user.userId; // Cambiar de .id a .userId
        const user = await user_model_1.UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        // Remover de favoritos
        user.favoriteCommerces = user.favoriteCommerces.filter((id) => id.toString() !== commerceId);
        await user.save();
        res.json({
            success: true,
            message: 'Comercio removido de favoritos',
            favoriteCommerces: user.favoriteCommerces
        });
    }
    catch (error) {
        console.error('Error al remover de favoritos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al remover de favoritos'
        });
    }
};
exports.removeFromFavorites = removeFromFavorites;
// Obtener comercios favoritos del usuario
const getFavoriteCommerces = async (req, res) => {
    try {
        const userId = req.user.userId; // Cambiar de .id a .userId
        const user = await user_model_1.UserModel.findById(userId)
            .populate({
            path: 'favoriteCommerces',
            populate: {
                path: 'category',
                select: 'name'
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        res.json({
            success: true,
            favoriteCommerces: user.favoriteCommerces
        });
    }
    catch (error) {
        console.error('Error al obtener favoritos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener favoritos'
        });
    }
};
exports.getFavoriteCommerces = getFavoriteCommerces;
// Verificar si un comercio está en favoritos
const checkIfFavorite = async (req, res) => {
    try {
        const { commerceId } = req.params;
        const userId = req.user.userId; // Cambiar de .id a .userId
        const user = await user_model_1.UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        const isFavorite = user.favoriteCommerces.includes(commerceId);
        res.json({
            success: true,
            isFavorite
        });
    }
    catch (error) {
        console.error('Error al verificar favorito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar favorito'
        });
    }
};
exports.checkIfFavorite = checkIfFavorite;
// Función para verificar disponibilidad de RUT
const checkRutAvailability = async (req, res) => {
    try {
        const { rut } = req.params;
        // Validar formato del RUT
        const validation = (0, rutValidator_1.validateRut)(rut);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.message,
                available: false
            });
        }
        // Buscar si el RUT ya existe
        const existingUser = await user_model_1.UserModel.findOne({ rut: validation.cleanRut });
        res.json({
            success: true,
            available: !existingUser,
            message: existingUser ? 'RUT ya está en uso' : 'RUT disponible'
        });
    }
    catch (error) {
        console.error('Error al verificar disponibilidad de RUT:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar RUT',
            available: false
        });
    }
};
exports.checkRutAvailability = checkRutAvailability;
const changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Contraseña actual y nueva son requeridas' });
        }
        const user = await user_model_1.UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Contraseña actual incorrecta' });
        }
        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres' });
        }
        const hashed = await bcryptjs_1.default.hash(newPassword, 10);
        user.password = hashed;
        await user.save();
        res.json({ message: 'Contraseña cambiada correctamente' });
    }
    catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ message: 'Error al cambiar la contraseña' });
    }
};
exports.changePassword = changePassword;
