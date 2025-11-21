import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import { AuthRequest } from "./auth.middleware";

export const rbac = (allowedRoles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ message: 'Unauthorized' });

            // Cek Role user di database
            // Untuk sistem yang lebih kompleks, mungkin perlu filter by orgId juga
            const member = await prisma.organizationMember.findFirst({
                where: { userId: userId },
                include: { role: true }
            });

            if (!member || !member.role) {
                return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki role.' });
            }

            if (!allowedRoles.includes(member.role.name)) {
                return res.status(403).json({
                    message: `Akses ditolak. Halaman ini khusus ${allowedRoles.join(', ')}`
                });
            }

            next();
        } catch (error) {
            res.status(500).json({ message: 'Internal Server Error saat cek role' });
        }
    };
};
