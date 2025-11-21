import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as transactionService from '../services/transaction.service';

export const create = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new Error('User not found');

        const result = await transactionService.createTransaction(userId, req.body);
        res.status(201).json({ message: 'Transaction recorded', data: result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const list = async (req: AuthRequest, res: Response) => {
    try {
        const { orgId } = req.query;
        if (!orgId) throw new Error('Organization ID is required');

        const result = await transactionService.getTransactions(orgId as string);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};