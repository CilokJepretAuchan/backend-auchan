import { Worker } from "bullmq";
import { prisma } from "../prisma/client";
import { storeHashOnChain } from "../services/blockchain.service";
import { connection } from "../queues/queues";

new Worker(
    "blockchainQueue",
    async (job) => {
        // Data yang dikirim dari Producer (Transaction Service)
        const { transactionId, hash } = job.data;

        try {
            console.log(`[Worker] Processing blockchain job for Transaction ${transactionId}`);

            // Submit hash ke blockchain
            const receipt = await storeHashOnChain(hash);

            // Update record yang SUDAH ADA (dibuat oleh transaction service)
            await prisma.blockchainRecord.update({
                where: { transactionId: transactionId }, // Asumsi relation 1-to-1 dan transactionId unique
                data: {
                    onchainTxId: receipt.onchainTxId,
                    blockHash: receipt.blockHash,
                    status: "CONFIRMED",
                    confirmedAt: new Date()
                }
            });

            console.log(`[Worker] Transaction ${transactionId} confirmed on chain: ${receipt.onchainTxId}`);
        } catch (error) {
            console.error(`[Worker] Failed to process transaction ${transactionId}:`, error);

            // Update status menjadi FAILED jika gagal
            await prisma.blockchainRecord.update({
                where: { transactionId: transactionId },
                data: { status: "FAILED" }
            });

            throw error; // Throw agar BullMQ tahu job ini gagal (untuk retry logic)
        }
    },
    { connection }
);

console.log("Workers running...");