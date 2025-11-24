import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { loginSchema, registerSchema } from '../utils/validation/auth.schema';
import { AuthRequest } from '../middlewares/auth.middleware';

export const register = async (req: Request, res: Response) => {
    try {
        // 1. Validasi Input
        const validatedData = registerSchema.parse(req.body);

        // 2. Panggil Service
        const result = await authService.registerUser(validatedData);

        res.status(201).json({
            message: 'Registrasi berhasil!',
            data: result
        });
    } catch (error: any) {
        // Handle error Zod (Validation Error)
        if (error.errors) {
            return res.status(400).json({ message: 'Validasi Gagal', errors: error.errors });
        }
        // Handle error logic (misal email duplikat)
        res.status(400).json({ message: error.message });
    }
};

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        // req.user didapat dari middleware authenticateJWT
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const result = await authService.getUserProfile(userId);
        res.status(200).json({ data: result });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const result = await authService.updateUserProfile(userId, req.body);
        res.status(200).json({ message: 'Profil berhasil diupdate', data: result });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const validatedData = loginSchema.parse(req.body);

        const result = await authService.loginUser(validatedData);
        res.status(200).json({
            message: 'Login berhasil',
            data: result
        });
    } catch (error: any) {
        if (error.errors) {
            return res.status(400).json({ message: 'Data tidak lengkap', errors: error.errors });
        }
        res.status(401).json({ message: error.message });
    }
};