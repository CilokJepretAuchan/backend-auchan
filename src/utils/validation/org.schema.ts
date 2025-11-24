import { z } from 'zod';

// --- Organization Schemas ---
export const createOrgSchema = z.object({
    name: z.string().min(3, "Nama organisasi minimal 3 karakter"),
    description: z.string().optional(),
});

export const updateOrgSchema = z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
});

// --- Member Schemas ---
export const addMemberSchema = z.object({
    email: z.string().email("Format email tidak valid"),
    roleId: z.number().int("Role ID harus berupa angka"),
});

export const updateMemberRoleSchema = z.object({
    roleId: z.number().int("Role ID baru harus berupa angka"),
});

// --- Division Schemas ---
export const createDivisionSchema = z.object({
    name: z.string().min(2, "Nama divisi minimal 2 karakter"),
});

export const updateDivisionSchema = z.object({
    name: z.string().min(2, "Nama divisi minimal 2 karakter"),
});

// --- Project Schemas ---
export const createProjectSchema = z.object({
    projectName: z.string().min(3, "Nama project minimal 3 karakter"),
    budgetAllocated: z.number().min(0, "Budget tidak boleh minus"),
    divisionId: z.uuid(),
});

export const updateProjectSchema = z.object({
    projectName: z.string().optional(),
    budgetAllocated: z.number().optional(),
    divisionId: z.string().uuid().optional(),
});