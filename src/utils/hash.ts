import crypto from 'crypto';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// 1. Untuk Password (Bcrypt)
export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};

// 2. Untuk Blockchain/Integritas Data (SHA-256)
export const generateDataHash = (data: any): string => {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(jsonString).digest('hex');
};