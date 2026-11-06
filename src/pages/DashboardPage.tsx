import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  FileCheck2,
  Lock,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
} from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { ContractConfigBanner } from "../components/ContractConfigBanner";
import { QrShareModal } from "../components/QrShareModal";
import {
  fetchWalletFilesPaginated,
  getActiveContractAddress,
  isContractConfigured,
} from "../services/blockchain";
import {
  BOTCHAIN_CHAIN_ID,
  BOTCHAIN_NETWORK_METADATA,
  getExplorerAddressUrl,
  getExplorerTxUrl,
} from "../config/network";
import { formatTimestamp, shortenHex } from "../utils/hash";
import { FileRecord } from "../types";

export const DashboardPage: React.FC = () => {
  const {
    address,
    chainId,
    isConnected,
    isCorrectNetwork,
    connectMetaMask,
    switchToBotchain,
  } = useWallet();

  const [totalFiles, setTotalFiles] = useState<number>(0);
  const [recentFiles, setRecentFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [qrModalHash, setQrModalHash] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!address || !isContractConfigured()) {
      setTotalFiles(0);
      setRecentFiles([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { total } = await fetchWalletFilesPaginated(address, 0, 1);
      setTotalFiles(total);

      if (total > 0) {
        const limit = Math.min(5, total);
        const offset = Math.max(0, total - limit);
        const { records } = await fetchWalletFilesPaginated(address, offset, limit);
        // Display newest first
        setRecentFiles([...records].reverse());
      } else {
        setRecentFiles([]);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load wallet records from Botchain RPC."
      );
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleCopyHash = async (hash: string) => {
    await navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
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
              Connect MetaMask on Botchain Testnet (Chain ID {BOTCHAIN_CHAIN_ID}) to view your personal dashboard and on-chain file registration history.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={connectMetaMask}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-colors"
            >
              <Wallet className="h-4 w-4" />
              Connect MetaMask
            </button>
            <Link
              to="/verify"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-navy-800 hover:bg-slate-800 px-6 py-3 text-sm font-medium text-slate-200 transition-colors"
            >
              <FileCheck2 className="h-4 w-4" />
              Use Public Verification Instead
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-400">
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Personal On-Chain Registry Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Wallet Dashboard</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white transition-colors"
          >
            <Lock className="h-4 w-4" />
            Register New File
          </Link>
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-navy-800 hover:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors"
          >
            <FileCheck2 className="h-4 w-4 text-brand-400" />
            Verify a File
          </Link>
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-navy-900 hover:bg-navy-800 px-3.5 py-2.5 text-xs font-medium text-slate-300 transition-colors"
            title="Refresh on-chain records"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-brand-400" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <ContractConfigBanner onConfigUpdated={loadDashboardData} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-800 bg-navy-900/80 p-5 space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Connected Wallet
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm font-semibold text-white break-all">
              {shortenHex(address || "", 10, 8)}
            </span>
            {address && getExplorerAddressUrl(address) && (
              <a
                href={getExplorerAddressUrl(address)!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300"
                title="View on Botchain Explorer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          <p className="text-[11px] font-mono text-slate-500 truncate">{address}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-navy-900/80 p-5 space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Network Connection Status
          </span>
          {isCorrectNetwork ? (
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{BOTCHAIN_NETWORK_METADATA.name}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="text-amber-400 font-semibold text-sm">
                Wrong Network (Chain {chainId ?? "?"})
              </span>
              <button
                type="button"
                onClick={() => switchToBotchain().catch(() => {})}
                className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-xs font-semibold text-amber-300"
              >
                Switch to {BOTCHAIN_CHAIN_ID}
              </button>
            </div>
          )}
          <p className="text-xs text-slate-400">
            Chain ID: <span className="font-mono text-slate-200">{BOTCHAIN_CHAIN_ID}</span> • Token:{" "}
            <span className="font-mono text-slate-200">
              {BOTCHAIN_NETWORK_METADATA.nativeCurrency.symbol}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-navy-900/80 p-5 space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Total Registered Files
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-brand-400">
              {isLoading ? "..." : totalFiles}
            </span>
            <Link
              to="/my-files"
              className="text-xs font-medium text-brand-400 hover:text-brand-300 hover:underline"
            >
              View All Files →
            </Link>
          </div>
          <p className="text-xs text-slate-400">
            Queried directly from{" "}
            <code className="font-mono text-slate-300">
              {shortenHex(getActiveContractAddress() || "HashProofRegistry", 8, 6)}
            </code>
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 flex items-start gap-3 text-xs text-rose-200">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-300">Error Reading Contract Data</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Recently Registered Files */}
      <div className="rounded-2xl border border-slate-800 bg-navy-900/75 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Recently Registered Files</h2>
            <p className="text-xs text-slate-400">
              Most recent SHA-256 file fingerprints anchored by your connected wallet.
            </p>
          </div>
          {totalFiles > 0 && (
            <Link
              to="/my-files"
              className="text-xs font-semibold text-brand-400 hover:text-brand-300"
            >
              Full Paginated History ({totalFiles}) →
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin text-brand-400 mx-auto mb-2" />
            Reading on-chain records from Botchain Testnet...
          </div>
        ) : recentFiles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-navy-950/60 py-12 px-4 text-center space-y-3">
            <FolderOpen className="h-10 w-10 text-slate-500 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">No Registered Files Found</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                This wallet has not registered any SHA-256 file fingerprints on the configured Botchain Testnet contract yet.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 px-5 py-2.5 text-xs font-semibold text-white transition-colors"
              >
                <Lock className="h-3.5 w-3.5" />
                Register Your First File
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 pr-4">SHA-256 File Hash</th>
                  <th className="py-3 px-4">Registration Date</th>
                  <th className="py-3 px-4">Transaction</th>
                  <th className="py-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {recentFiles.map((item) => (
                  <tr key={item.fileHash} className="hover:bg-navy-800/40 transition-colors">
                    <td className="py-3.5 pr-4 font-mono text-brand-400">
                      <div className="flex items-center gap-2">
                        <span title={item.fileHash}>{shortenHex(item.fileHash, 12, 10)}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyHash(item.fileHash)}
                          className="text-slate-400 hover:text-white"
                          title="Copy full SHA-256 hash"
                        >
                          {copiedHash === item.fileHash ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {formatTimestamp(item.timestamp)}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.txHash ? (
                        getExplorerTxUrl(item.txHash) ? (
                          <a
                            href={getExplorerTxUrl(item.txHash)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-brand-400 hover:underline"
                          >
                            {shortenHex(item.txHash, 8, 6)}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="font-mono text-slate-400">
                            {shortenHex(item.txHash, 8, 6)}
                          </span>
                        )
                      ) : (
                        <span
                          className="text-slate-500 text-[11px]"
                          title="Historical event outside recent RPC block window; on-chain state record verified."
                        >
                          On-Chain Storage Verified
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQrModalHash(item.fileHash)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-navy-800 hover:bg-slate-800 px-2.5 py-1 text-slate-200 transition-colors"
                        >
                          <QrCode className="h-3.5 w-3.5 text-brand-400" />
                          QR
                        </button>
                        <Link
                          to={`/verify/${item.fileHash}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-600/20 border border-brand-500/30 hover:bg-brand-600/30 px-2.5 py-1 text-brand-300 transition-colors"
                        >
                          Verify Proof
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <QrShareModal fileHash={qrModalHash} onClose={() => setQrModalHash(null)} />
    </div>
  );
};

