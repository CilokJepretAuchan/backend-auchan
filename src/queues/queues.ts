import IORedis from 'ioredis';
import { Queue } from "bullmq";

export const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export const blockchainQueue = new Queue('blockchainQueue', { connection });
export const aiQueue = new Queue('aiQueue', { connection });
