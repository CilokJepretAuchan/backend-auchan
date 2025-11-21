import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import { AuthRequest } from "./auth.middleware";

export const rbac = (roles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.user!.id;
        const orgId = req.body.orgId;

        if (!orgId) return res.status(400).json({ error: "orgId is required" });

        const member = await prisma.organizationMember.findFirst({
            where: { userId, orgId },
            include: { role: true }
        });

        if (!member) return res.status(403).json({ error: "Not a member" });

        if (!roles.includes(member.role.name))
            return res.status(403).json({ error: "Insufficient role" });

        next();
    };
};
