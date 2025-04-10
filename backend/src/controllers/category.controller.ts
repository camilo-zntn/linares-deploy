import { Request, Response } from 'express';
import { CategoryModel } from '../models/category.model';

export const categoryController = {
  // Get all categories
  getCategories: async (_req: Request, res: Response) => {
    try {
      const categories = await CategoryModel.find().sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        categories,
        message: 'Categories retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving categories',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Create new category
  createCategory: async (req: Request, res: Response) => {
    try {
      const newCategory = new CategoryModel(req.body);
      await newCategory.save();

      res.status(201).json({
        success: true,
        category: newCategory,
        message: 'Category created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating category',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Update category
  updateCategory: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updatedCategory = await CategoryModel.findByIdAndUpdate(
        id,
        req.body,
        { new: true }
      );

      if (!updatedCategory) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.status(200).json({
        success: true,
        category: updatedCategory,
        message: 'Category updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating category',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Delete category
  deleteCategory: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deletedCategory = await CategoryModel.findByIdAndDelete(id);

      if (!deletedCategory) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting category',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};