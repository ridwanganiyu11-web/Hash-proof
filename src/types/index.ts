export interface FileRecord {
  fileHash: string;
  owner: string;
  timestamp: number;
  exists: boolean;
  txHash?: string;
}

export interface VerificationResult {
  status: "idle" | "hashing" | "querying" | "verified" | "not_registered" | "error";
  fileHash: string;
  fileName?: string;
  fileSize?: number;
  owner?: string;
  timestamp?: number;
  txHash?: string;
  errorMessage?: string;
}

export interface RegistrationResult {
  fileHash: string;
  fileName: string;
  fileSize: number;
  txHash: string;
  owner: string;
  timestamp: number;
  verificationUrl: string;
}

