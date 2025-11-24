import { prisma } from '../prisma/client';
import { generateOrgCode } from '../utils/hash';

// ==========================================
// ORGANIZATION MANAGEMENT
// ==========================================

// Buat Organisasi Baru UNTUK DEVELOPMENT / TESTING
export const createOrganization = async (userId: string, data: { name: string; type?: string; description?: string }) => {
    return await prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
            data: {
                name: data.name,
                description: data.description,
                code: generateOrgCode(),
            },
        });

        // Cari Role 'SUPER_ADMIN'
        const adminRole = await tx.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
        if (!adminRole) throw new Error('System Error: Role SUPER_ADMIN not found');

        // Assign pembuat sebagai Admin
        await tx.organizationMember.create({
            data: {
                userId,
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
            organization: {
                include: {
                    _count: { select: { members: true, projects: true } } // Hitung member & project
                }
            },
            role: true,
        },
    });
};

export const getOrganizationDetails = async (orgId: string, userId: string) => {
    // Validasi: User harus member org tersebut
    const isMember = await prisma.organizationMember.findFirst({ where: { orgId, userId } });
    if (!isMember) throw new Error('Access Denied: You are not a member of this organization');

    return await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
            members: {
                include: { user: { select: { id: true, name: true, email: true } }, role: true }
            },
            divisions: true,
            projects: true,
        },
    });
};

export const updateOrganization = async (orgId: string, userId: string, data: any) => {
    await validateAdminAccess(orgId, userId);
    return await prisma.organization.update({
        where: { id: orgId },
        data,
    });
};

export const deleteOrganization = async (orgId: string, userId: string) => {
    await validateAdminAccess(orgId, userId);
    // Soft delete atau Hard delete tergantung kebijakan. Di sini Hard Delete.
    return await prisma.organization.delete({ where: { id: orgId } });
};

// ==========================================
// MEMBER MANAGEMENT
// ==========================================

export const addMember = async (orgId: string, adminId: string, email: string, roleId: string) => {
    await validateAdminAccess(orgId, adminId);

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) throw new Error('User with that email not found');

    const existingMember = await prisma.organizationMember.findFirst({
        where: { orgId, userId: userToAdd.id }
    });

    if (existingMember) throw new Error('User is already a member');

    return await prisma.organizationMember.create({
        data: { orgId, userId: userToAdd.id, roleId: Number(roleId) }
    });
};

export const removeMember = async (orgId: string, adminId: string, targetUserId: string) => {
    await validateAdminAccess(orgId, adminId);
    if (adminId === targetUserId) throw new Error('Cannot remove yourself');

    return await prisma.organizationMember.deleteMany({
        where: { orgId, userId: targetUserId }
    });
};

// ==========================================
// DIVISION MANAGEMENT
// ==========================================

export const createDivision = async (orgId: string, userId: string, data: { name: string; description?: string }) => {
    await validateAdminAccess(orgId, userId);
    return await prisma.division.create({
        data: { ...data, orgId }
    });
};

export const getDivisions = async (orgId: string) => {
    return await prisma.division.findMany({ where: { orgId } });
};

export const deleteDivision = async (orgId: string, userId: string, divisionId: string) => {
    await validateAdminAccess(orgId, userId);
    return await prisma.division.delete({ where: { id: divisionId } });
};

// ==========================================
// PROJECT MANAGEMENT
// ==========================================

export const createProject = async (orgId: string, userId: string, data: any) => {
    // Hanya Admin/Manager yang bisa buat project
    await validateAdminAccess(orgId, userId);

    return await prisma.project.create({
        data: {
            ...data,
            orgId,
            status: 'PLANNING' // Default status
        }
    });
};

export const getProjects = async (orgId: string) => {
    return await prisma.project.findMany({
        where: { orgId },
        include: { division: true }
    });
};

export const updateProject = async (orgId: string, userId: string, projectId: string, data: any) => {
    await validateAdminAccess(orgId, userId);
    return await prisma.project.update({
        where: { id: projectId },
        data
    });
};

// ==========================================
// HELPER: Permission Check
// ==========================================
const validateAdminAccess = async (orgId: string, userId: string) => {
    const member = await prisma.organizationMember.findFirst({
        where: { orgId, userId },
        include: { role: true }
    });

    if (!member) throw new Error('Not a member');

    // Asumsi role yang boleh edit adalah 'ADMIN' atau 'OWNER'
    const allowedRoles = ['ADMIN', 'OWNER', 'MANAGER'];
    if (!allowedRoles.includes(member.role.name)) {
        throw new Error('Forbidden: You do not have permission (Admin/Manager only)');
    }
};