import { prisma } from '../prisma/client';
import { generateDataHash, generateFileHash } from '../utils/hash';
import * as storageService from './storage.service';
import * as blockchainService from './blockchain.service';
import { createTransactionSchema, listTransactionsSchema, updateTransactionSchema } from '../utils/validation/transaction.schema';
import { z } from 'zod';

// Type definition for the input data when creating a transaction.
type TransactionInput = z.infer<typeof createTransactionSchema>;
type UpdateInput = z.infer<typeof updateTransactionSchema>;
type ListInput = z.infer<typeof listTransactionsSchema>;

/**
 * UC-01: Creates a new transaction, uploads its attachments, and records its integrity hash on the blockchain.
 * This function orchestrates the entire flow for creating a secure, auditable financial record.
 *
 * @param userId The ID of the user creating the transaction.
 * @param data The validated transaction data.
 * @param files An array of file objects (e.g., receipts) to be attached.
 * @returns The newly created transaction record from the database.
 */
export const createTransaction = async (
    userId: string,
    data: TransactionInput,
    files: Express.Multer.File[]
) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            members: {
                take: 1, // Ambil organisasi pertama (asumsi single-org context per login)
                select: { orgId: true }
            }
        }
    });

    if (!user || !user.members || user.members.length === 0) {
        throw new Error("User tidak terhubung dengan Organization manapun.");
    }

    // Ambil Organization ID dari membership user
    const orgId = user.members[0].orgId;
    // 1. Upload files to secure storage and compute their hashes.
    let attachmentsData: { fileName: string; fileUrl: string; fileSha256: string; }[] = [];
    if (files.length > 0) {
        attachmentsData = await Promise.all(
            files.map(async (file) => {
                const fileHash = await generateFileHash(file.buffer); // Use buffer for hashing
                const { publicUrl, path } = await storageService.uploadFile(file);
                return {
                    fileName: file.originalname,
                    fileUrl: publicUrl,
                    fileSha256: fileHash,
                };
            })
        );
    }

    // 2. Construct the integrity payload. This object contains all critical data
    // that will be hashed to ensure it cannot be tampered with.
    const integrityPayload = {
        userId,
        orgId,
        amount: data.amount,
        type: data.type,
        date: data.transactionDate.toISOString(),
        attachments: attachmentsData.map(a => a.fileSha256).sort(),
    };
    const blockchainHash = generateDataHash(integrityPayload);

    // 3. Create the database record within a Prisma transaction.
    // This ensures that the transaction and its associated blockchain record are created atomically.
    const projectIdToSave = data.projectId || null;
    const categoryIdToSave = data.categoryId || null;
    const newTransaction = await prisma.transaction.create({
        data: {
            // Transaction details
            userId,
            orgId,
            projectId: projectIdToSave,
            categoryId: categoryIdToSave,
            amount: data.amount,
            type: data.type,
            description: data.description,
            transactionDate: data.transactionDate,
            status: 'Pending', // Status is pending until blockchain confirmation

            // Integrity and attachment data
            blockchainHash,
            attachments: {
                create: attachmentsData,
            },
            // Create a pending blockchain record
            blockchainRecord: {
                create: {
                    blockchainHash,
                    status: 'PENDING',
                },
            },
        },
        include: {
            attachments: true,
            blockchainRecord: true,
        },
    });

    // 4. Asynchronously send the hash to the blockchain.
    // This is done after the initial response to avoid blocking the API.
    // A more robust solution would use a message queue (e.g., RabbitMQ, Redis Pub/Sub).
    (async () => {
        try {
            const receipt = await blockchainService.storeHashOnChain(blockchainHash);
            await prisma.blockchainRecord.update({
                where: { id: newTransaction.blockchainRecord!.id },
                data: {
                    onchainTxId: receipt.onchainTxId,
                    blockHash: receipt.blockHash,
                    status: 'CONFIRMED',
                    confirmedAt: new Date(),
                },
            });
            console.log(`[TransactionService] Blockchain record ${newTransaction.id} confirmed on-chain.`);
        } catch (error) {
            console.error(`[TransactionService] Failed to store hash on-chain for tx ${newTransaction.id}:`, error);
            await prisma.blockchainRecord.update({
                where: { id: newTransaction.blockchainRecord!.id },
                data: { status: 'FAILED' },
            });
        }
    })();

    return newTransaction;
};

/**
 * Mengambil satu transaksi detail berdasarkan ID.
 */
export const getTransactionById = async (transactionId: string, userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            members: {
                take: 1, // Ambil organisasi pertama (asumsi single-org context per login)
                select: { orgId: true }
            }
        }
    });

    if (!user || !user.members || user.members.length === 0) {
        throw new Error("User tidak terhubung dengan Organization manapun.");
    }

    // Ambil Organization ID dari membership user
    const orgId = user.members[0].orgId;
    const transaction = await prisma.transaction.findFirst({
        where: { id: transactionId, orgId },
        include: {
            user: { select: { name: true, email: true } },
            category: { select: { categoryName: true } },
            project: {
                include: {
                    division: { select: { name: true } }
                }
            },
            attachments: true,
            blockchainRecord: true,
        },
    });

    if (!transaction) throw new Error('Transaction not found');
    return transaction;
};

/**
 * Retrieves a paginated list of transactions for a given organization.
 *
 * @param query The validated query parameters, including orgId and pagination.
 * @returns A list of transactions with their related data.
 */
export const getTransactions = async (userId: string, query: ListInput) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            members: {
                take: 1, // Ambil organisasi pertama (asumsi single-org context per login)
                select: { orgId: true }
            }
        }
    });

    if (!user || !user.members || user.members.length === 0) {
        throw new Error("User tidak terhubung dengan Organization manapun.");
    }

    // Ambil Organization ID dari membership user
    const orgId = user.members[0].orgId;
    const { projectId, type, startDate, endDate, page, limit } = query;

    const whereClause: any = {
        orgId,
        ...(type && { type }),
        ...(projectId && { projectId }),
        ...(startDate && endDate && {
            transactionDate: {
                gte: startDate,
                lte: endDate,
            },
        }),
    };

    const [total, data] = await Promise.all([
        prisma.transaction.count({ where: whereClause }),
        prisma.transaction.findMany({
            where: whereClause,
            include: {
                user: { select: { name: true } },
                category: { select: { categoryName: true } },
                project: { select: { projectName: true } },
                attachments: { select: { fileName: true, fileUrl: true } },
            },
            orderBy: { transactionDate: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
    ]);

    return {
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
        data,
    };
};

/**
 * Update transaksi. 
 * PERINGATAN: Mengubah Amount/Date akan merusak integritas hash blockchain lama.
 * Logika di sini akan membuat hash baru jika data kritikal berubah.
 */
export const updateTransaction = async (
    transactionId: string,
    userId: string,
    data: UpdateInput
) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            members: {
                take: 1, // Ambil organisasi pertama (asumsi single-org context per login)
                select: { orgId: true }
            }
        }
    });

    if (!user || !user.members || user.members.length === 0) {
        throw new Error("User tidak terhubung dengan Organization manapun.");
    }

    // Ambil Organization ID dari membership user
    const orgId = user.members[0].orgId;

    const existing = await prisma.transaction.findFirst({
        where: { id: transactionId, orgId },
        include: { attachments: true }
    });

    if (!existing) throw new Error('Transaction not found');
    if (String(existing.status).toLowerCase() === 'approved') throw new Error('Cannot update approved transactions');

    let newBlockchainHash = existing.blockchainHash;
    const isCriticalChange = (data.amount && data.amount !== existing.amount.toNumber()) ||
        (data.type && data.type !== existing.type) ||
        (data.transactionDate);

    if (isCriticalChange) {
        const integrityPayload = {
            userId: existing.userId,
            orgId: existing.orgId,
            amount: data.amount ?? existing.amount.toNumber(),
            type: data.type ?? existing.type,
            date: (data.transactionDate ?? existing.transactionDate).toISOString(),
            attachments: existing.attachments.map(a => a.fileSha256).sort(),
        };
        newBlockchainHash = generateDataHash(integrityPayload);
    }

    // Prisma UpdateInput types don't accept `null` for optional fields; convert any nulls to undefined.
    const sanitizedData: any = { ...data };
    if (sanitizedData.projectId === null) sanitizedData.projectId = undefined;
    if (sanitizedData.categoryId === null) sanitizedData.categoryId = undefined;

    const updated = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
            ...sanitizedData,
            blockchainHash: newBlockchainHash,
            // Jika hash berubah, status blockchain record harus di-reset atau dibuat baru
            // Simplifikasi: Kita biarkan record lama tapi tandai 'MODIFIED' di description atau audit log
        }
    });

    return updated;
};

/**
 * Menghapus transaksi (Hard Delete).
 * Biasanya financial app menggunakan Soft Delete (status: VOID), tapi ini sesuai request.
 */
export const deleteTransaction = async (transactionId: string, userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            members: {
                take: 1, // Ambil organisasi pertama (asumsi single-org context per login)
                select: { orgId: true }
            }
        }
    });

    if (!user || !user.members || user.members.length === 0) {
        throw new Error("User tidak terhubung dengan Organization manapun.");
    }

    // Ambil Organization ID dari membership user
    const orgId = user.members[0].orgId;

    const existing = await prisma.transaction.findFirst({
        where: { id: transactionId, orgId }
    });

    if (!existing) throw new Error('Transaction not found');

    // Hapus relasi terkait jika cascade delete tidak di-set di DB
    // Prisma transaction:
    return await prisma.$transaction([
        prisma.attachment.deleteMany({ where: { transactionId } }),
        prisma.blockchainRecord.deleteMany({ where: { transactionId } }),
        prisma.transaction.delete({ where: { id: transactionId } })
    ]);
};

/**
 * UC-04: Verifies the integrity of a single transaction against the blockchain.
 *
 * @param transactionId The ID of the transaction to verify.
 * @returns An object detailing the verification result.
 */
export const verifyTransactionIntegrity = async (transactionId: string) => {
    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { attachments: true, blockchainRecord: true },
    });

    if (!transaction) {
        throw new Error('Transaction not found.');
    }
    if (!transaction.blockchainRecord || !transaction.blockchainRecord.onchainTxId) {
        return {
            isVerifiable: false,
            status: transaction.blockchainRecord?.status || 'UNKNOWN',
            message: 'Transaction has not been confirmed on the blockchain yet.',
        };
    }

    // 1. Re-compute the hash from data stored in our database.
    const integrityPayload = {
        userId: transaction.userId,
        orgId: transaction.orgId,
        amount: transaction.amount.toNumber(),
        type: transaction.type,
        date: transaction.transactionDate.toISOString(),
        attachments: transaction.attachments.map(a => a.fileSha256).sort(),
    };
    const recomputedDbHash = generateDataHash(integrityPayload);

    // 2. Compare the re-computed hash with the one stored during creation.
    const isHashTampered = recomputedDbHash !== transaction.blockchainHash;
    if (isHashTampered) {
        return {
            isVerifiable: true,
            isIntegral: false,
            status: 'TAMPERED',
            message: 'Data integrity check failed! The hash recomputed from DB data does not match the hash stored at creation time.',
            dbHashStored: transaction.blockchainHash,
            dbHashRecomputed: recomputedDbHash,
        };
    }

    // 3. (Mock) Retrieve the original hash from the blockchain.
    const onchainHash = await blockchainService.getHashFromChain(transaction.blockchainRecord.onchainTxId);

    // NOTE: Our mock service can't retrieve the real hash, so this check will fail.
    // In a real implementation, `onchainHash` would equal `transaction.blockchainHash`.
    if (!onchainHash || onchainHash !== transaction.blockchainHash) {
        return {
            isVerifiable: true,
            isIntegral: false,
            status: 'CHAIN_MISMATCH_OR_MOCK',
            message: 'Verification against the blockchain failed. This is expected in the mock environment. In production, this would indicate a severe issue.',
            dbHashStored: transaction.blockchainHash,
            onchainHash,
        };
    }

    return {
        isVerifiable: true,
        isIntegral: true,
        status: 'VERIFIED',
        message: 'Transaction integrity successfully verified against the blockchain.',
        verifiedAt: new Date(),
    };
};