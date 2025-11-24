import { prisma } from '../prisma/client';
import { generateDataHash, generateFileHash } from '../utils/hash';

interface TransactionInput {
    orgId: string;
    projectId?: string;
    categoryId?: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    description: string;
    transactionDate: string;
}

export const createTransaction = async (
    userId: string,
    data: TransactionInput,
    files: Express.Multer.File[]
) => {
    const { orgId, projectId, categoryId, amount, type, description, transactionDate } = data;

    // Proses Files (Hitung Hash untuk setiap file)
    const attachmentsData = await Promise.all(files.map(async (file) => {
        const fileHash = await generateFileHash(file.path);
        return {
            fileName: file.originalname,
            fileUrl: file.path, // Nanti diganti URL S3/Supabase di Production
            fileSha256: fileHash,
        };
    }));

    // Siapkan Data Payload untuk "Blockchain Hash"
    // Hash ini mengunci integritas: Siapa, Berapa, Kapan, dan Buktinya apa.
    const integrityPayload = {
        userId,
        orgId,
        amount: Number(amount), // Pastikan number
        type,
        date: new Date(transactionDate).toISOString(),
        attachments: attachmentsData.map(a => a.fileSha256) // Hash file masuk ke hash transaksi
    };

    const blockchainHash = generateDataHash(integrityPayload);

    // Simpan ke Database (Transaction + Attachments)
    const result = await prisma.transaction.create({
        data: {
            userId,
            orgId,
            projectId: projectId || null,
            categoryId: categoryId || null,
            amount: Number(amount),
            type,
            description,
            transactionDate: new Date(transactionDate),
            status: 'Pending', // Default Pending

            blockchainHash, // <--- Hash Integritas disimpan

            attachments: {
                create: attachmentsData
            }
        },
        include: {
            attachments: true
        }
    });

    return result;
};

export const getTransactions = async (orgId: string) => {
    return await prisma.transaction.findMany({
        where: { orgId },
        include: {
            user: { select: { name: true } },
            category: { select: { categoryName: true } },
            project: { select: { projectName: true } },
            attachments: true
        },
        orderBy: { transactionDate: 'desc' }
    });
};