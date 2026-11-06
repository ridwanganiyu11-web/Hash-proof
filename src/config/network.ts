import deploymentData from "./deployment.json";
import { defineChain } from "viem";

export const BOTCHAIN_CHAIN_ID = 968;
export const BOTCHAIN_HEX_CHAIN_ID = "0x3c8"; // 968 in hex

const envRpcUrl =
  typeof import.meta !== "undefined" && import.meta.env
    ? (import.meta.env.VITE_BOTCHAIN_RPC_URL as string | undefined)
    : undefined;

const envExplorerUrl =
  typeof import.meta !== "undefined" && import.meta.env
    ? (import.meta.env.VITE_BOTCHAIN_EXPLORER_URL as string | undefined)
    : undefined;

const envContractAddress =
  typeof import.meta !== "undefined" && import.meta.env
    ? (import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined)
    : undefined;

export const BOTCHAIN_RPC_URL =
  (envRpcUrl && envRpcUrl.trim()) || deploymentData.rpcUrl || "https://rpc.bohr.life";

export const BOTCHAIN_EXPLORER_URL = (
  (envExplorerUrl !== undefined ? envExplorerUrl : deploymentData.explorerUrl) ||
  "https://scan.bohr.life"
).replace(/\/+$/, "");

export const CONTRACT_ADDRESS = (
  (envContractAddress && envContractAddress.trim()) ||
  deploymentData.contractAddress ||
  ""
).trim();

export const BOTCHAIN_NETWORK_METADATA = {
  chainId: BOTCHAIN_CHAIN_ID,
  chainIdHex: BOTCHAIN_HEX_CHAIN_ID,
  name: "Botchain Testnet",
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrl: BOTCHAIN_RPC_URL,
  explorerUrl: BOTCHAIN_EXPLORER_URL,
  totalSupply: "150,000,000 BOT",
};

export const botchainTestnet = defineChain({
  id: BOTCHAIN_CHAIN_ID,
  name: "Botchain Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "BOT",
    symbol: "BOT",
  },
  rpcUrls: {
    default: {
      http: [BOTCHAIN_RPC_URL],
    },
    public: {
      http: [BOTCHAIN_RPC_URL],
    },
  },
  blockExplorers: BOTCHAIN_EXPLORER_URL
    ? {
        default: {
          name: "Botchain Explorer",
          url: BOTCHAIN_EXPLORER_URL,
        },
      }
    : undefined,
  testnet: true,
});

export function isValidExplorerConfigured(): boolean {
  try {
    if (!BOTCHAIN_EXPLORER_URL) return false;
    const url = new URL(BOTCHAIN_EXPLORER_URL);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function getExplorerTxUrl(txHash: string): string | null {
  if (!isValidExplorerConfigured() || !txHash) return null;
  return `${BOTCHAIN_EXPLORER_URL}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string | null {
  if (!isValidExplorerConfigured() || !address) return null;
  return `${BOTCHAIN_EXPLORER_URL}/address/${address}`;
}

