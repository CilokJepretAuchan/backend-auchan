import { z } from 'zod';

// --- Organization Schemas ---
// ERD: organization_id, name, description
export const createOrgSchema = z.object({
    name: z.string().min(3, "Nama organisasi minimal 3 karakter"),
    description: z.string().optional(),
});

export const updateOrgSchema = z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
});

// --- Member Schemas ---
// ERD: organization_members (user_id, organization_id, role_id)
export const addMemberSchema = z.object({
    email: z.email("Format email tidak valid"),
    roleId: z.number().int("Role ID harus berupa angka"), // role_id is Serial (Int)
});

export const updateMemberRoleSchema = z.object({
    roleId: z.number().int("Role ID baru harus berupa angka"),
});

// --- Division Schemas ---
// ERD: division_id, organization_id, name
export const createDivisionSchema = z.object({
    name: z.string().min(2, "Nama divisi minimal 2 karakter"),
});

// --- Project Schemas ---
// ERD: project_name, budget_allocated
export const createProjectSchema = z.object({
    projectName: z.string().min(3, "Nama project minimal 3 karakter"),
    budgetAllocated: z.number().min(0, "Budget tidak boleh minus"),
    divisionId: z.string().uuid().optional(), // Opsional sesuai ERD relation
});

export const updateProjectSchema = z.object({
    projectName: z.string().optional(),
    budgetAllocated: z.number().optional(),
    divisionId: z.string().uuid().optional(),
});