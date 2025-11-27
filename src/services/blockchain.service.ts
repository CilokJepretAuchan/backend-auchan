import { randomBytes, randomInt } from 'crypto';

interface BlockchainReceipt {
    onchainTxId: string;
    blockHash: string;
    blockNumber: number;
}

/**
 * MOCK: Simulates writing a hash to a blockchain smart contract.
 *
 * @param hashToStore The SHA-256 hash of the transaction integrity payload.
 * @returns A promise that resolves to a mock blockchain transaction receipt.
 */
export const storeHashOnChain = async (hashToStore: string): Promise<BlockchainReceipt> => {
    const mockTxId = `0x${randomBytes(32).toString('hex')}`;
    const mockBlockHash = `0x${randomBytes(32).toString('hex')}`;
    const mockBlockNumber = randomInt(1_000_000, 2_000_000);

    console.log(`[MockBlockchainService] Storing hash ${hashToStore.substring(0, 10)}... on chain.`);
    console.log(`[MockBlockchainService] --> On-chain TxID: ${mockTxId}`);

    // Simulate network latency for the transaction to be mined.
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        onchainTxId: mockTxId,
        blockHash: mockBlockHash,
        blockNumber: mockBlockNumber,
    };
};

/**
 * MOCK: Simulates retrieving a hash from the blockchain for verification.
 *
 * @param onchainTxId The on-chain transaction ID to look up.
 * @returns The hash stored on-chain. In this mock, it returns a placeholder to simulate failure.
 */
export const getHashFromChain = async (onchainTxId: string): Promise<string | null> => {
    console.log(`[MockBlockchainService] Fetching hash for on-chain TxID: ${onchainTxId}`);

    // In a real scenario, you would query the blockchain.
    return Promise.resolve(`0x_mock_hash_retrieved_from_chain_for_${onchainTxId}`);
};