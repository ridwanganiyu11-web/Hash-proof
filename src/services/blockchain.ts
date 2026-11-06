import { ethers } from "ethers";
import { HASH_PROOF_REGISTRY_ABI } from "../config/abi";
import {
  BOTCHAIN_CHAIN_ID,
  BOTCHAIN_HEX_CHAIN_ID,
  BOTCHAIN_NETWORK_METADATA,
  BOTCHAIN_RPC_URL,
  CONTRACT_ADDRESS,
} from "../config/network";
import { FileRecord } from "../types";
import { isValidBytes32Hash, normalizeHash } from "../utils/hash";

export interface InjectedEthereumProvider extends ethers.Eip1193Provider {
  isMetaMask?: boolean;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

export function getInjectedEthereum(): InjectedEthereumProvider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: InjectedEthereumProvider }).ethereum;
}

let cachedReadOnlyProvider: ethers.JsonRpcProvider | null = null;

/**
 * Returns a read-only ethers v6 JsonRpcProvider connected to Botchain Testnet (Chain ID 968).
 * Does NOT require MetaMask or any wallet connection.
 */
export function getReadOnlyProvider(): ethers.JsonRpcProvider {
  if (!cachedReadOnlyProvider) {
    cachedReadOnlyProvider = new ethers.JsonRpcProvider(BOTCHAIN_RPC_URL, {
      chainId: BOTCHAIN_CHAIN_ID,
      name: "botchain-testnet",
    });
  }
  return cachedReadOnlyProvider;
}

/**
 * Resolves the active contract address (allowing runtime override in localStorage for easy testing if needed,
 * while prioritizing environment / deployment.json config).
 */
export function getActiveContractAddress(): string {
  if (CONTRACT_ADDRESS && ethers.isAddress(CONTRACT_ADDRESS)) {
    return CONTRACT_ADDRESS;
  }
  if (typeof window !== "undefined" && window.localStorage) {
    const saved = window.localStorage.getItem("hashproof_contract_address");
    if (saved && ethers.isAddress(saved.trim())) {
      return saved.trim();
    }
  }
  return CONTRACT_ADDRESS;
}

export function setCustomContractAddress(address: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    if (!address.trim()) {
      window.localStorage.removeItem("hashproof_contract_address");
    } else if (ethers.isAddress(address.trim())) {
      window.localStorage.setItem("hashproof_contract_address", address.trim());
    }
  }
}

export function isContractConfigured(): boolean {
  const addr = getActiveContractAddress();
  return Boolean(addr && ethers.isAddress(addr) && addr !== ethers.ZeroAddress);
}

/**
 * Creates a read-only Contract instance for public queries without a wallet.
 */
export function getReadOnlyContract(): ethers.Contract {
  const address = getActiveContractAddress();
  if (!address || !ethers.isAddress(address)) {
    throw new Error(
      "HashProofRegistry contract address is not configured yet. Deploy the contract to Botchain Testnet (Chain ID 968) or set VITE_CONTRACT_ADDRESS."
    );
  }
  return new ethers.Contract(address, HASH_PROOF_REGISTRY_ABI, getReadOnlyProvider());
}

/**
 * Queries a file record on Botchain Testnet using a read-only RPC call (no wallet needed).
 */
export async function fetchFileRecordPublic(rawHash: string): Promise<FileRecord> {
  const normalized = normalizeHash(rawHash);
  if (!isValidBytes32Hash(normalized)) {
    throw new Error("Invalid SHA-256 hash format. Expected a 66-character 0x-prefixed hex string.");
  }

  const contract = getReadOnlyContract();
  try {
    const [owner, timestamp, exists] = (await contract.getFileRecord(normalized)) as [
      string,
      bigint,
      boolean
    ];

    let txHash: string | undefined;
    if (exists) {
      txHash = await findRegistrationTxHash(normalized).catch(() => undefined);
    }

    return {
      fileHash: normalized,
      owner,
      timestamp: Number(timestamp),
      exists,
      txHash,
    };
  } catch (err) {
    throw new Error(parseBlockchainError(err));
  }
}

/**
 * Checks if a file hash is already registered on-chain.
 */
export async function checkIsRegisteredPublic(rawHash: string): Promise<boolean> {
  const normalized = normalizeHash(rawHash);
  if (!isValidBytes32Hash(normalized)) {
    throw new Error("Invalid SHA-256 hash format.");
  }
  const contract = getReadOnlyContract();
  try {
    return (await contract.isRegistered(normalized)) as boolean;
  } catch (err) {
    throw new Error(parseBlockchainError(err));
  }
}

/**
 * Fetches total number of files registered by a wallet address.
 */
export async function fetchWalletFileCount(userAddress: string): Promise<number> {
  if (!ethers.isAddress(userAddress)) {
    throw new Error("Invalid wallet address.");
  }
  const contract = getReadOnlyContract();
  try {
    const count = (await contract.getMyFileCount(userAddress)) as bigint;
    return Number(count);
  } catch (err) {
    throw new Error(parseBlockchainError(err));
  }
}

/**
 * Fetches paginated file records registered by a wallet address using the contract's paginated index.
 */
export async function fetchWalletFilesPaginated(
  userAddress: string,
  offset: number,
  limit: number
): Promise<{ records: FileRecord[]; total: number }> {
  if (!ethers.isAddress(userAddress)) {
    throw new Error("Invalid wallet address.");
  }
  const contract = getReadOnlyContract();
  try {
    const totalBig = (await contract.getMyFileCount(userAddress)) as bigint;
    const total = Number(totalBig);
    if (total === 0 || offset >= total || limit <= 0) {
      return { records: [], total };
    }

    // Fetch newest first by calculating reverse window or querying and resolving records
    const hashes = (await contract.getMyFileHashes(
      userAddress,
      BigInt(offset),
      BigInt(limit)
    )) as string[];

    const records = await Promise.all(
      hashes.map(async (fileHash) => {
        const [owner, timestamp, exists] = (await contract.getFileRecord(fileHash)) as [
          string,
          bigint,
          boolean
        ];
        const txHash = await findRegistrationTxHash(fileHash).catch(() => undefined);
        return {
          fileHash,
          owner,
          timestamp: Number(timestamp),
          exists,
          txHash,
        };
      })
    );

    return { records, total };
  } catch (err) {
    throw new Error(parseBlockchainError(err));
  }
}

/**
 * Attempts to look up the transaction hash for a FileRegistered event within recent RPC block range limits.
 * Also caches discovered txHashes in memory/sessionStorage so newly registered files always show their txHash.
 */
const txHashCache = new Map<string, string>();

export function recordKnownTxHash(fileHash: string, txHash: string): void {
  const normalized = normalizeHash(fileHash);
  txHashCache.set(normalized, txHash);
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(`hashproof_tx_${normalized}`, txHash);
    } catch {
      // Ignore storage quota errors
    }
  }
}

export async function findRegistrationTxHash(fileHash: string): Promise<string | undefined> {
  const normalized = normalizeHash(fileHash);
  if (txHashCache.has(normalized)) {
    return txHashCache.get(normalized);
  }
  if (typeof window !== "undefined" && window.sessionStorage) {
    const cached = window.sessionStorage.getItem(`hashproof_tx_${normalized}`);
    if (cached) {
      txHashCache.set(normalized, cached);
      return cached;
    }
  }

  try {
    const contract = getReadOnlyContract();
    const provider = getReadOnlyProvider();
    const currentBlock = await provider.getBlockNumber();
    // Query a safe recent block window (up to 9,500 blocks) to respect standard RPC log range limits
    const fromBlock = Math.max(0, currentBlock - 9500);
    const filter = contract.filters.FileRegistered(normalized);
    const events = await contract.queryFilter(filter, fromBlock, currentBlock);
    if (events.length > 0) {
      const txHash = events[0].transactionHash;
      if (txHash) {
        recordKnownTxHash(normalized, txHash);
        return txHash;
      }
    }
  } catch {
    // RPC log range limit or indexing limitation — gracefully return undefined
  }
  return undefined;
}

/**
 * Requests MetaMask or injected EIP-1193 wallet to switch to or add Botchain Testnet (Chain ID 968).
 */
export async function switchOrAddBotchainNetwork(): Promise<void> {
  const ethereum = getInjectedEthereum();
  if (!ethereum) {
    throw new Error("MetaMask or a compatible Web3 wallet was not detected in your browser.");
  }

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BOTCHAIN_HEX_CHAIN_ID }],
    });
  } catch (switchError: unknown) {
    const err = switchError as { code?: number; message?: string };
    // Error code 4902 indicates the chain has not been added to MetaMask yet
    if (err.code === 4902 || (err.message && err.message.includes("Unrecognized chain ID"))) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: BOTCHAIN_HEX_CHAIN_ID,
            chainName: BOTCHAIN_NETWORK_METADATA.name,
            nativeCurrency: BOTCHAIN_NETWORK_METADATA.nativeCurrency,
            rpcUrls: [BOTCHAIN_NETWORK_METADATA.rpcUrl],
            blockExplorerUrls: BOTCHAIN_NETWORK_METADATA.explorerUrl
              ? [BOTCHAIN_NETWORK_METADATA.explorerUrl]
              : undefined,
          },
        ],
      });
    } else {
      throw new Error(parseBlockchainError(switchError));
    }
  }
}

/**
 * Submits a real wallet-signed `registerFile(bytes32)` transaction via ethers.js v6 BrowserProvider.
 * Never fakes a transaction; waits for on-chain confirmation.
 */
export async function registerFileHashOnChain(
  rawHash: string,
  onPendingTx?: (txHash: string) => void
): Promise<{
  txHash: string;
  owner: string;
  timestamp: number;
}> {
  const normalized = normalizeHash(rawHash);
  if (!isValidBytes32Hash(normalized)) {
    throw new Error("Invalid SHA-256 hash format. Cannot register a zero or malformed hash.");
  }

  const ethereum = getInjectedEthereum();
  if (!ethereum) {
    throw new Error("MetaMask or a compatible Web3 wallet is required to sign registration transactions.");
  }

  const address = getActiveContractAddress();
  if (!address || !ethers.isAddress(address)) {
    throw new Error(
      "HashProofRegistry contract address is not configured. Deploy the contract to Botchain Testnet (Chain ID 968) first."
    );
  }

  const browserProvider = new ethers.BrowserProvider(ethereum);
  const network = await browserProvider.getNetwork();
  if (Number(network.chainId) !== BOTCHAIN_CHAIN_ID) {
    throw new Error(
      `Wrong network detected (Chain ID ${network.chainId.toString()}). Please switch your wallet to Botchain Testnet (Chain ID ${BOTCHAIN_CHAIN_ID}).`
    );
  }

  const signer = await browserProvider.getSigner();
  const signerAddress = await signer.getAddress();

  const contract = new ethers.Contract(address, HASH_PROOF_REGISTRY_ABI, signer);

  // Pre-check whether the hash is already registered to prevent wasted gas
  const [existingOwner, existingTimestamp, alreadyExists] = (await contract.getFileRecord(
    normalized
  )) as [string, bigint, boolean];
  if (alreadyExists) {
    throw new Error(
      `This file hash is already registered on Botchain Testnet by ${existingOwner} (Timestamp: ${Number(
        existingTimestamp
      )}).`
    );
  }

  try {
    const tx = await contract.registerFile(normalized);
    if (onPendingTx) {
      onPendingTx(tx.hash);
    }

    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error("Transaction was reverted on-chain.");
    }

    recordKnownTxHash(normalized, tx.hash);

    // Read confirmed record directly from contract
    const [confirmedOwner, confirmedTimestamp] = (await contract.getFileRecord(normalized)) as [
      string,
      bigint,
      boolean
    ];

    return {
      txHash: tx.hash,
      owner: confirmedOwner || signerAddress,
      timestamp: Number(confirmedTimestamp) || Math.floor(Date.now() / 1000),
    };
  } catch (err) {
    throw new Error(parseBlockchainError(err));
  }
}

/**
 * Translates raw ethers / RPC / MetaMask errors into clear, actionable user messages.
 */
export function parseBlockchainError(error: unknown): string {
  if (!error) return "An unknown blockchain error occurred.";
  if (typeof error === "string") return error;

  const errObj = error as {
    code?: string | number;
    reason?: string;
    shortMessage?: string;
    message?: string;
    info?: { error?: { message?: string; code?: number } };
  };

  if (
    errObj.code === "ACTION_REJECTED" ||
    errObj.code === 4001 ||
    errObj.info?.error?.code === 4001 ||
    errObj.message?.toLowerCase().includes("user rejected") ||
    errObj.message?.toLowerCase().includes("user denied")
  ) {
    return "Wallet request was rejected by the user.";
  }

  if (errObj.message?.includes("HashAlreadyRegistered") || errObj.reason?.includes("HashAlreadyRegistered")) {
    return "This SHA-256 file fingerprint is already permanently registered on Botchain Testnet.";
  }

  if (errObj.message?.includes("InvalidFileHash") || errObj.reason?.includes("InvalidFileHash")) {
    return "Invalid file hash: Zero hashes cannot be registered.";
  }

  if (
    errObj.code === "INSUFFICIENT_FUNDS" ||
    errObj.message?.toLowerCase().includes("insufficient funds")
  ) {
    return "Insufficient BOT balance in your wallet to pay for Botchain Testnet gas fees.";
  }

  if (
    errObj.code === "NETWORK_ERROR" ||
    errObj.message?.toLowerCase().includes("failed to fetch") ||
    errObj.message?.toLowerCase().includes("could not coalesce error")
  ) {
    return `Unable to reach Botchain Testnet RPC (${BOTCHAIN_RPC_URL}). Please check your internet connection or RPC status.`;
  }

  if (errObj.shortMessage) return errObj.shortMessage;
  if (errObj.reason) return errObj.reason;
  if (errObj.message) return errObj.message;

  return "An unexpected blockchain interaction error occurred.";
}
