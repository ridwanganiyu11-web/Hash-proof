import { describe, it, expect } from "vitest";
import {
  calculateFileSha256,
  computeSha256FromBuffer,
  isValidBytes32Hash,
  normalizeHash,
  buildVerificationUrl,
} from "../utils/hash";
import {
  parseBlockchainError,
  fetchFileRecordPublic,
} from "../services/blockchain";
import {
  BOTCHAIN_CHAIN_ID,
  BOTCHAIN_EXPLORER_URL,
  BOTCHAIN_RPC_URL,
  getExplorerAddressUrl,
  getExplorerTxUrl,
} from "../config/network";

describe("Frontend Verification, Hashing & Error Handling Suite", () => {
  describe("1. Local Browser SHA-256 Calculation (Web Crypto API)", () => {
    it("computes the exact NIST SHA-256 digest for known raw bytes ('abc')", async () => {
      const encoder = new TextEncoder();
      const bytes = encoder.encode("abc").buffer;
      const hash = await computeSha256FromBuffer(bytes);
      expect(hash).toBe("0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    });

    it("produces identical SHA-256 hashes for identical file contents regardless of filename", async () => {
      const content = new Uint8Array([10, 20, 30, 40, 50]);
      const fileA = new File([content], "contract_v1.pdf", { type: "application/pdf" });
      const fileB = new File([content], "renamed_copy.pdf", { type: "application/pdf" });

      const hashA = await calculateFileSha256(fileA);
      const hashB = await calculateFileSha256(fileB);
      expect(hashA).toBe(hashB);
    });

    it("produces a completely different SHA-256 hash when a single byte is modified", async () => {
      const original = new File([new Uint8Array([1, 2, 3, 4])], "report.txt");
      const modified = new File([new Uint8Array([1, 2, 3, 5])], "report.txt");

      const hashOrig = await calculateFileSha256(original);
      const hashMod = await calculateFileSha256(modified);

      expect(hashOrig).not.toBe(hashMod);
      expect(isValidBytes32Hash(hashOrig)).toBe(true);
      expect(isValidBytes32Hash(hashMod)).toBe(true);
    });
  });

  describe("2. Strict Hash Format Validation", () => {
    it("accepts valid 32-byte non-zero hex strings", () => {
      const valid = "0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
      expect(isValidBytes32Hash(valid)).toBe(true);
    });

    it("rejects zero hash, short hashes, and non-hex strings", () => {
      const zeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
      expect(isValidBytes32Hash(zeroHash)).toBe(false);
      expect(isValidBytes32Hash("0x1234")).toBe(false);
      expect(isValidBytes32Hash("not-a-hash")).toBe(false);
      expect(isValidBytes32Hash("")).toBe(false);
    });

    it("normalizes 64-character hex without 0x prefix into 0x-prefixed lowercase bytes32", () => {
      const raw = "BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD";
      const normalized = normalizeHash(raw);
      expect(normalized).toBe("0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
      expect(isValidBytes32Hash(normalized)).toBe(true);
    });
  });

  describe("3. Public Verification URLs & Botchain Network Configuration", () => {
    it("configures Botchain Testnet with Chain ID 968, RPC https://rpc.bohr.life, and Explorer https://scan.bohr.life", () => {
      expect(BOTCHAIN_CHAIN_ID).toBe(968);
      expect(BOTCHAIN_RPC_URL).toBe("https://rpc.bohr.life");
      expect(BOTCHAIN_EXPLORER_URL).toBe("https://scan.bohr.life");
      expect(getExplorerTxUrl("0xabc")).toBe("https://scan.bohr.life/tx/0xabc");
      expect(getExplorerAddressUrl("0x123")).toBe("https://scan.bohr.life/address/0x123");
    });

    it("builds valid public verification links for /verify/0xHASH", () => {
      const sampleHash = "0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
      const url = buildVerificationUrl(sampleHash, "https://hashproof.example");
      expect(url).toBe(`https://hashproof.example/verify/${sampleHash}`);
    });

    it("rejects malformed hashes during public verification before making RPC requests", async () => {
      await expect(fetchFileRecordPublic("0x12345")).rejects.toThrow(
        "Invalid SHA-256 hash format"
      );
    });
  });

  describe("4. Wallet Connection, Network & Transaction Failure State Parsing", () => {
    it("parses user-rejected MetaMask signature errors cleanly", () => {
      const msg = parseBlockchainError({ code: 4001, message: "User denied transaction signature." });
      expect(msg).toBe("Wallet request was rejected by the user.");
    });

    it("parses duplicate registration custom error reverts", () => {
      const msg = parseBlockchainError({
        reason: "HashAlreadyRegistered",
        message: "execution reverted: custom error HashAlreadyRegistered",
      });
      expect(msg).toContain("already permanently registered");
    });

    it("parses zero-hash custom error reverts", () => {
      const msg = parseBlockchainError({
        reason: "InvalidFileHash",
        message: "execution reverted: custom error InvalidFileHash",
      });
      expect(msg).toContain("Zero hashes cannot be registered");
    });

    it("parses insufficient BOT gas funds errors", () => {
      const msg = parseBlockchainError({
        code: "INSUFFICIENT_FUNDS",
        message: "insufficient funds for intrinsic transaction cost",
      });
      expect(msg).toContain("Insufficient BOT balance");
    });
  });
});

