import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Settings, ExternalLink } from "lucide-react";
import { ethers } from "ethers";
import {
  getActiveContractAddress,
  isContractConfigured,
  setCustomContractAddress,
} from "../services/blockchain";
import { BOTCHAIN_CHAIN_ID, getExplorerAddressUrl } from "../config/network";
import { shortenHex } from "../utils/hash";

interface ContractConfigBannerProps {
  onConfigUpdated?: () => void;
}

export const ContractConfigBanner: React.FC<ContractConfigBannerProps> = ({ onConfigUpdated }) => {
  const configured = isContractConfigured();
  const activeAddress = getActiveContractAddress();
  const [isEditing, setIsEditing] = useState(false);
  const [inputAddress, setInputAddress] = useState(activeAddress);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = inputAddress.trim();
    if (!trimmed) {
      setCustomContractAddress("");
      setIsEditing(false);
      onConfigUpdated?.();
      return;
    }
    if (!ethers.isAddress(trimmed) || trimmed === ethers.ZeroAddress) {
      setError("Please enter a valid non-zero Ethereum/Botchain contract address (0x...).");
      return;
    }
    setCustomContractAddress(trimmed);
    setIsEditing(false);
    onConfigUpdated?.();
  };

  if (configured && !isEditing) {
    const explorerUrl = getExplorerAddressUrl(activeAddress);
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/90 bg-navy-900/70 px-4 py-2.5 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            Connected to <strong className="text-white">HashProofRegistry</strong> on Botchain Testnet (Chain ID{" "}
            {BOTCHAIN_CHAIN_ID}):
          </span>
          <code className="rounded bg-navy-950 px-2 py-0.5 font-mono text-brand-400 border border-slate-800">
            {shortenHex(activeAddress, 10, 8)}
          </code>
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 underline-offset-2 hover:underline"
            >
              Explorer <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setInputAddress(activeAddress);
            setIsEditing(true);
          }}
          className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Change Contract
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-200">
              Smart Contract Address Required on Botchain Testnet (Chain ID {BOTCHAIN_CHAIN_ID})
            </h4>
            <p className="mt-1 text-xs text-amber-100/80 leading-relaxed">
              Deploy <code className="font-mono text-amber-300">HashProofRegistry.sol</code> using{" "}
              <code className="font-mono bg-navy-950/60 px-1.5 py-0.5 rounded">
                npx hardhat run scripts/deploy.ts --network botchain
              </code>{" "}
              (which auto-updates <code className="font-mono">src/config/deployment.json</code>), set{" "}
              <code className="font-mono">VITE_CONTRACT_ADDRESS</code> in <code className="font-mono">.env</code>, or paste your deployed Botchain contract address below:
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="text"
          value={inputAddress}
          onChange={(e) => setInputAddress(e.target.value)}
          placeholder="0x... (Deployed HashProofRegistry address on Chain ID 968)"
          className="flex-1 rounded-lg border border-slate-700 bg-navy-950 px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-lg bg-brand-600 hover:bg-brand-500 px-4 py-2 text-xs font-semibold text-white transition-colors"
          >
            Save Contract Address
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-slate-700 bg-navy-800 hover:bg-slate-800 px-3 py-2 text-xs text-slate-300"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
    </div>
  );
};

