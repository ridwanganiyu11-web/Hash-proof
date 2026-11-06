import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderOpen,
  Wallet,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Lock,
  Link2,
} from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { ContractConfigBanner } from "../components/ContractConfigBanner";
import { QrShareModal } from "../components/QrShareModal";
import {
  fetchWalletFilesPaginated,
  isContractConfigured,
} from "../services/blockchain";
import {
  BOTCHAIN_CHAIN_ID,
  getExplorerAddressUrl,
  getExplorerTxUrl,
} from "../config/network";
import {
  buildVerificationUrl,
  formatTimestamp,
  shortenHex,
} from "../utils/hash";
import { FileRecord } from "../types";

const PAGE_SIZE = 10;

export const MyFilesPage: React.FC = () => {
  const { address, isConnected, connectMetaMask } = useWallet();

  const [records, setRecords] = useState<FileRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [qrModalHash, setQrModalHash] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const loadPage = useCallback(
    async (page: number) => {
      if (!address || !isContractConfigured()) {
        setRecords([]);
        setTotalCount(0);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      try {
        const offset = (page - 1) * PAGE_SIZE;
        const { records: fetched, total } = await fetchWalletFilesPaginated(
          address,
          offset,
          PAGE_SIZE
        );
        setTotalCount(total);
        setRecords(fetched);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load registered files from Botchain RPC."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [address]
  );

  useEffect(() => {
    setCurrentPage(1);
    loadPage(1);
  }, [address, loadPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    loadPage(newPage);
  };

  const handleCopyHash = async (hash: string) => {
    await navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleCopyLink = async (hash: string) => {
    const url = buildVerificationUrl(hash);
    await navigator.clipboard.writeText(url);
    setCopiedLink(hash);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <div className="rounded-3xl border border-slate-800 bg-navy-900/80 p-8 sm:p-12 text-center space-y-6 shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/15 border border-brand-500/30 text-brand-400">
            <Wallet className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Connect Your Wallet</h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Connect MetaMask on Botchain Testnet (Chain ID {BOTCHAIN_CHAIN_ID}) to inspect your registered file hashes and share public verification proofs.
            </p>
          </div>
          <button
            type="button"
            onClick={connectMetaMask}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-colors"
          >
            <Wallet className="h-4 w-4" />
            Connect MetaMask
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-400">
            <FolderOpen className="h-3.5 w-3.5" />
            <span>On-Chain Wallet Index</span>
          </div>
          <h1 className="text-3xl font-bold text-white">My Registered Files</h1>
          <p className="text-sm text-slate-400">
            Paginated on-chain registry records queried directly from <code className="font-mono text-slate-300">getMyFileHashes</code> on Botchain Testnet.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white transition-colors"
          >
            <Lock className="h-4 w-4" />
            Register New File
          </Link>
          <button
            type="button"
            onClick={() => loadPage(currentPage)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-navy-900 hover:bg-navy-800 px-3.5 py-2.5 text-xs font-medium text-slate-300 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-brand-400" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <ContractConfigBanner onConfigUpdated={() => loadPage(currentPage)} />

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 flex items-start gap-3 text-xs text-rose-200">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-300">RPC Query Error</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-navy-900/75 p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="text-xs text-slate-400">
            Wallet: <span className="font-mono text-slate-200">{address}</span>
          </div>
          <div className="text-xs font-semibold text-brand-400">
            Total Registered Hashes: {totalCount}
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin text-brand-400 mx-auto mb-2" />
            Loading paginated records from Botchain Testnet...
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-navy-950/60 py-14 px-4 text-center space-y-3">
            <FolderOpen className="h-10 w-10 text-slate-500 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">No Registered Files Yet</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                When you register a file's SHA-256 fingerprint on Botchain Testnet, it will appear permanently in this list.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 px-5 py-2.5 text-xs font-semibold text-white transition-colors"
              >
                <Lock className="h-3.5 w-3.5" />
                Register a File Now
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((item, idx) => {
              const globalIndex = (currentPage - 1) * PAGE_SIZE + idx + 1;
              const verificationUrl = buildVerificationUrl(item.fileHash);

              return (
                <div
                  key={item.fileHash}
                  className="rounded-xl border border-slate-800 bg-navy-950/80 p-5 space-y-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-brand-500/15 border border-brand-500/30 px-2 py-0.5 text-[11px] font-mono font-semibold text-brand-400">
                          #{globalIndex}
                        </span>
                        <span className="text-xs text-slate-400">
                          Registered on {formatTimestamp(item.timestamp)}
                        </span>
                      </div>
                      <p className="font-mono text-xs sm:text-sm text-white break-all pt-1">
                        {item.fileHash}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyHash(item.fileHash)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-navy-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
                      >
                        {copiedHash === item.fileHash ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            Hash Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy Hash
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyLink(item.fileHash)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-navy-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
                      >
                        {copiedLink === item.fileHash ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            Link Copied
                          </>
                        ) : (
                          <>
                            <Link2 className="h-3.5 w-3.5" />
                            Copy Link
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setQrModalHash(item.fileHash)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-navy-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
                      >
                        <QrCode className="h-3.5 w-3.5 text-brand-400" />
                        QR Share
                      </button>

                      <Link
                        to={`/verify/${item.fileHash}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600/20 border border-brand-500/40 hover:bg-brand-600/30 px-3 py-1.5 text-xs font-semibold text-brand-300 transition-colors"
                      >
                        Verify Page
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span>Owner:</span>
                      <span className="font-mono text-slate-300">{shortenHex(item.owner, 10, 8)}</span>
                      {getExplorerAddressUrl(item.owner) && (
                        <a
                          href={getExplorerAddressUrl(item.owner)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          Explorer <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {item.txHash && getExplorerTxUrl(item.txHash) && (
                        <a
                          href={getExplorerTxUrl(item.txHash)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-brand-400 hover:underline inline-flex items-center gap-1"
                        >
                          Tx: {shortenHex(item.txHash, 8, 6)} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                      <span className="font-mono text-slate-500 truncate max-w-xs hidden sm:inline">
                        {verificationUrl}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-400">
                  Showing page <strong className="text-white">{currentPage}</strong> of{" "}
                  <strong className="text-white">{totalPages}</strong> ({totalCount} total files)
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || isLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-navy-900 hover:bg-slate-800 disabled:opacity-40 px-3 py-1.5 text-xs font-medium text-slate-200"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || isLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-navy-900 hover:bg-slate-800 disabled:opacity-40 px-3 py-1.5 text-xs font-medium text-slate-200"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <QrShareModal fileHash={qrModalHash} onClose={() => setQrModalHash(null)} />
    </div>
  );
};

