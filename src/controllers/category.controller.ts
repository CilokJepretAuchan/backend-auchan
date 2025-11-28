import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as categoryService from '../services/category.service';
import { createCategorySchema, updateCategorySchema } from '../utils/validation/category.schema';
import { ZodError } from 'zod';

export const create = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId!;
        const validatedData = createCategorySchema.parse(req.body);
        const result = await categoryService.createCategory(userId, validatedData);
        return res.status(201).json({ success: true, message: 'Category created successfully', data: result });
    } catch (error: any) {
        if (error instanceof ZodError) return res.status(400).json({ success: false, errors: error.flatten().fieldErrors });
        return res.status(400).json({ success: false, error: error.message });
    }
};

export const list = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId!;
        const result = await categoryService.getCategories(userId);
        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

export const getDetail = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId!;
        const result = await categoryService.getCategoryById(id, userId);
        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        return res.status(404).json({ success: false, error: error.message });
    }
};

export const update = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId!;
        const validatedData = updateCategorySchema.parse(req.body);
        const result = await categoryService.updateCategory(id, userId, validatedData);
        return res.status(200).json({ success: true, message: 'Category updated successfully', data: result });
    } catch (error: any) {
        if (error instanceof ZodError) return res.status(400).json({ success: false, errors: error.flatten().fieldErrors });
        return res.status(400).json({ success: false, error: error.message });
    }
};

export const remove = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId!;
        await categoryService.deleteCategory(id, userId);
        return res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error: any) {
        return res.status(400).json({ success: false, error: error.message });
    }
};
