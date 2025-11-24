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