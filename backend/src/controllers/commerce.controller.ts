import { Request, Response } from 'express';
import { CommerceModel } from '../models/commerce.model';
import { UserModel } from '../models/user.model'; 
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

export const commerceController = {
  // Get all commerces
  getCommerces: async (_req: Request, res: Response) => {
    try {
      const commerces = await CommerceModel.find()
        .populate('category', 'name')  // Add this line
        .sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        commerces,
        message: 'Commerces retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving commerces',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Create new commerce
  createCommerce: async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Image file is required'
        });
      }

      const imageUrl = await processImage(req.file);

      const commerceData = {
        ...req.body,
        schedule: JSON.parse(req.body.schedule),
        contact: JSON.parse(req.body.contact), // Parsear la información de contacto
        imageUrl,
        category: req.body.category,
        googleMapsIframe: req.body.googleMapsIframe 
      };

      const newCommerce = new CommerceModel(commerceData);
      await newCommerce.save();

      res.status(201).json({
        success: true,
        commerce: newCommerce,
        message: 'Commerce created successfully'
      });
    } catch (error) {
      console.error('Error creating commerce:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating commerce',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Update commerce
  updateCommerce: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      let updateData = { ...req.body };

      if (req.file) {
        // Obtener el comercio actual para encontrar la imagen existente
        const oldCommerce = await CommerceModel.findById(id);
        if (oldCommerce?.imageUrl) {
          const normalizedOldImageUrl = oldCommerce.imageUrl.startsWith('/')
            ? oldCommerce.imageUrl.slice(1)
            : oldCommerce.imageUrl;
          const oldImagePath = path.join(__dirname, '../..', normalizedOldImageUrl);
          try {
            await fs.unlink(oldImagePath);
          } catch (unlinkError) {
            console.warn('Warning: Could not delete old image file:', unlinkError);
          }
        }
        updateData.imageUrl = await processImage(req.file);
      }

      if (typeof updateData.schedule === 'string') {
        updateData.schedule = JSON.parse(updateData.schedule);
      }

      if (typeof updateData.contact === 'string') {
        updateData.contact = JSON.parse(updateData.contact);
      }

      const updatedCommerce = await CommerceModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (!updatedCommerce) {
        return res.status(404).json({
          success: false,
          message: 'Commerce not found'
        });
      }

      res.status(200).json({
        success: true,
        commerce: updatedCommerce,
        message: 'Commerce updated successfully'
      });
    } catch (error) {
      console.error('Error updating commerce:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating commerce',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Delete commerce
  deleteCommerce: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // First find the commerce to get the image URL
      const commerce = await CommerceModel.findById(id);
  
      if (!commerce) {
        return res.status(404).json({
          success: false,
          message: 'Commerce not found'
        });
      }
  
      // Delete the image file if it exists
      if (commerce.imageUrl) {
        const normalizedImageUrl = commerce.imageUrl.startsWith('/')
          ? commerce.imageUrl.slice(1)
          : commerce.imageUrl;
        const imagePath = path.join(__dirname, '../..', normalizedImageUrl);
        try {
          await fs.unlink(imagePath);
        } catch (unlinkError) {
          console.warn('Warning: Could not delete image file:', unlinkError);
          // Continue with commerce deletion even if image deletion fails
        }
      }
  
      // Delete the commerce from database
      await CommerceModel.findByIdAndDelete(id);
  
      res.status(200).json({
        success: true,
        message: 'Commerce and associated image deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting commerce',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Add this method to the controller
  getCommerceById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const commerce = await CommerceModel.findById(id)
        .populate('category', 'name');

      if (!commerce) {
        return res.status(404).json({
          success: false,
          message: 'Commerce not found'
        });
      }

      res.status(200).json({
        success: true,
        commerce,
        message: 'Commerce retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving commerce',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  getMyCommerce: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      // Buscar el usuario para obtener el commerceId asociado
      const user = await UserModel.findById(userId);

      if (!user || !user.commerceId) {
        return res.status(404).json({
          success: false,
          message: 'No hay comercio asociado a este usuario'
        });
      }

      // Buscar el comercio usando el commerceId del usuario
      const commerce = await CommerceModel.findById(user.commerceId)
        .populate('category', 'name');

      if (!commerce) {
        return res.status(404).json({
          success: false,
          message: 'Comercio no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        commerce,
        message: 'Comercio recuperado exitosamente'
      });

    } catch (error) {
      console.error('Error al obtener el comercio:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener información del comercio',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
};