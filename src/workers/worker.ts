import { Worker } from "bullmq";
import { prisma } from "../prisma/client";
import { submitHashToChain } from "../services/blockchain.service";
import { connection } from "../queues/queues";

new Worker(
    "blockchainQueue",
    async (job) => {
        const { transactionId, hash } = job.data;

        const record = await prisma.blockchainRecord.create({
            data: { transactionId, blockchainHash: hash }
        });

        const res = await submitHashToChain(transactionId, hash);

        await prisma.blockchainRecord.update({
            where: { id: record.id },
            data: { onchainTxId: res.txHash, status: "confirmed" }
        });
    },
    { connection }
);

new Worker(
    "aiQueue",
    async (job) => {
        const score = Math.random();
        const flagged = score > 0.7;

        await prisma.transaction.update({
            where: { id: job.data.transactionId },
            data: {
                aiAnomalyScore: score,
                anomalyStatus: flagged ? "Pending" : "None"
            }
        });
    },
    { connection }
);

console.log("Workers running...");
