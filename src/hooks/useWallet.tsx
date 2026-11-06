import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { BOTCHAIN_CHAIN_ID } from "../config/network";
import {
  getInjectedEthereum,
  parseBlockchainError,
  switchOrAddBotchainNetwork,
} from "../services/blockchain";

interface WalletContextValue {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  walletError: string | null;
  connectMetaMask: () => Promise<void>;
  openWalletModal: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchToBotchain: () => Promise<void>;
  clearWalletError: () => void;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const DISCONNECTED_FLAG_KEY = "hashproof_wallet_disconnected";

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address: wagmiAddress, chainId: wagmiChainId, isConnected: wagmiConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { open } = useAppKit();

  const [directAddress, setDirectAddress] = useState<string | null>(null);
  const [directChainId, setDirectChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const syncInjectedState = useCallback(async () => {
    const ethereum = getInjectedEthereum();
    if (!ethereum) return;
    if (window.sessionStorage.getItem(DISCONNECTED_FLAG_KEY) === "true") return;

    try {
      const provider = new ethers.BrowserProvider(ethereum);
      const accounts = (await ethereum.request({ method: "eth_accounts" })) as string[];
      if (accounts && accounts.length > 0) {
        setDirectAddress(ethers.getAddress(accounts[0]));
        const net = await provider.getNetwork();
        setDirectChainId(Number(net.chainId));
      } else {
        setDirectAddress(null);
      }
    } catch {
      // Ignore silent check errors
    }
  }, []);

  useEffect(() => {
    syncInjectedState();

    const ethereum = getInjectedEthereum();
    if (!ethereum?.on) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const list = accounts as string[];
      if (!list || list.length === 0) {
        setDirectAddress(null);
      } else {
        window.sessionStorage.removeItem(DISCONNECTED_FLAG_KEY);
        setDirectAddress(ethers.getAddress(list[0]));
      }
    };

    const handleChainChanged = (hexChainId: unknown) => {
      if (typeof hexChainId === "string") {
        setDirectChainId(parseInt(hexChainId, 16));
      } else {
        syncInjectedState();
      }
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [syncInjectedState]);

  const activeAddress = wagmiConnected && wagmiAddress ? wagmiAddress : directAddress;
  const activeChainId = wagmiConnected && wagmiChainId ? wagmiChainId : directChainId;
  const isConnected = Boolean(activeAddress);
  const isCorrectNetwork = isConnected && activeChainId === BOTCHAIN_CHAIN_ID;

  const connectMetaMask = useCallback(async () => {
    setWalletError(null);
    setIsConnecting(true);
    try {
      window.sessionStorage.removeItem(DISCONNECTED_FLAG_KEY);
      const ethereum = getInjectedEthereum();
      if (ethereum) {
        const accounts = (await ethereum.request({
          method: "eth_requestAccounts",
        })) as string[];

        if (accounts && accounts.length > 0) {
          setDirectAddress(ethers.getAddress(accounts[0]));
          const provider = new ethers.BrowserProvider(ethereum);
          const net = await provider.getNetwork();
          setDirectChainId(Number(net.chainId));
          return;
        }
      }
      // If no window.ethereum, open Reown AppKit modal
      await open();
    } catch (err) {
      setWalletError(parseBlockchainError(err));
    } finally {
      setIsConnecting(false);
    }
  }, [open]);

  const openWalletModal = useCallback(async () => {
    setWalletError(null);
    try {
      window.sessionStorage.removeItem(DISCONNECTED_FLAG_KEY);
      await open();
    } catch (err) {
      setWalletError(parseBlockchainError(err));
    }
  }, [open]);

  const disconnectWallet = useCallback(async () => {
    setWalletError(null);
    window.sessionStorage.setItem(DISCONNECTED_FLAG_KEY, "true");
    setDirectAddress(null);
    setDirectChainId(null);
    try {
      if (wagmiConnected) {
        await disconnectAsync();
      }
    } catch {
      // Ignore disconnect errors
    }
  }, [disconnectAsync, wagmiConnected]);

  const switchToBotchain = useCallback(async () => {
    setWalletError(null);
    try {
      const ethereum = getInjectedEthereum();
      if (ethereum) {
        await switchOrAddBotchainNetwork();
        const provider = new ethers.BrowserProvider(ethereum);
        const net = await provider.getNetwork();
        setDirectChainId(Number(net.chainId));
        return;
      }
      if (switchChainAsync) {
        await switchChainAsync({ chainId: BOTCHAIN_CHAIN_ID });
      }
    } catch (err) {
      setWalletError(parseBlockchainError(err));
      throw err;
    }
  }, [switchChainAsync]);

  const clearWalletError = useCallback(() => setWalletError(null), []);

  return (
    <WalletContext.Provider
      value={{
        address: activeAddress,
        chainId: activeChainId,
        isConnected,
        isCorrectNetwork,
        isConnecting,
        walletError,
        connectMetaMask,
        openWalletModal,
        disconnectWallet,
        switchToBotchain,
        clearWalletError,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return ctx;
}
