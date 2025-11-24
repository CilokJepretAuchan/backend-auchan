import z from "zod";

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