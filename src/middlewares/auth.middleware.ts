import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Bearer <token>

        jwt.verify(token, process.env.JWT_SECRET || 'secret_key_dev', (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Token tidak valid atau kadaluarsa' });
            }
            req.user = user as any;
            next();
        });
    } else {
        res.status(401).json({ message: 'Akses ditolak. Token dibutuhkan.' });
    }
};