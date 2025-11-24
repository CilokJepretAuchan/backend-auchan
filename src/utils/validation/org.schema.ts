import { z } from 'zod';

// --- Organization Schemas ---
export const createOrgSchema = z.object({
    name: z.string().min(3, "Nama organisasi minimal 3 karakter"),
    type: z.string().optional(),
    description: z.string().optional(),
});

export const updateOrgSchema = z.object({
    name: z.string().min(3).optional(),
    type: z.string().optional(),
    description: z.string().optional(),
});

// --- Member Schemas ---
export const addMemberSchema = z.object({
    email: z.email("Format email tidak valid"), // Kita add by email
    roleId: z.string().min(1, "Role ID harus diisi"),
});

export const updateMemberRoleSchema = z.object({
    roleId: z.string().min(1, "Role ID baru harus diisi"),
});

// --- Division Schemas ---
export const createDivisionSchema = z.object({
    name: z.string().min(2, "Nama divisi minimal 2 karakter"),
    description: z.string().optional(),
});

// --- Project Schemas ---
export const createProjectSchema = z.object({
    name: z.string().min(3, "Nama project minimal 3 karakter"),
    description: z.string().optional(),
    budget: z.number().min(0, "Budget tidak boleh minus"),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    divisionId: z.string().optional(), // Project bisa di bawah divisi tertentu
});

export const updateProjectSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    budget: z.number().optional(),
    status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).optional(),
});