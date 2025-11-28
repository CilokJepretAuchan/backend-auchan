import { z } from 'zod';

const emptyStringToNull = (val: unknown) => (val === "" ? null : val);

/**
 * Defines the schema for creating a new transaction.
 * It uses `z.coerce` to safely convert `multipart/form-data` strings into the correct types (number, date).
 * This schema is used in the controller to validate incoming requests.
 */
export const createTransactionSchema = z.object({
    amount: z.coerce.number().positive({ message: "Amount must be a positive number." }),
    type: z.enum(['INCOME', 'EXPENSE'] as const, { message: "Type must be either INCOME or EXPENSE." }),
    description: z.string().min(3, { message: "Description must be at least 3 characters long." }),
    transactionDate: z.coerce.date(),
    projectId: z.preprocess(emptyStringToNull, z.uuid("Project ID tidak valid").nullable().optional()),
    categoryId: z.preprocess(emptyStringToNull, z.uuid("Category ID tidak valid").nullable().optional()),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED'] as const).default('PENDING').optional(),

});

export const updateTransactionSchema = z.object({
    amount: z.coerce.number().min(0.01).optional(),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    description: z.string().min(5).optional(),
    transactionDate: z.coerce.date().optional(),
    projectId: z.string().uuid().optional().nullable(),
    categoryId: z.string().uuid().optional().nullable(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
});

/**
 * Defines the schema for the query parameters when listing transactions.
 * Includes pagination support with default values.
 */
export const listTransactionsSchema = z.object({
    projectId: z.uuid().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    type: z.enum(['INCOME', 'EXPENSE'] as const).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
});