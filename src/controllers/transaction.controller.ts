import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as transactionService from '../services/transaction.service';
import { transactionSchema } from '../utils/validation/transaction.shema';

export const create = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new Error('User not found');

        // Karena multipart/form-data, angka dikirim sebagai string, perlu konversi manual
        // atau biarkan Zod yang melakukan koersi (z.coerce.number)
        // Untuk saat ini kita parse manual sedikit agar aman
        const rawBody = {
            ...req.body,
            amount: Number(req.body.amount)
        };

        // Validasi Zod
        const validatedData = transactionSchema.parse(rawBody);

        // Ambil files dari Multer
        const files = (req.files as Express.Multer.File[]) || [];

        // Ensure transactionDate is a string to satisfy TransactionInput
        const input = {
            ...validatedData,
            transactionDate: validatedData.transactionDate instanceof Date
                ? validatedData.transactionDate.toISOString()
                : String(validatedData.transactionDate)
        };

        const result = await transactionService.createTransaction(userId, input, files);
        res.status(201).json({ message: 'Transaksi berhasil dicatat & diamankan', data: result });
    } catch (error: any) {
        if (error.errors) return res.status(400).json({ errors: error.errors });
        res.status(400).json({ error: error.message });
    }
};

export const list = async (req: AuthRequest, res: Response) => {
    try {
        const { orgId } = req.query;
        if (!orgId) throw new Error('Organization ID is required');

        const result = await transactionService.getTransactions(orgId as string);
        res.status(200).json({ data: result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};