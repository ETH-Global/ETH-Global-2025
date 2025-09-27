export default function parseWalletFromPaddedHex(paddedHex) {
  // Ensure it's a hex string
  if (!paddedHex || !/^0x?[0-9a-fA-F]+$/.test(paddedHex)) {
    throw new Error("Invalid hex string");
  }

  // Remove optional 0x prefix
  const hex = paddedHex.startsWith("0x") ? paddedHex.slice(2) : paddedHex;

  // Take last 40 chars → wallet address
  const wallet = "0x" + hex.slice(-40);

  return wallet.toLowerCase();
}