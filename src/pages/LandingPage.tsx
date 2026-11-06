import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  FileCheck2,
  Lock,
  Cpu,
  QrCode,
  Globe,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Database,
} from "lucide-react";
import {
  BOTCHAIN_CHAIN_ID,
  BOTCHAIN_EXPLORER_URL,
  BOTCHAIN_NETWORK_METADATA,
  isValidExplorerConfigured,
} from "../config/network";
import { useWallet } from "../hooks/useWallet";

export const LandingPage: React.FC = () => {
  const { switchToBotchain } = useWallet();

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-navy-900/75 px-6 py-16 sm:px-12 sm:py-20 shadow-2xl">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1.5 text-xs font-semibold text-brand-400">
            <ShieldCheck className="h-4 w-4" />
            <span>HashProof • Verify. Trust. Protect.</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
            Verify Your Files.{" "}
            <span className="text-brand-400">Trust the Proof.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed">
            Anchor immutable SHA-256 cryptographic fingerprints of critical documents, archives, and media on{" "}
            <strong className="text-white">Botchain Testnet (Chain ID {BOTCHAIN_CHAIN_ID})</strong>. Anyone can independently verify byte-for-byte file integrity in seconds — with zero file uploads and no wallet required for public verification.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
            <Link
              to="/verify"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition-all"
            >
              <FileCheck2 className="h-4 w-4" />
              Verify a File
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-navy-800 hover:bg-slate-800 px-7 py-3.5 text-sm font-semibold text-slate-100 transition-all"
            >
              <Lock className="h-4 w-4 text-brand-400" />
              Register a File
            </Link>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              100% Local Browser SHA-256 Hashing
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              No Wallet Needed to Verify
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Permanent On-Chain Records
            </span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">How HashProof Works</h2>
          <p className="text-sm text-slate-400">
            Three deterministic cryptographic steps from local file bytes to public blockchain verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-navy-900/80 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 font-mono font-bold text-sm">
                01
              </span>
              <Cpu className="h-5 w-5 text-slate-500" />
            </div>
            <h3 className="text-base font-semibold text-white">Local SHA-256 Digest</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Select any document or binary file. Your browser computes a 32-byte SHA-256 digest directly from the raw file bytes via <code className="font-mono text-slate-300">crypto.subtle.digest</code>. Your file never leaves your device.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-navy-900/80 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 font-mono font-bold text-sm">
                02
              </span>
              <Database className="h-5 w-5 text-slate-500" />
            </div>
            <h3 className="text-base font-semibold text-white">Anchor on Botchain</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sign a lightweight <code className="font-mono text-slate-300">registerFile(bytes32)</code> transaction with MetaMask on Botchain Testnet. The smart contract permanently records the hash, your wallet address, and the block timestamp.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-navy-900/80 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 font-mono font-bold text-sm">
                03
              </span>
              <Globe className="h-5 w-5 text-slate-500" />
            </div>
            <h3 className="text-base font-semibold text-white">Instant Public Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Share your verification link or QR code. Anyone can drop a copy of the file into HashProof to verify whether its SHA-256 fingerprint matches the immutable on-chain record — even if a single bit was altered.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Engineered for Security & Efficiency</h2>
          <p className="text-sm text-slate-400">
            Zero centralized storage, single-slot EVM struct packing, and strict cryptographic guarantees.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: Lock,
              title: "Complete Data Privacy",
              desc: "Files are never uploaded to any server, IPFS gateway, or blockchain. Only the 32-byte irreversible SHA-256 digest is anchored on-chain.",
            },
            {
              icon: Cpu,
              title: "Gas-Optimized Smart Contract",
              desc: "Owner address (20 bytes) and uint64 timestamp (8 bytes) pack into a single 32-byte EVM storage slot, keeping registration costs minimal.",
            },
            {
              icon: Globe,
              title: "Wallet-Free Public Verification",
              desc: "Auditors, clients, and recipients can verify files or inspect public proof links directly via Botchain RPC without installing MetaMask.",
            },
            {
              icon: QrCode,
              title: "Offline-Generated QR Proofs",
              desc: "Every registered fingerprint generates a downloadable PNG QR code locally in your browser leading straight to its public verification URL.",
            },
            {
              icon: ShieldCheck,
              title: "Immutable & Permanent",
              desc: "No admin keys, no update functions, and no delete functions. Once a SHA-256 fingerprint is confirmed on Botchain, it cannot be altered.",
            },
            {
              icon: FileCheck2,
              title: "Avalanche Effect Detection",
              desc: "Modifying even a single byte, pixel, or character in a file produces a completely different SHA-256 hash and immediately flags a mismatch.",
            },
          ].map((feat, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-800/90 bg-navy-900/60 p-6 hover:border-slate-700 transition-colors"
            >
              <feat.icon className="h-5 w-5 text-brand-400 mb-3" />
              <h3 className="text-sm font-semibold text-white">{feat.title}</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Blockchain Integrity Explanation & Network Info */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-navy-900/80 p-6 sm:p-8 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
              Cryptographic Guarantees & Scope
            </span>
            <h3 className="text-xl font-bold text-white">
              Understanding Blockchain-Based File Integrity
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              SHA-256 is a one-way cryptographic hash function that transforms any file of any size into a unique 256-bit (<code className="font-mono text-brand-400">bytes32</code>) fingerprint. Recording that fingerprint on Botchain establishes a tamper-evident proof of existence:
            </p>
            <ul className="space-y-2 text-xs text-slate-300 pt-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Proves Exact File Contents:</strong> A matching hash proves that the uploaded file has the exact same byte sequence as the file registered at that timestamp.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Proves Registering Wallet & Timestamp:</strong> Shows the exact EVM address that signed the registration and the block timestamp when it was anchored.
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs text-amber-200/90 leading-relaxed">
            <strong className="text-amber-300">Important Security Notice:</strong> A matching hash proves that a file's contents match the registered fingerprint. It does <em>not</em> by itself prove that a document was issued by a specific real-world institution unless you independently verify that the registering wallet address belongs to that institution.
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-navy-900/80 p-6 sm:p-8 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
              Network Specifications
            </span>
            <h3 className="text-xl font-bold text-white">Botchain Testnet</h3>
            <p className="text-xs text-slate-400">
              HashProof operates natively on Botchain Testnet. Use the details below to configure your wallet or click the button below to add the network automatically.
            </p>

            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-navy-950 border border-slate-800 px-3.5 py-2.5">
                <span className="text-slate-400">Network Name</span>
                <span className="font-semibold text-white">{BOTCHAIN_NETWORK_METADATA.name}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-navy-950 border border-slate-800 px-3.5 py-2.5">
                <span className="text-slate-400">Chain ID</span>
                <span className="font-mono font-semibold text-brand-400">
                  {BOTCHAIN_CHAIN_ID} ({BOTCHAIN_NETWORK_METADATA.chainIdHex})
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-navy-950 border border-slate-800 px-3.5 py-2.5">
                <span className="text-slate-400">RPC URL</span>
                <span className="font-mono text-slate-200">{BOTCHAIN_NETWORK_METADATA.rpcUrl}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-navy-950 border border-slate-800 px-3.5 py-2.5">
                <span className="text-slate-400">Native Token</span>
                <span className="font-mono text-slate-200">
                  {BOTCHAIN_NETWORK_METADATA.nativeCurrency.symbol} (Supply: {BOTCHAIN_NETWORK_METADATA.totalSupply})
                </span>
              </div>
              {isValidExplorerConfigured() && (
                <div className="flex items-center justify-between rounded-lg bg-navy-950 border border-slate-800 px-3.5 py-2.5">
                  <span className="text-slate-400">Block Explorer</span>
                  <a
                    href={BOTCHAIN_EXPLORER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-brand-400 hover:underline"
                  >
                    {BOTCHAIN_EXPLORER_URL} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => switchToBotchain().catch(() => {})}
            className="w-full rounded-xl border border-brand-500/40 bg-brand-600/20 hover:bg-brand-600/30 py-2.5 text-xs font-semibold text-brand-300 transition-colors"
          >
            Add / Switch to Botchain Testnet in MetaMask
          </button>
        </div>
      </section>
    </div>
  );
};

