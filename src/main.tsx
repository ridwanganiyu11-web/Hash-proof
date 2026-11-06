import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initWeb3AppKit, wagmiAdapter } from "./config/web3";
import { WalletProvider } from "./hooks/useWallet";
import App from "./App";
import "./index.css";

initWeb3AppKit();

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <App />
        </WalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);

