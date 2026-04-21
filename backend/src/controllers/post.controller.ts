import { Request, Response } from 'express';
import { PostModel } from '../models/post.model';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const processImage = async (file: Express.Multer.File): Promise<string> => {
  let finalFilename: string;
  
  try {
    console.log(`Processing file: ${file.originalname}, mimetype: ${file.mimetype}, path: ${file.path}`);
    
    if (!file.mimetype.includes('webp')) {
      const webpFilename = `${file.filename.split('.')[0]}.webp`;
      const webpPath = path.join(__dirname, '../../uploads', webpFilename);
      const originalPath = file.path;

      console.log(`Converting to WebP: ${originalPath} -> ${webpPath}`);

      // Convertir a WebP
      await sharp(originalPath)
        .webp({ quality: 80 })
        .toFile(webpPath);

      console.log(`WebP conversion completed. Now attempting to delete original: ${originalPath}`);

      // Verificar que el archivo WebP se creó correctamente
      try {
        await fs.access(webpPath);
        console.log(`WebP file verified: ${webpPath}`);
      } catch (error) {
        throw new Error(`WebP file was not created successfully: ${webpPath}`);
      }

      // Intentar eliminar el archivo original
      let deleted = false;
      
      // Método 1: fs.unlink con reintentos
      for (let attempt = 1; attempt <= 3 && !deleted; attempt++) {
        try {
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
          await fs.unlink(originalPath);
          console.log(`Successfully deleted original file with fs.unlink (attempt ${attempt}): ${originalPath}`);
          deleted = true;
        } catch (unlinkError) {
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
        } catch (cmdError) {
          console.error('Windows del command failed:', cmdError);
        }
      }

      // Método 3: Verificar si el archivo aún existe
      if (!deleted) {
        try {
          await fs.access(originalPath);
          console.error(`CRITICAL: Original file still exists after all deletion attempts: ${originalPath}`);
        } catch (error) {
          // Si fs.access falla, significa que el archivo no existe (fue eliminado)
          console.log(`Original file was actually deleted (fs.access failed as expected): ${originalPath}`);
          deleted = true;
        }
      }

      finalFilename = webpFilename;
    } else {
      console.log(`File is already WebP, no conversion needed: ${file.filename}`);
      finalFilename = file.filename;
    }

    const finalUrl = `/uploads/${finalFilename}`;
    console.log(`Image processing completed. Final URL: ${finalUrl}`);
    return finalUrl;
  } catch (error) {
    console.error('Error in image processing:', error);
    throw new Error('Failed to process image');
  }
};

export const postController = {
  // Get all posts (for admin or public depending on query)
  getPosts: async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      const query = status ? { status } : {};
      
      const posts = await PostModel.find(query).sort({ 'layout.y': 1, 'layout.x': 1 });
      
      res.status(200).json({
        success: true,
        posts,
        message: 'Posts retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving posts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Create new post
  createPost: async (req: Request, res: Response) => {
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
        } catch (e) {
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

      const newPost = new PostModel(postData);
      await newPost.save();

      res.status(201).json({
        success: true,
        post: newPost,
        message: 'Post created successfully'
      });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating post',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Update post
  updatePost: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      let updateData: any = { ...req.body };

      // Clean up updateData to avoid overwriting with raw string if parsing fails
      if (updateData.layout) {
        try {
          updateData.layout = typeof updateData.layout === 'string' 
            ? JSON.parse(updateData.layout) 
            : updateData.layout;
        } catch (e) {
          delete updateData.layout; // Don't update layout if invalid
        }
      }

      if (req.file) {
        const oldPost = await PostModel.findById(id);
        if (oldPost?.imageUrl) {
          const normalizedOldImageUrl = oldPost.imageUrl.startsWith('/')
            ? oldPost.imageUrl.slice(1)
            : oldPost.imageUrl;
          const oldImagePath = path.join(__dirname, '../../', normalizedOldImageUrl);
          try {
            await fs.unlink(oldImagePath);
          } catch (unlinkError) {
            console.warn('Warning: Could not delete old image file:', unlinkError);
          }
        }
        updateData.imageUrl = await processImage(req.file);
      }

      const updatedPost = await PostModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

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
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating post',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Update layout (batch update for drag and drop)
  updateLayouts: async (req: Request, res: Response) => {
    try {
      const { layouts } = req.body; // Array of { id, layout }
      
      if (!Array.isArray(layouts)) {
        return res.status(400).json({ success: false, message: 'Invalid layout data' });
      }

      const updates = layouts.map(item => {
        return PostModel.findByIdAndUpdate(item.id, { layout: item.layout });
      });

      await Promise.all(updates);

      res.status(200).json({
        success: true,
        message: 'Layouts updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating layouts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Delete post
  deletePost: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const post = await PostModel.findById(id);
  
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
        const imagePath = path.join(__dirname, '../../', normalizedImageUrl);
        try {
          await fs.unlink(imagePath);
        } catch (unlinkError) {
          console.warn('Warning: Could not delete image file:', unlinkError);
        }
      }
  
      await PostModel.findByIdAndDelete(id);
  
      res.status(200).json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting post',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};
