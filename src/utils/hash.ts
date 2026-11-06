const ZERO_HASH_HEX = "0x0000000000000000000000000000000000000000000000000000000000000000";
const BYTES32_REGEX = /^0x[0-9a-fA-F]{64}$/;

/**
 * Converts an ArrayBuffer to a 0x-prefixed lowercase 64-char hex string (bytes32).
 */
export function bufferToHex(buffer: ArrayBuffer): `0x${string}` {
  const byteArray = new Uint8Array(buffer);
  let hex = "0x";
  for (let i = 0; i < byteArray.length; i++) {
    hex += byteArray[i].toString(16).padStart(2, "0");
  }
  return hex as `0x${string}`;
}

/**
 * Calculates the SHA-256 fingerprint of raw bytes using the native Web Crypto API.
 * Strictly hashes raw file bytes — never the filename or metadata.
 */
export async function computeSha256FromBuffer(fileBytes: ArrayBuffer): Promise<`0x${string}`> {
  if (!globalThis.crypto || !globalThis.crypto.subtle) {
    throw new Error("Web Crypto API is not available in this browser environment.");
  }
  const digest = await globalThis.crypto.subtle.digest("SHA-256", fileBytes);
  return bufferToHex(digest);
}

/**
 * Calculates the SHA-256 hash of a browser File or Blob locally in the browser.
 * Enforces safe file size limits to prevent browser memory exhaustion.
 */
export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB safe browser memory cap

export async function calculateFileSha256(file: File | Blob): Promise<`0x${string}`> {
  if (!file) {
    throw new Error("No file provided for hashing.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File exceeds the safe in-browser memory limit of ${formatFileSize(MAX_FILE_SIZE_BYTES)}.`
    );
  }
  const fileBytes = await file.arrayBuffer();
  return computeSha256FromBuffer(fileBytes);
}

/**
 * Validates whether a string is a valid non-zero 32-byte (64 hex chars + 0x) SHA-256 hash.
 */
export function isValidBytes32Hash(hash: string): hash is `0x${string}` {
  if (!hash || typeof hash !== "string") return false;
  const trimmed = hash.trim();
  if (!BYTES32_REGEX.test(trimmed)) return false;
  if (trimmed.toLowerCase() === ZERO_HASH_HEX) return false;
  return true;
}

/**
 * Normalizes a bytes32 hash to lowercase 0x-prefixed format.
 */
export function normalizeHash(hash: string): `0x${string}` {
  const trimmed = hash.trim().toLowerCase();
  if (!trimmed.startsWith("0x") && /^[0-9a-f]{64}$/.test(trimmed)) {
    return `0x${trimmed}`;
  }
  return trimmed as `0x${string}`;
}

/**
 * Formats a bytes32 hash or wallet address into a readable shortened string.
 */
export function shortenHex(hex: string, startChars = 8, endChars = 6): string {
  if (!hex) return "";
  if (hex.length <= startChars + endChars + 3) return hex;
  return `${hex.slice(0, startChars)}...${hex.slice(-endChars)}`;
}

/**
 * Formats byte count into human-readable KB / MB / GB.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

/**
 * Formats a Unix timestamp (in seconds) into a full human-readable UTC and local date string.
 */
export function formatTimestamp(unixSeconds: number | bigint): string {
  const sec = Number(unixSeconds);
  if (!sec || sec <= 0) return "N/A";
  const date = new Date(sec * 1000);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

/**
 * Builds the canonical public verification URL for a registered file hash.
 */
export function buildVerificationUrl(fileHash: string, origin?: string): string {
  const base =
    origin ||
    (typeof window !== "undefined" && window.location ? window.location.origin : "http://localhost:5173");
  return `${base.replace(/\/+$/, "")}/verify/${normalizeHash(fileHash)}`;
}

