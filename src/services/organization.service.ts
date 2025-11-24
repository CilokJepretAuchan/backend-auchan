import { prisma } from '../prisma/client';
import { generateOrgCode } from '../utils/hash';

// ==========================================
// ORGANIZATION MANAGEMENT
// ==========================================

export const createOrganization = async (userId: string, data: { name: string; description?: string }) => {
    return await prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
            data: {
                name: data.name,
                description: data.description,
                code: generateOrgCode(),
            },
        });

        const adminRole = await tx.role.findFirst({ where: { name: 'ADMIN' } });
        if (!adminRole) throw new Error('System Error: Role ADMIN not found');

        await tx.organizationMember.create({
            data: {
                userId: userId,
                orgId: org.id,
                roleId: adminRole.id,
            },
        });

        return org;
    });
};

export const getUserOrganizations = async (userId: string) => {
    return await prisma.organizationMember.findMany({
        where: { userId },
        include: {
            organization: true,
            role: true,
        },
    });
};

export const getOrganizationDetails = async (orgId: string, userId: string) => {
    const isMember = await prisma.organizationMember.findUnique({
        where: { userId_orgId: { orgId, userId } }
    });
    if (!isMember) throw new Error('Access Denied: You are not a member of this organization');

    return await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
            divisions: true,
            projects: true,
            members: {
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    role: true
                }
            },
        },
    });
};

export const updateOrganization = async (orgId: string, userId: string, data: { name?: string; description?: string }) => {
    await validateAdminAccess(orgId, userId);
    return await prisma.organization.update({
        where: { id: orgId },
        data
    });
};

// ==========================================
// MEMBER MANAGEMENT
// ==========================================

export const addMember = async (orgId: string, adminId: string, email: string, roleId: number) => {
    await validateAdminAccess(orgId, adminId);

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) throw new Error('User with that email not found');

    const existingMember = await prisma.organizationMember.findUnique({
        where: { userId_orgId: { orgId, userId: userToAdd.id } }
    });

    if (existingMember) throw new Error('User is already a member');

    return await prisma.organizationMember.create({
        data: {
            orgId: orgId,
            userId: userToAdd.id,
            roleId: roleId
        }
    });
};

export const removeMember = async (orgId: string, adminId: string, targetUserId: string) => {
    await validateAdminAccess(orgId, adminId);

    if (adminId === targetUserId) throw new Error('Cannot remove yourself');

    return await prisma.organizationMember.delete({
        where: {
            userId_orgId: {
                orgId: orgId,
                userId: targetUserId
            }
        }
    });
};

export const updateMemberRole = async (orgId: string, adminId: string, targetUserId: string, newRoleId: number) => {
    await validateAdminAccess(orgId, adminId);

    if (adminId === targetUserId) throw new Error('Cannot change your own role. Ask another admin.');

    const result = await prisma.organizationMember.update({
        where: {
            userId_orgId: {
                orgId: orgId,
                userId: targetUserId
            }
        },
        data: { roleId: newRoleId }
    });

    if (!result) throw new Error('Member not found in this organization');
    return result;
};

// ==========================================
// DIVISION MANAGEMENT
// ==========================================

export const createDivision = async (orgId: string, userId: string, name: string) => {
    await validateAdminAccess(orgId, userId);

    return await prisma.division.create({
        data: { name, orgId: orgId }
    });
};

export const getDivisions = async (orgId: string) => {
    return await prisma.division.findMany({ where: { orgId: orgId } });
};

export const getDivisionDetail = async (orgId: string, divisionId: string) => {
    // Pastikan divisi milik org tersebut
    const division = await prisma.division.findFirst({
        where: { id: divisionId, orgId: orgId }
    });
    if (!division) throw new Error('Division not found');
    return division;
};

export const updateDivision = async (orgId: string, userId: string, divisionId: string, name: string) => {
    await validateAdminAccess(orgId, userId);

    // Cek existensi
    const existing = await prisma.division.findFirst({ where: { id: divisionId, orgId: orgId } });
    if (!existing) throw new Error('Division not found');

    return await prisma.division.update({
        where: { id: divisionId },
        data: { name }
    });
};

export const deleteDivision = async (orgId: string, userId: string, divisionId: string) => {
    await validateAdminAccess(orgId, userId);

    const existing = await prisma.division.findFirst({ where: { id: divisionId, orgId: orgId } });
    if (!existing) throw new Error('Division not found');

    return await prisma.division.delete({ where: { id: divisionId } });
};

// ==========================================
// PROJECT MANAGEMENT
// ==========================================

export const createProject = async (orgId: string, userId: string, data: { projectName: string, budgetAllocated?: number, divisionId: string }) => {
    await validateAdminAccess(orgId, userId);

    if (data.divisionId) {
        const division = await prisma.division.findFirst({
            where: { id: data.divisionId, orgId: orgId }
        });
        if (!division) throw new Error('Division not found in this organization');
    }

    return await prisma.project.create({
        data: {
            orgId: orgId,
            divisionId: data.divisionId,
            projectName: data.projectName,
            budgetAllocated: data.budgetAllocated,
        }
    });
};

export const getProjects = async (orgId: string) => {
    return await prisma.project.findMany({
        where: { orgId: orgId },
        include: { division: true }
    });
};

export const getProjectsByDivision = async (orgId: string, divisionId: string) => {
    return await prisma.project.findMany({
        where: { orgId: orgId, divisionId },
        include: { division: true }
    });
};

export const getProjectDetail = async (orgId: string, projectId: string) => {
    const project = await prisma.project.findFirst({
        where: { id: projectId, orgId: orgId },
        include: { division: true }
    });
    if (!project) throw new Error('Project not found');
    return project;
};

export const deleteProject = async (orgId: string, userId: string, projectId: string) => {
    await validateAdminAccess(orgId, userId);

    const existing = await prisma.project.findFirst({ where: { id: projectId, orgId: orgId } });
    if (!existing) throw new Error('Project not found');

    return await prisma.project.delete({ where: { id: projectId } });
};

// ==========================================
// HELPER: RBAC Check
// ==========================================
const validateAdminAccess = async (orgId: string, userId: string) => {
    const member = await prisma.organizationMember.findUnique({
        where: { userId_orgId: { orgId, userId } },
        include: { role: true }
    });

    if (!member) throw new Error('Not a member');

    const allowedRoles = ['ADMIN', 'OWNER', 'MANAGER'];
    if (!allowedRoles.includes(member.role.name)) {
        throw new Error('Forbidden: Insufficient permissions');
    }
};