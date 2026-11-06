import React, { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Search,
  ShieldAlert,
} from "lucide-react";
import { FileDropzone } from "../components/FileDropzone";
import { ContractConfigBanner } from "../components/ContractConfigBanner";
import { QrShareCard } from "../components/QrShareModal";
import {
  calculateFileSha256,
  formatTimestamp,
  isValidBytes32Hash,
  normalizeHash,
} from "../utils/hash";
import {
  fetchFileRecordPublic,
  getActiveContractAddress,
  isContractConfigured,
} from "../services/blockchain";
import {
  BOTCHAIN_CHAIN_ID,
  BOTCHAIN_NETWORK_METADATA,
  getExplorerAddressUrl,
  getExplorerTxUrl,
} from "../config/network";
import { FileRecord } from "../types";

export const VerifyPage: React.FC = () => {
  const { hashParam } = useParams<{ hashParam?: string }>();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [calculatedHash, setCalculatedHash] = useState<string>("");
  const [manualHashInput, setManualHashInput] = useState<string>(hashParam || "");

  const [isLoading, setIsLoading] = useState(false);
  const [record, setRecord] = useState<FileRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // When visiting /verify/0xHASH, also allow uploading a local file to compare against the URL hash
  const [urlComparisonMatch, setUrlComparisonMatch] = useState<"none" | "match" | "mismatch">("none");

  const queryHashOnChain = useCallback(async (rawHash: string) => {
    setErrorMessage(null);
    setRecord(null);

    const normalized = normalizeHash(rawHash);
    if (!isValidBytes32Hash(normalized)) {
      setErrorMessage(
        "Malformed SHA-256 hash format. Expected a 64-character hexadecimal digest (with or without 0x prefix)."
      );
      return;
    }

    if (!isContractConfigured()) {
      setErrorMessage(
        "HashProofRegistry contract address is not configured yet. Deploy the contract to Botchain Testnet (Chain ID 968) or set its address above."
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await fetchFileRecordPublic(normalized);
      setRecord(result);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to query Botchain Testnet RPC."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hashParam) {
      setManualHashInput(hashParam);
      setSelectedFile(null);
      setCalculatedHash("");
      setUrlComparisonMatch("none");
      queryHashOnChain(hashParam);
    }
  }, [hashParam, queryHashOnChain]);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const digest = await calculateFileSha256(file);
      setCalculatedHash(digest);

      // If on a /verify/0xHASH route, compare the uploaded file against the URL's hash
      if (hashParam && isValidBytes32Hash(normalizeHash(hashParam))) {
        const expected = normalizeHash(hashParam);
        setUrlComparisonMatch(digest.toLowerCase() === expected.toLowerCase() ? "match" : "mismatch");
        if (!record) {
          await queryHashOnChain(expected);
        }
      } else {
        setManualHashInput(digest);
        setUrlComparisonMatch("none");
        await queryHashOnChain(digest);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to hash file locally.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setCalculatedHash("");
    setUrlComparisonMatch("none");
    if (!hashParam) {
      setRecord(null);
      setManualHashInput("");
      setErrorMessage(null);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualHashInput.trim()) return;
    setSelectedFile(null);
    setCalculatedHash("");
    setUrlComparisonMatch("none");
    queryHashOnChain(manualHashInput.trim());
  };

  const activeHash = record?.fileHash || calculatedHash || (hashParam ? normalizeHash(hashParam) : "");

  const handleCopyHash = async () => {
    if (!activeHash) return;
    await navigator.clipboard.writeText(activeHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
          <FileCheck2 className="h-3.5 w-3.5" />
          <span>Public Wallet-Free Verification • Botchain Testnet (Chain ID {BOTCHAIN_CHAIN_ID})</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Public File Verification</h1>
        <p className="text-sm text-slate-400">
          Verify any file's byte-for-byte integrity against Botchain Testnet without connecting a wallet. Your file is hashed locally in your browser and is never uploaded.
        </p>
      </div>

      <ContractConfigBanner
        onConfigUpdated={() => {
          if (activeHash && isValidBytes32Hash(activeHash)) {
            queryHashOnChain(activeHash);
          }
        }}
      />

      {/* Main Verification Card */}
      <div className="rounded-2xl border border-slate-800 bg-navy-900/75 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              {hashParam
                ? "Upload a Copy of the File to Compare Against This Public Proof"
                : "Upload a File to Verify Locally"}
            </h2>
            <span className="text-xs text-emerald-400 font-medium">No Wallet Required</span>
          </div>

          <FileDropzone
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onClearFile={handleClearFile}
            isProcessing={isLoading}
            label={
              hashParam
                ? "Drop a file here to verify if it matches this URL's registered fingerprint"
                : "Drag and drop any file here to verify its SHA-256 fingerprint on Botchain"
            }
          />
        </div>

        {/* Or lookup by SHA-256 hash directly */}
        <div className="pt-2 border-t border-slate-800/80">
          <form onSubmit={handleManualSearch} className="space-y-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
              Or Look Up Any SHA-256 Hash Directly
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={manualHashInput}
                onChange={(e) => setManualHashInput(e.target.value)}
                placeholder="0x... (64-character SHA-256 hexadecimal hash)"
                className="flex-1 rounded-xl border border-slate-700 bg-navy-950 px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !manualHashInput.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 px-5 py-2.5 text-xs font-semibold text-white transition-colors"
              >
                <Search className="h-4 w-4" />
                Verify Hash
              </button>
            </div>
          </form>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-navy-950 p-5 text-sm text-slate-200">
            <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
            <span>Computing local SHA-256 hash and querying Botchain Testnet RPC...</span>
          </div>
        )}

        {/* Error state */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 flex items-start gap-3 text-xs text-rose-200">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-300">Verification Lookup Error</p>
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* URL File Comparison Banner (when user uploads a file on /verify/0xHASH) */}
        {hashParam && urlComparisonMatch !== "none" && !isLoading && (
          <div
            className={`rounded-xl border p-4 flex items-start gap-3 ${
              urlComparisonMatch === "match"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/40 bg-rose-500/10 text-rose-200"
            }`}
          >
            {urlComparisonMatch === "match" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <p className="font-bold text-sm">
                {urlComparisonMatch === "match"
                  ? "Uploaded File Matches URL Fingerprint Byte-for-Byte"
                  : "WARNING — Uploaded File Does NOT Match This URL's Fingerprint"}
              </p>
              <p className="font-mono break-all">
                Uploaded File SHA-256: <span>{calculatedHash}</span>
              </p>
            </div>
          </div>
        )}

        {/* Verification Result Display */}
        {record && !isLoading && (
          <div className="space-y-6 pt-4 border-t border-slate-800">
            {record.exists && urlComparisonMatch !== "mismatch" ? (
              /* SUCCESS — FILE MATCHES */
              <div className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <div>
                      <span className="inline-block rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                        Verified On-Chain Record
                      </span>
                      <h3 className="text-lg font-extrabold text-white mt-1">
                        SUCCESS — FILE MATCHES
                      </h3>
                      <p className="text-xs text-emerald-200/90 mt-0.5">
                        The calculated SHA-256 hash exists on Botchain Testnet and matches a registered fingerprint.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="rounded-xl bg-navy-950/90 border border-slate-800 p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-400 font-medium">Registered SHA-256 Fingerprint</span>
                      <button
                        type="button"
                        onClick={handleCopyHash}
                        className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300"
                      >
                        {copiedHash ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" /> Copy Hash
                          </>
                        )}
                      </button>
                    </div>
                    <p className="font-mono text-emerald-400 break-all">{record.fileHash}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl bg-navy-950/90 border border-slate-800 p-3.5">
                      <span className="text-slate-400 block mb-1">Registration Owner Address</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-slate-100 break-all">{record.owner}</span>
                        {getExplorerAddressUrl(record.owner) && (
                          <a
                            href={getExplorerAddressUrl(record.owner)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-400 hover:text-brand-300 shrink-0"
                            title="View owner on Botchain Explorer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-navy-950/90 border border-slate-800 p-3.5">
                      <span className="text-slate-400 block mb-1">Registration Timestamp</span>
                      <span className="font-semibold text-slate-100">
                        {formatTimestamp(record.timestamp)}
                      </span>
                      <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
                        Unix Epoch: {record.timestamp}
                      </span>
                    </div>

                    <div className="rounded-xl bg-navy-950/90 border border-slate-800 p-3.5">
                      <span className="text-slate-400 block mb-1">Blockchain Network</span>
                      <span className="font-semibold text-slate-100">
                        {BOTCHAIN_NETWORK_METADATA.name} (Chain ID {BOTCHAIN_CHAIN_ID})
                      </span>
                    </div>

                    <div className="rounded-xl bg-navy-950/90 border border-slate-800 p-3.5">
                      <span className="text-slate-400 block mb-1">Registry Contract Address</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-slate-200 break-all">
                          {getActiveContractAddress()}
                        </span>
                        {getExplorerAddressUrl(getActiveContractAddress()) && (
                          <a
                            href={getExplorerAddressUrl(getActiveContractAddress())!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-400 hover:text-brand-300 shrink-0"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {record.txHash && (
                    <div className="rounded-xl bg-navy-950/90 border border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Registration Transaction Hash</span>
                        <span className="font-mono text-brand-400 break-all">{record.txHash}</span>
                      </div>
                      {getExplorerTxUrl(record.txHash) && (
                        <a
                          href={getExplorerTxUrl(record.txHash)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-brand-400 hover:underline"
                        >
                          View on Explorer <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Mandatory Security Disclaimer */}
                <div className="rounded-xl border border-slate-700/80 bg-navy-950/80 p-3.5 flex items-start gap-2.5 text-xs text-slate-300">
                  <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-white">Verification Scope Notice:</strong> A matching hash proves that the file contents match the registered fingerprint recorded at the timestamp above. It does not by itself prove that the document was originally issued by a particular institution or that the registering wallet belongs to an authorized institution.
                  </p>
                </div>

                <QrShareCard fileHash={record.fileHash} />
              </div>
            ) : (
              /* NOT REGISTERED — NO MATCH FOUND */
              <div className="rounded-2xl border-2 border-rose-500/50 bg-rose-500/10 p-6 space-y-5">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
                    <XCircle className="h-7 w-7" />
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-300">
                      Unverified Fingerprint
                    </span>
                    <h3 className="text-lg font-extrabold text-white mt-1">
                      NOT REGISTERED — NO MATCH FOUND
                    </h3>
                    <p className="text-xs text-rose-200/90 mt-0.5">
                      {urlComparisonMatch === "mismatch"
                        ? "The uploaded file's SHA-256 fingerprint does not match the registered hash in this verification link."
                        : "The calculated SHA-256 hash is not registered on Botchain Testnet."}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-navy-950/90 border border-slate-800 p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Queried SHA-256 Hash:</span>
                    <button
                      type="button"
                      onClick={handleCopyHash}
                      className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300"
                    >
                      {copiedHash ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy Hash
                        </>
                      )}
                    </button>
                  </div>
                  <p className="font-mono text-rose-300 break-all">
                    {calculatedHash || record.fileHash}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-slate-300">
                    Want to anchor this file's fingerprint on Botchain Testnet?
                  </p>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 px-4 py-2 text-xs font-semibold text-white transition-colors"
                  >
                    Register This File Now
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

