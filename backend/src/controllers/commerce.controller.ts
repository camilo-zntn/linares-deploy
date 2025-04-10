import { Request, Response } from 'express';
import { CommerceModel } from '../models/commerce.model';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs/promises';

const processImage = async (file: Express.Multer.File): Promise<string> => {
  let finalFilename: string;
  
  try {
    if (!file.mimetype.includes('webp')) {
      const webpFilename = `${file.filename.split('.')[0]}.webp`;
      const webpPath = path.join(__dirname, '../../uploads', webpFilename);
      const originalPath = file.path;

      // Ensure Sharp has finished processing before attempting to delete
      await sharp(originalPath)
        .webp({ quality: 80 })
        .toFile(webpPath);

      try {
        // Add a small delay before attempting to delete the file
        await new Promise(resolve => setTimeout(resolve, 100));
        await fs.unlink(originalPath);
      } catch (unlinkError) {
        console.warn('Warning: Could not delete original file:', unlinkError);
        // Continue execution even if delete fails
      }

      finalFilename = webpFilename;
    } else {
      finalFilename = file.filename;
    }

    return `/uploads/${finalFilename}`;
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
        imageUrl,
        category: req.body.category  // Add this line
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
          // Obtener la ruta absoluta del archivo
          const oldImagePath = path.join(__dirname, '../..', oldCommerce.imageUrl);
          try {
            // Intentar eliminar el archivo anterior
            await fs.unlink(oldImagePath);
          } catch (unlinkError) {
            console.warn('Warning: Could not delete old image file:', unlinkError);
            // Continuar con la ejecución incluso si falla la eliminación
          }
        }
        
        // Procesar y guardar la nueva imagen
        updateData.imageUrl = await processImage(req.file);
      }

      if (typeof updateData.schedule === 'string') {
        updateData.schedule = JSON.parse(updateData.schedule);
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
      const deletedCommerce = await CommerceModel.findByIdAndDelete(id);

      if (!deletedCommerce) {
        return res.status(404).json({
          success: false,
          message: 'Commerce not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Commerce deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting commerce',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};