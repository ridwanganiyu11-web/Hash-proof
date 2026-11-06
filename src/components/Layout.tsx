import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  ShieldCheck,
  Wallet,
  LogOut,
  AlertCircle,
  Menu,
  X,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import {
  BOTCHAIN_CHAIN_ID,
  BOTCHAIN_EXPLORER_URL,
  BOTCHAIN_NETWORK_METADATA,
  isValidExplorerConfigured,
} from "../config/network";
import { shortenHex } from "../utils/hash";

export const Navbar: React.FC = () => {
  const {
    address,
    chainId,
    isConnected,
    isCorrectNetwork,
    isConnecting,
    connectMetaMask,
    disconnectWallet,
    switchToBotchain,
  } = useWallet();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Home", end: true },
    { to: "/verify", label: "Public Verify" },
    { to: "/register", label: "Register File" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/my-files", label: "My Files" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-navy-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20 border border-brand-500/40 text-brand-400 group-hover:bg-brand-600/30 transition-colors">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">HashProof</span>
              <span className="hidden sm:inline-block rounded-full bg-brand-500/15 border border-brand-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-400">
                Botchain {BOTCHAIN_CHAIN_ID}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">Verify. Trust. Protect.</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-600/15 text-brand-400 border border-brand-500/30"
                    : "text-slate-300 hover:bg-navy-800 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isConnected ? (
            <>
              {isCorrectNetwork ? (
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Botchain ({BOTCHAIN_CHAIN_ID})</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => switchToBotchain().catch(() => {})}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Wrong Chain ({chainId ?? "?"}) — Switch to {BOTCHAIN_CHAIN_ID}</span>
                </button>
              )}

              <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-navy-900 px-3 py-1.5 text-xs font-mono text-slate-200">
                <Wallet className="h-3.5 w-3.5 text-brand-400" />
                <span>{shortenHex(address || "", 6, 4)}</span>
              </div>

              <button
                type="button"
                onClick={disconnectWallet}
                title="Disconnect wallet"
                className="rounded-lg border border-slate-700 bg-navy-900 hover:bg-rose-500/15 hover:border-rose-500/40 hover:text-rose-300 p-2 text-slate-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={connectMetaMask}
              disabled={isConnecting}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden rounded-lg border border-slate-800 bg-navy-900 p-2 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-navy-900 px-4 pt-3 pb-5 space-y-3">
          <div className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive
                      ? "bg-brand-600/20 text-brand-400 border border-brand-500/30"
                      : "text-slate-300 hover:bg-navy-800"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            {isConnected ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 bg-navy-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-mono">{shortenHex(address || "", 8, 6)}</span>
                  <span
                    className={
                      isCorrectNetwork ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"
                    }
                  >
                    Chain ID: {chainId ?? "Unknown"}
                  </span>
                </div>
                {!isCorrectNetwork && (
                  <button
                    type="button"
                    onClick={() => switchToBotchain().catch(() => {})}
                    className="w-full rounded-lg bg-amber-500/20 border border-amber-500/40 py-2 text-xs font-semibold text-amber-300"
                  >
                    Switch to Botchain Testnet ({BOTCHAIN_CHAIN_ID})
                  </button>
                )}
                <button
                  type="button"
                  onClick={disconnectWallet}
                  className="w-full rounded-lg border border-slate-700 bg-navy-800 py-2 text-xs font-medium text-slate-300"
                >
                  Disconnect Wallet
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={connectMetaMask}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-navy-950 py-10 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800/80">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/20 border border-brand-500/40 text-brand-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-base font-bold text-white">HashProof</span>
              <span className="text-xs text-slate-500">| Verify. Trust. Protect.</span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Decentralized SHA-256 file integrity registry powered by Botchain Testnet (Chain ID{" "}
              {BOTCHAIN_CHAIN_ID}). Files are hashed locally in your browser using the Web Crypto API and are never uploaded to any server or blockchain.
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Platform Navigation
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/verify" className="hover:text-brand-400 transition-colors">
                  Public File Verification
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-brand-400 transition-colors">
                  Register File Fingerprint
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-brand-400 transition-colors">
                  Personal Dashboard
                </Link>
              </li>
              <li>
                <Link to="/my-files" className="hover:text-brand-400 transition-colors">
                  My Registered Files
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Botchain Testnet Specs
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                Chain ID: <span className="font-mono text-slate-200">{BOTCHAIN_CHAIN_ID}</span>
              </li>
              <li>
                Native Token:{" "}
                <span className="font-mono text-slate-200">
                  {BOTCHAIN_NETWORK_METADATA.nativeCurrency.symbol}
                </span>
              </li>
              <li>
                RPC:{" "}
                <span className="font-mono text-slate-200">{BOTCHAIN_NETWORK_METADATA.rpcUrl}</span>
              </li>
              {isValidExplorerConfigured() && (
                <li>
                  <a
                    href={BOTCHAIN_EXPLORER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300"
                  >
                    Block Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} HashProof. Cryptographic proof of file integrity on Botchain Testnet.
          </p>
          <p className="text-right">
            Matching hashes prove byte-for-byte file integrity, not institutional identity or real-world authority.
          </p>
        </div>
      </div>
    </footer>
  );
};

