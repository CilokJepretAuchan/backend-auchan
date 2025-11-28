import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as transactionService from '../services/transaction.service';
import { createTransactionSchema, listTransactionsSchema, updateTransactionSchema } from '../utils/validation/transaction.shema';
import { ZodError } from 'zod';

/**
 * Handles the creation of a new transaction.
 * It validates multipart/form-data input, passes data to the service layer,
 * and returns the newly created transaction.
 */
export const create = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId!;
        console.log(req.body);

        const validatedData = createTransactionSchema.parse(req.body);

        let files: Express.Multer.File[] = [];
        if (req.files) {
            files = (req.files as Express.Multer.File[]) || [];
        }

        const result = await transactionService.createTransaction(userId, validatedData, files);

        return res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            data: result
        });
    } catch (error: any) {
        if (error instanceof ZodError) return res.status(400).json({ success: false, errors: error.flatten().fieldErrors });
        return res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * Handles listing transactions for an organization with pagination.
 */
export const list = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        console.log(req.query);
        // Validate query parameters for pagination and organization ID.
        const validatedQuery = listTransactionsSchema.parse(req.query);

        const result = await transactionService.getTransactions(userId, validatedQuery);

        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        if (error instanceof ZodError) {
            return res.status(400).json({ success: false, errors: error.flatten().fieldErrors });
        }
        return res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * Handles the verification of a single transaction's integrity.
 */
export const verify = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, error: 'Transaction ID is required.' });
        }

        const result = await transactionService.verifyTransactionIntegrity(id);

        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * Get Detail Transaction by ID
 */
export const getDetail = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const result = await transactionService.getTransactionById(id, userId as string);

        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        return res.status(404).json({ success: false, error: error.message });
    }
};

/**
 * Update Transaction
 */
export const update = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { organizationId } = req.query; // Wajib dikirim frontend/client
        const userId = req.user?.userId!;

        if (!organizationId) throw new Error("Organization ID is required");

        const validatedData = updateTransactionSchema.parse(req.body);

        const result = await transactionService.updateTransaction(id, organizationId as string, validatedData);

        return res.status(200).json({ success: true, message: 'Transaction updated', data: result });
    } catch (error: any) {
        if (error instanceof ZodError) return res.status(400).json({ success: false, errors: error.flatten().fieldErrors });
        return res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * Delete Transaction
 */
export const remove = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { organizationId } = req.query;

        if (!organizationId) throw new Error("Organization ID is required");

        await transactionService.deleteTransaction(id, organizationId as string);

        return res.status(200).json({ success: true, message: 'Transaction deleted' });
    } catch (error: any) {
        return res.status(400).json({ success: false, error: error.message });
    }
};