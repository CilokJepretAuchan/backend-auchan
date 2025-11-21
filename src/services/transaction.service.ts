import { prisma } from '../prisma/client';
import { generateDataHash } from '../utils/hash';

// Input Transaksi
export const createTransaction = async (userId: string, data: any) => {
    const { orgId, projectId, categoryId, amount, type, description, date } = data;

    // 1. Siapkan Payload Data untuk di-Hash
    const transactionPayload = {
        orgId,
        amount,
        type, // INCOME / EXPENSE
        date: new Date(date).toISOString(),
        description
    };

    // 2. Generate Hash (Simulasi Blockchain Node)
    const dataHash = generateDataHash(transactionPayload);

    // 3. Simpan ke Database
    const transaction = await prisma.transaction.create({
        data: {
            userId, // Dari token JWT
            orgId,  
            projectId: projectId || undefined,
            categoryId: categoryId || undefined,
            amount: amount,
            type: type,
            description,
            transactionDate: new Date(date),

            // Blockchain prep
            blockchainHash: dataHash,
            status: 'Pending', // Nanti diupdate jadi 'Verified' setelah AI check
        }
    });

    return transaction;
};

// Get All Transactions (Dashboard)
export const getTransactions = async (orgId: string) => {
    return await prisma.transaction.findMany({
        where: { orgId },
        include: {
            user: { select: { name: true } }, // Siapa yang input
            category: { select: { categoryName: true } }
        },
        orderBy: { transactionDate: 'desc' }
    });
};