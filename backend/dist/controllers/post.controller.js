"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postController = void 0;
const post_model_1 = require("../models/post.model");
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const promises_1 = __importDefault(require("fs/promises"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const processImage = async (file) => {
    let finalFilename;
    try {
        console.log(`Processing file: ${file.originalname}, mimetype: ${file.mimetype}, path: ${file.path}`);
        if (!file.mimetype.includes('webp')) {
            const webpFilename = `${file.filename.split('.')[0]}.webp`;
            const webpPath = path_1.default.join(__dirname, '../../uploads', webpFilename);
            const originalPath = file.path;
            console.log(`Converting to WebP: ${originalPath} -> ${webpPath}`);
            // Convertir a WebP
            await (0, sharp_1.default)(originalPath)
                .webp({ quality: 80 })
                .toFile(webpPath);
            console.log(`WebP conversion completed. Now attempting to delete original: ${originalPath}`);
            // Verificar que el archivo WebP se creó correctamente
            try {
                await promises_1.default.access(webpPath);
                console.log(`WebP file verified: ${webpPath}`);
            }
            catch (error) {
                throw new Error(`WebP file was not created successfully: ${webpPath}`);
            }
            // Intentar eliminar el archivo original
            let deleted = false;
            // Método 1: fs.unlink con reintentos
            for (let attempt = 1; attempt <= 3 && !deleted; attempt++) {
                try {
                    await new Promise(resolve => setTimeout(resolve, 100 * attempt));
                    await promises_1.default.unlink(originalPath);
                    console.log(`Successfully deleted original file with fs.unlink (attempt ${attempt}): ${originalPath}`);
                    deleted = true;
                }
                catch (unlinkError) {
                    console.warn(`fs.unlink attempt ${attempt} failed:`, unlinkError);
                }
            }
            // Método 2: Comando de Windows si fs.unlink falló
            if (!deleted) {
                try {
                    const normalizedPath = originalPath.replace(/\//g, '\\');
                    await execAsync(`del /f /q "${normalizedPath}"`);
                    console.log(`Successfully deleted original file with Windows command: ${originalPath}`);
                    deleted = true;
                }
                catch (cmdError) {
                    console.error('Windows del command failed:', cmdError);
                }
            }
            // Método 3: Verificar si el archivo aún existe
            if (!deleted) {
                try {
                    await promises_1.default.access(originalPath);
                    console.error(`CRITICAL: Original file still exists after all deletion attempts: ${originalPath}`);
                }
                catch (error) {
                    // Si fs.access falla, significa que el archivo no existe (fue eliminado)
                    console.log(`Original file was actually deleted (fs.access failed as expected): ${originalPath}`);
                    deleted = true;
                }
            }
            finalFilename = webpFilename;
        }
        else {
            console.log(`File is already WebP, no conversion needed: ${file.filename}`);
            finalFilename = file.filename;
        }
        const finalUrl = `/uploads/${finalFilename}`;
        console.log(`Image processing completed. Final URL: ${finalUrl}`);
        return finalUrl;
    }
    catch (error) {
        console.error('Error in image processing:', error);
        throw new Error('Failed to process image');
    }
};
exports.postController = {
    // Get all posts (for admin or public depending on query)
    getPosts: async (req, res) => {
        try {
            const { status } = req.query;
            const query = status ? { status } : {};
            const posts = await post_model_1.PostModel.find(query).sort({ 'layout.y': 1, 'layout.x': 1 });
            res.status(200).json({
                success: true,
                posts,
                message: 'Posts retrieved successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving posts',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },
    // Create new post
    createPost: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Image file is required'
                });
            }
            const imageUrl = await processImage(req.file);
            // Parse layout if it's a string, or use default
            let layout = { x: 0, y: 0, w: 1, h: 1 };
            if (req.body.layout) {
                try {
                    layout = typeof req.body.layout === 'string'
                        ? JSON.parse(req.body.layout)
                        : req.body.layout;
                }
                catch (e) {
                    console.warn('Error parsing layout JSON, using default:', e);
                }
            }
            const postData = {
                title: req.body.title,
                details: req.body.details,
                status: req.body.status || 'active',
                imageUrl,
                layout
            };
            const newPost = new post_model_1.PostModel(postData);
            await newPost.save();
            res.status(201).json({
                success: true,
                post: newPost,
                message: 'Post created successfully'
            });
        }
        catch (error) {
            console.error('Error creating post:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating post',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },
    // Update post
    updatePost: async (req, res) => {
        try {
            const { id } = req.params;
            let updateData = { ...req.body };
            // Clean up updateData to avoid overwriting with raw string if parsing fails
            if (updateData.layout) {
                try {
                    updateData.layout = typeof updateData.layout === 'string'
                        ? JSON.parse(updateData.layout)
                        : updateData.layout;
                }
                catch (e) {
                    delete updateData.layout; // Don't update layout if invalid
                }
            }
            if (req.file) {
                const oldPost = await post_model_1.PostModel.findById(id);
                if (oldPost?.imageUrl) {
                    const normalizedOldImageUrl = oldPost.imageUrl.startsWith('/')
                        ? oldPost.imageUrl.slice(1)
                        : oldPost.imageUrl;
                    const oldImagePath = path_1.default.join(__dirname, '../../', normalizedOldImageUrl);
                    try {
                        await promises_1.default.unlink(oldImagePath);
                    }
                    catch (unlinkError) {
                        console.warn('Warning: Could not delete old image file:', unlinkError);
                    }
                }
                updateData.imageUrl = await processImage(req.file);
            }
            const updatedPost = await post_model_1.PostModel.findByIdAndUpdate(id, updateData, { new: true });
            if (!updatedPost) {
                return res.status(404).json({
                    success: false,
                    message: 'Post not found'
                });
            }
            res.status(200).json({
                success: true,
                post: updatedPost,
                message: 'Post updated successfully'
            });
        }
        catch (error) {
            console.error('Error updating post:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating post',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },
    // Update layout (batch update for drag and drop)
    updateLayouts: async (req, res) => {
        try {
            const { layouts } = req.body; // Array of { id, layout }
            if (!Array.isArray(layouts)) {
                return res.status(400).json({ success: false, message: 'Invalid layout data' });
            }
            const updates = layouts.map(item => {
                return post_model_1.PostModel.findByIdAndUpdate(item.id, { layout: item.layout });
            });
            await Promise.all(updates);
            res.status(200).json({
                success: true,
                message: 'Layouts updated successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating layouts',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },
    // Delete post
    deletePost: async (req, res) => {
        try {
            const { id } = req.params;
            const post = await post_model_1.PostModel.findById(id);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Post not found'
                });
            }
            if (post.imageUrl) {
                const normalizedImageUrl = post.imageUrl.startsWith('/')
                    ? post.imageUrl.slice(1)
                    : post.imageUrl;
                const imagePath = path_1.default.join(__dirname, '../../', normalizedImageUrl);
                try {
                    await promises_1.default.unlink(imagePath);
                }
                catch (unlinkError) {
                    console.warn('Warning: Could not delete image file:', unlinkError);
                }
            }
            await post_model_1.PostModel.findByIdAndDelete(id);
            res.status(200).json({
                success: true,
                message: 'Post deleted successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error deleting post',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
