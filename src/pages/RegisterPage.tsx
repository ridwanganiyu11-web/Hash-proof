import React, { useState } from "react";
import {
  ShieldCheck,
  Copy,
  Check,
  Wallet,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Lock,
} from "lucide-react";
import { FileDropzone } from "../components/FileDropzone";
import { ContractConfigBanner } from "../components/ContractConfigBanner";
import { QrShareCard } from "../components/QrShareModal";
import { useWallet } from "../hooks/useWallet";
import {
  calculateFileSha256,
  formatTimestamp,
  shortenHex,
} from "../utils/hash";
import {
  fetchFileRecordPublic,
  isContractConfigured,
  registerFileHashOnChain,
} from "../services/blockchain";
import {
  BOTCHAIN_CHAIN_ID,
  getExplorerAddressUrl,
  getExplorerTxUrl,
} from "../config/network";
import { FileRecord } from "../types";

export const RegisterPage: React.FC = () => {
  const {
    address,
    chainId,
    isConnected,
    isCorrectNetwork,
    connectMetaMask,
    switchToBotchain,
  } = useWallet();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>("");
  const [isHashing, setIsHashing] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const [existingRecord, setExistingRecord] = useState<FileRecord | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  const [txStatus, setTxStatus] = useState<"idle" | "signing" | "pending" | "confirmed" | "error">("idle");
  const [pendingTxHash, setPendingTxHash] = useState<string>("");
  const [confirmedTxHash, setConfirmedTxHash] = useState<string>("");
  const [confirmedOwner, setConfirmedOwner] = useState<string>("");
  const [confirmedTimestamp, setConfirmedTimestamp] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setFileHash("");
    setExistingRecord(null);
    setTxStatus("idle");
    setPendingTxHash("");
    setConfirmedTxHash("");
    setErrorMessage(null);

    setIsHashing(true);
    try {
      const digest = await calculateFileSha256(file);
      setFileHash(digest);

      if (isContractConfigured()) {
        setIsCheckingDuplicate(true);
        try {
          const rec = await fetchFileRecordPublic(digest);
          if (rec.exists) {
            setExistingRecord(rec);
          }
        } catch {
          // Non-blocking if RPC check fails during initial preview
        } finally {
          setIsCheckingDuplicate(false);
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to calculate SHA-256 hash.");
    } finally {
      setIsHashing(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileHash("");
    setExistingRecord(null);
    setTxStatus("idle");
    setPendingTxHash("");
    setConfirmedTxHash("");
    setErrorMessage(null);
  };

  const handleCopyHash = async () => {
    if (!fileHash) return;
    await navigator.clipboard.writeText(fileHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleRegisterSubmit = async () => {
    if (!fileHash) return;
    setErrorMessage(null);

    if (!isContractConfigured()) {
      setErrorMessage(
        "HashProofRegistry contract address is not configured. Deploy the contract to Botchain Testnet or set its address above."
      );
      return;
    }

    setTxStatus("signing");
    try {
      const result = await registerFileHashOnChain(fileHash, (hash) => {
        setPendingTxHash(hash);
        setTxStatus("pending");
      });

      setConfirmedTxHash(result.txHash);
      setConfirmedOwner(result.owner);
      setConfirmedTimestamp(result.timestamp);
      setTxStatus("confirmed");
    } catch (err) {
      setTxStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Transaction failed.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-400">
          <Lock className="h-3.5 w-3.5" />
          <span>On-Chain File Registration</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Register File Fingerprint</h1>
        <p className="text-sm text-slate-400">
          Generate a SHA-256 cryptographic digest locally in your browser and anchor it permanently on Botchain Testnet (Chain ID {BOTCHAIN_CHAIN_ID}).
        </p>
      </div>

      <ContractConfigBanner />

      <div className="rounded-2xl border border-slate-800 bg-navy-900/75 p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Step 1: Select File */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              1. Select File to Hash Locally
            </h2>
            <span className="text-xs text-slate-500">SHA-256 (Web Crypto API)</span>
          </div>

          <FileDropzone
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onClearFile={handleClearFile}
            isProcessing={isHashing || txStatus === "signing" || txStatus === "pending"}
          />
        </div>

        {/* Step 2: Generated SHA-256 Hash */}
        {isHashing && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-navy-950 p-4 text-sm text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
            <span>Computing SHA-256 digest of raw file bytes in browser...</span>
          </div>
        )}

        {fileHash && !isHashing && (
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                2. Generated SHA-256 Fingerprint (bytes32)
              </h2>
              <button
                type="button"
                onClick={handleCopyHash}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-navy-800 hover:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 transition-colors"
              >
                {copiedHash ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Hash
                  </>
                )}
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-navy-950 p-4 font-mono text-xs sm:text-sm text-brand-400 break-all">
              {fileHash}
            </div>

            {isCheckingDuplicate && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-400" />
                <span>Checking if fingerprint is already registered on Botchain Testnet...</span>
              </div>
            )}

            {/* Duplicate warning if already registered */}
            {existingRecord && existingRecord.exists && txStatus !== "confirmed" && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-amber-200">
                      Already Registered on Botchain Testnet
                    </h4>
                    <p className="text-xs text-amber-100/80 leading-relaxed">
                      This file's SHA-256 fingerprint is already permanently anchored on-chain. Duplicate registrations are rejected by the smart contract to preserve historical integrity and save gas.
                    </p>
                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-navy-950/70 p-2.5 border border-slate-800">
                        <span className="text-slate-400 block">Registered By:</span>
                        <span className="font-mono text-slate-200">{shortenHex(existingRecord.owner, 10, 8)}</span>
                      </div>
                      <div className="rounded-lg bg-navy-950/70 p-2.5 border border-slate-800">
                        <span className="text-slate-400 block">Registration Date:</span>
                        <span className="text-slate-200">{formatTimestamp(existingRecord.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <QrShareCard fileHash={fileHash} compact />
              </div>
            )}

            {/* Step 3: Wallet & Network Check + Submit */}
            {(!existingRecord || !existingRecord.exists) && txStatus !== "confirmed" && (
              <div className="space-y-4 pt-3 border-t border-slate-800/80">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                  3. Sign & Anchor on Botchain Testnet
                </h2>

                {!isConnected ? (
                  <div className="rounded-xl border border-slate-800 bg-navy-950 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">Connect Your Web3 Wallet</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Connect MetaMask on Botchain Testnet (Chain ID {BOTCHAIN_CHAIN_ID}) to sign the registration transaction.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={connectMetaMask}
                      className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
                    >
                      <Wallet className="h-4 w-4" />
                      Connect MetaMask
                    </button>
                  </div>
                ) : !isCorrectNetwork ? (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-200">
                          Wrong Network Detected (Chain ID {chainId ?? "Unknown"})
                        </p>
                        <p className="text-xs text-amber-100/80 mt-0.5">
                          Please switch your wallet to Botchain Testnet (Chain ID {BOTCHAIN_CHAIN_ID}) before submitting.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchToBotchain().catch(() => {})}
                      className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-navy-950 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Switch to Chain ID {BOTCHAIN_CHAIN_ID}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-navy-950 px-4 py-3 text-xs">
                      <span className="text-slate-400">
                        Signing Wallet:{" "}
                        <strong className="font-mono text-slate-200">{address}</strong>
                      </span>
                      <span className="text-emerald-400 font-medium">
                        Botchain Testnet (Chain ID {BOTCHAIN_CHAIN_ID})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleRegisterSubmit}
                      disabled={txStatus === "signing" || txStatus === "pending" || isCheckingDuplicate}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-60 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition-all"
                    >
                      {txStatus === "signing" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Awaiting Signature in MetaMask...
                        </>
                      ) : txStatus === "pending" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Confirming Transaction on Botchain...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Register Fingerprint on Botchain
                        </>
                      )}
                    </button>
                  </div>
                )}

                {txStatus === "pending" && pendingTxHash && (
                  <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-4 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-semibold text-brand-300">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Transaction Broadcast — Waiting for Block Confirmation...</span>
                    </div>
                    <p className="font-mono text-slate-300 break-all">Tx Hash: {pendingTxHash}</p>
                    {getExplorerTxUrl(pendingTxHash) && (
                      <a
                        href={getExplorerTxUrl(pendingTxHash)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand-400 hover:underline"
                      >
                        View Pending Transaction on Explorer <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 flex items-start gap-3 text-xs text-rose-200">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-300">Registration Error</p>
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Confirmed Registration State */}
        {txStatus === "confirmed" && (
          <div className="space-y-6 pt-4 border-t border-slate-800">
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-300">
                    File Fingerprint Permanently Registered on Botchain!
                  </h3>
                  <p className="text-xs text-emerald-100/80 mt-0.5">
                    Your transaction was confirmed on-chain. Anyone can now verify this file's integrity using the public verification link or QR code below.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div className="rounded-xl bg-navy-950/90 border border-slate-800 p-3.5">
                  <span className="text-slate-400 block mb-1">Registered Owner Wallet</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-slate-100 break-all">{confirmedOwner}</span>
                    {getExplorerAddressUrl(confirmedOwner) && (
                      <a
                        href={getExplorerAddressUrl(confirmedOwner)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-400 hover:text-brand-300 shrink-0"
                        title="View wallet on Botchain Explorer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-navy-950/90 border border-slate-800 p-3.5">
                  <span className="text-slate-400 block mb-1">Confirmed Block Timestamp</span>
                  <span className="font-medium text-slate-100">
                    {formatTimestamp(confirmedTimestamp)}
                  </span>
                </div>

                <div className="sm:col-span-2 rounded-xl bg-navy-950/90 border border-slate-800 p-3.5">
                  <span className="text-slate-400 block mb-1">Confirmed Transaction Hash</span>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-brand-400 break-all">{confirmedTxHash}</span>
                    {getExplorerTxUrl(confirmedTxHash) && (
                      <a
                        href={getExplorerTxUrl(confirmedTxHash)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-brand-400 hover:underline shrink-0"
                      >
                        View on Botchain Explorer <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <QrShareCard fileHash={fileHash} />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClearFile}
                className="rounded-xl border border-slate-700 bg-navy-800 hover:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-200 transition-colors"
              >
                Register Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

