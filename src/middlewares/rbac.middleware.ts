import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { prisma } from '../prisma/client';

/**
 * Middleware to authorize a user based on their role within an organization.
 * It checks if a user is a member of the organization and has one of the allowed roles.
 *
 * @param allowedRoles An array of role names that are allowed to access the route.
 */
export const authorize = (allowedRoles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated.' });
            }

            // Flexibly retrieve Organization ID from params, query, or body
            let orgId = req.params.orgId || (req.query.orgId as string) || req.body.orgId;
            // If orgId is not in the request, try to get it from the user's membership
            if (!orgId) {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        members: {
                            take: 1,
                            select: { orgId: true }
                        }
                    }
                });

                if (user && user.members && user.members.length > 0) {
                    orgId = user.members[0].orgId;
                }
            }

            if (!orgId) {
                return res.status(400).json({ success: false, message: 'Bad Request: Organization ID not provided.' });
            }

            const membership = await prisma.organizationMember.findUnique({
                where: {
                    userId_orgId: {
                        userId,
                        orgId,
                    },
                },
                include: {
                    role: true,
                },
            });

            if (!membership) {
                return res.status(403).json({ success: false, message: 'Forbidden: You are not a member of this organization.' });
            }

            if (!allowedRoles.includes(membership.role.name)) {
                return res.status(403).json({
                    success: false,
                    message: `Forbidden: You do not have the required permission. Requires one of the following roles: ${allowedRoles.join(', ')}.`,
                });
            }

            // Optionally, attach membership to the request for downstream use
            // (req as any).membership = membership;

            next();
        } catch (error: any) {
            res.status(500).json({ success: false, message: 'Internal Server Error during authorization.', error: error.message });
        }
    };
};