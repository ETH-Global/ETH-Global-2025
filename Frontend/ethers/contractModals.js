// tenderModule.js
import { ethers } from "ethers";

// ============================
// CONFIGURATION
// ============================
const FACTORY_ADDRESS = "0xYourFactoryAddress"; // Replace with your deployed factory address
const FACTORY_ABI = [
  "function createTender(uint256 _durationInMinutes,uint256 _minSuccessfulParticipants,uint256 _maxParticipants) payable returns(address)",
  "function getCompanyTenders(address _company) view returns(address[])",
  "function getAllTenders() view returns(address[])",
  "event TenderCreated(address indexed company,address tenderAddress,uint256 durationInMinutes,uint256 minSuccessfulParticipants,uint256 maxParticipants,uint256 stake)"
];

// Tender contract ABI (key functions only for brevity)
const TENDER_ABI = [
  "function enrolledCount() view returns (uint256)",
  "function remainingSlots() view returns (uint256)",
  "function getTenderInfo() view returns (uint256,uint256,uint256,uint256,uint256,bool)",
  "function isParticipantLimitSafe() view returns (bool,string)",
  "function estimatedGasCost() view returns (uint256)",
  "function enroll()",
  "function submitTaskAsCompleted()",
  "function endTenderEarly()",
  "function updateMaxParticipants(uint256)",
  "function endTender()",
  "function withdraw()",
  "function topUpStake() payable",
  "function emergencyReduceMaxParticipants(uint256)",
  "function getContractBalance() view returns (uint256)"
];

// ============================
// PROVIDER & SIGNER
// ============================
let provider, signer;

export async function initProvider() {
  if (!window.ethereum) throw new Error("MetaMask not detected");
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
}

// ============================
// FACTORY FUNCTIONS
// ============================
export function getFactoryContract() {
  if (!signer) throw new Error("Call initProvider first");
  return new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
}

// Create a new tender
export async function createTender(duration, minParticipants, maxParticipants, stakeEth) {
  const factory = getFactoryContract();
  const tx = await factory.createTender(
    duration,
    minParticipants,
    maxParticipants,
    { value: ethers.utils.parseEther(stakeEth) }
  );
  const receipt = await tx.wait();
  // Return deployed tender address from event
  const event = receipt.events.find(e => e.event === "TenderCreated");
  return event.args.tenderAddress;
}

// Get all tenders for a company
export async function getCompanyTenders(companyAddress) {
  const factory = getFactoryContract();
  return await factory.getCompanyTenders(companyAddress);
}

// Get all tenders deployed via factory
export async function getAllTenders() {
  const factory = getFactoryContract();
  return await factory.getAllTenders();
}

// ============================
// TENDER INSTANCE FUNCTIONS
// ============================
export function getTenderContract(tenderAddress) {
  if (!signer) throw new Error("Call initProvider first");
  return new ethers.Contract(tenderAddress, TENDER_ABI, signer);
}

// Enroll in a tender
export async function enroll(tenderAddress) {
  const tender = getTenderContract(tenderAddress);
  const tx = await tender.enroll();
  return tx.wait();
}

// Submit task as completed
export async function submitTask(tenderAddress) {
  const tender = getTenderContract(tenderAddress);
  const tx = await tender.submitTaskAsCompleted();
  return tx.wait();
}

// Withdraw rewards
export async function withdraw(tenderAddress) {
  const tender = getTenderContract(tenderAddress);
  const tx = await tender.withdraw();
  return tx.wait();
}

// End tender (owner only)
export async function endTender(tenderAddress) {
  const tender = getTenderContract(tenderAddress);
  const tx = await tender.endTender();
  return tx.wait();
}

// Get tender info (view)
export async function getTenderInfo(tenderAddress) {
  const tender = getTenderContract(tenderAddress);
  return await tender.getTenderInfo();
}

// Get enrolled count
export async function getEnrolledCount(tenderAddress) {
  const tender = getTenderContract(tenderAddress);
  return await tender.enrolledCount();
}

// Remaining slots
export async function getRemainingSlots(tenderAddress) {
  const tender = getTenderContract(tenderAddress);
  return await tender.remainingSlots();
}
