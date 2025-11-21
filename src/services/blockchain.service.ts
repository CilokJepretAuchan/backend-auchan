import { ethers } from "ethers";
import abi from "../../contracts/abi.json";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS!,
    abi,
    wallet
);

export async function submitHashToChain(id: string, hash: string) {
    const tx = await contract.submitHash(id, hash);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
}
