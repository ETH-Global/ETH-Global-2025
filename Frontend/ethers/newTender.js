// registerTenderRPC.js
import { ethers } from "ethers";
import { JsonRpcProvider } from "ethers";
// ============================
// CONFIGURATION
// ============================
const FACTORY_ADDRESS = "0x812De30a001d7d89d2D5A93EFeF9C1bDf212018d"; // Replace with your deployed factory address
const FACTORY_ABI = [
  "function createTender(uint256 _durationInMinutes,uint256 _minSuccessfulParticipants,uint256 _maxParticipants) payable returns(address)",
  "event TenderCreated(address indexed company,address tenderAddress,uint256 durationInMinutes,uint256 minSuccessfulParticipants,uint256 maxParticipants,uint256 stake)"
];

// Replace with your Sepolia RPC URL (Infura, Alchemy, etc.)
const RPC_URL = "https://rpc.sepolia.org";
// Replace with the deployer wallet's private key (must have ETH in Sepolia)
const PRIVATE_KEY = "c1797974b29cb83da7b79630fb7e77df9764fb0caf7d2065de8feace3687acaf";

// ============================
// REGISTER TENDER FUNCTION
// ============================
/**
 * Create a new tender via the factory contract using a programmatic RPC provider
 * @param {number} durationMinutes Duration of tender in minutes
 * @param {number} minParticipants Minimum successful participants
 * @param {number} maxParticipants Maximum participants allowed
 * @param {string} stakeEth ETH amount to stake (as string, e.g. "0.05")
 * @returns {Promise<string>} Address of the newly deployed tender
 */
export async function registerNewTenderRPC(durationMinutes, minParticipants, maxParticipants, stakeEth) {
  // Connect to network via RPC
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // Create signer from private key
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  // Connect to the factory contract
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

  console.log("Creating tender...");

  // Send transaction to create tender
  const tx = await factory.createTender(
    durationMinutes,
    minParticipants,
    maxParticipants,
    { value: ethers.parseEther(stakeEth) }
  );

  // Wait for transaction to be mined
  const receipt = await tx.wait();

  // Extract the TenderCreated event
  const event = receipt.events.find(e => e.event === "TenderCreated");
  if (!event) throw new Error("TenderCreated event not found in transaction receipt");

  const tenderAddress = event.args.tenderAddress;
  console.log("New tender deployed at:", tenderAddress);

  return tenderAddress;
}
