"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryController = void 0;
const category_model_1 = require("../models/category.model");
const commerce_model_1 = require("../models/commerce.model");
exports.categoryController = {
    // Get all categories
    getCategories: async (_req, res) => {
        try {
            const categories = await category_model_1.CategoryModel.find().sort({ createdAt: -1 });
            res.status(200).json({
                success: true,
                categories,
                message: 'Categories retrieved successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving categories',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },
    // Create new category
    createCategory: async (req, res) => {
        try {
            const newCategory = new category_model_1.CategoryModel(req.body);
            await newCategory.save();
            res.status(201).json({
                success: true,
                category: newCategory,
                message: 'Category created successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error creating category',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },
    // Update category
    updateCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const updatedCategory = await category_model_1.CategoryModel.findByIdAndUpdate(id, req.body, { new: true });
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating category',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },
    // Delete category
    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedCategory = await category_model_1.CategoryModel.findByIdAndDelete(id);
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error deleting category',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },
    // Add this to your existing categoryController object
    getCommercesByCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const category = await category_model_1.CategoryModel.findById(id);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }
            const commerces = await commerce_model_1.CommerceModel.find({ category: id })
                .populate('category', 'name')
                .sort({ createdAt: -1 });
            res.status(200).json({
                success: true,
                category,
                commerces,
                message: 'Category commerces retrieved successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving category commerces',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
