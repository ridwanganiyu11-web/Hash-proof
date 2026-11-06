import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { botchainTestnet } from "./network";

const envProjectId =
  typeof import.meta !== "undefined" && import.meta.env
    ? (import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined)
    : undefined;

// Use configured Project ID or public development fallback ID so AppKit initializes cleanly
export const REOWN_PROJECT_ID =
  (envProjectId && envProjectId.trim()) || "b56e18d47c72ab683b10814fe9495694";

export const networks = [botchainTestnet] as [typeof botchainTestnet];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: REOWN_PROJECT_ID,
  ssr: false,
});

let appKitInitialized = false;

export function initWeb3AppKit() {
  if (appKitInitialized || typeof window === "undefined") return;
  try {
    createAppKit({
      adapters: [wagmiAdapter],
      networks,
      defaultNetwork: botchainTestnet,
      projectId: REOWN_PROJECT_ID,
      metadata: {
        name: "HashProof",
        description: "Verify. Trust. Protect. — Public Blockchain File Integrity Platform on Botchain Testnet",
        url: window.location.origin,
        icons: [`${window.location.origin}/favicon.svg`],
      },
      features: {
        analytics: false,
        email: false,
        socials: false,
      },
      themeMode: "dark",
      themeVariables: {
        "--w3m-accent": "#3b82f6",
        "--w3m-border-radius-master": "2px",
      },
    });
    appKitInitialized = true;
  } catch (err) {
    console.warn("Reown AppKit initialization warning:", err);
  }
}

