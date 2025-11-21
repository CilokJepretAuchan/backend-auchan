import { z } from 'zod';

// Skema Register (Smart Register)
export const registerSchema = z.object({
    name: z.string().min(3, "Nama minimal 3 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),

    // Optional fields (Salah satu harus ada nanti divalidasi di logic service, tapi di sini kita allow optional)
    orgName: z.string().optional(),
    orgDesc: z.string().optional(),
    orgCode: z.string().optional(),
}).refine(data => data.orgName || data.orgCode, {
    message: "Harus menyertakan Nama Organisasi (Buat Baru) atau Kode (Join)",
    path: ["orgName"], // Error akan muncul di field orgName
});

// Skema Login
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// Skema Transaksi
export const transactionSchema = z.object({
    orgId: z.string().uuid(),
    amount: z.number().positive("Nominal harus positif"),
    type: z.enum(["INCOME", "EXPENSE"]),
    description: z.string().min(5),
    transactionDate: z.date(), // Format ISO String
    projectId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
});