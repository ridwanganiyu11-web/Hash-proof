# HashProof — Verify. Trust. Protect.

**HashProof** is a decentralized, public blockchain-powered file integrity verification platform built for **Botchain Testnet (Chain ID 968)**.

Users generate a cryptographic SHA-256 fingerprint of any file locally in their browser and anchor it permanently on-chain via the lightweight `HashProofRegistry` smart contract. Anyone can later verify whether a file's contents match its registered on-chain fingerprint **without connecting a wallet**.

---

## 1. What HashProof Does

- **100% Local Browser Hashing**: Uses the native Web Crypto API (`crypto.subtle.digest("SHA-256", fileBytes)`) to hash raw file bytes directly in browser memory.
- **Zero File Uploads**: Actual documents, PDFs, images, or archives are **never** uploaded to the blockchain or any external server. Only the 32-byte (`bytes32`) SHA-256 fingerprint is stored on-chain.
- **Immutable On-Chain Proof**: Records the `bytes32` file hash, the registering wallet's `address`, and the `uint64` block timestamp in a single packed 32-byte EVM storage slot.
- **Wallet-Free Public Verification**: Anyone can upload a file on `/verify` or open a shared verification link (`/verify/0xFILE_HASH`) to verify byte-for-byte file integrity directly against Botchain Testnet RPC without needing MetaMask.
- **Offline QR Code & Link Sharing**: Every registered file hash generates a downloadable PNG QR code locally in the browser that links directly to its public verification page.
- **Personal Wallet Dashboard & Paginated History**: Connected wallets can view their total registered files and browse their registration history via gas-safe paginated contract queries (`getMyFileHashes`).

---

## 2. How File Hashing, Registration & Public Verification Work

### Local SHA-256 File Hashing
1. When a user drops or selects a file, the browser reads its raw binary buffer (`await file.arrayBuffer()`).
2. `crypto.subtle.digest("SHA-256", fileBytes)` computes the 256-bit (32-byte) digest of the exact file contents — **not** the filename or file metadata.
3. Even a single altered bit or character in the file produces a completely different 32-byte SHA-256 hash.

### Blockchain Registration (`registerFile`)
1. The user connects their wallet (MetaMask / Reown AppKit) and switches to **Botchain Testnet (Chain ID 968)**.
2. The frontend checks `getFileRecord(fileHash)` first to prevent accidental duplicate transaction submissions.
3. The user signs and submits `registerFile(bytes32 fileHash)`.
4. The contract verifies `fileHash != bytes32(0)` and that the hash has not already been registered, stores `{ owner: msg.sender, timestamp: uint64(block.timestamp) }`, appends the hash to the sender's address index, and emits `FileRegistered(fileHash, msg.sender, timestamp)`.

### Public Verification (`isRegistered` & `getFileRecord`)
1. Any visitor (with or without a wallet) drops a file onto the **Public Verify** page or visits `/verify/0xFILE_HASH`.
2. The frontend computes the SHA-256 hash locally and queries `getFileRecord(fileHash)` using a read-only `ethers.JsonRpcProvider` connected to `https://rpc.bohr.life`.
3. If `exists == true`, the UI displays **SUCCESS — FILE MATCHES** along with the registering wallet address, block timestamp, contract address, and QR proof. If `exists == false`, it displays **NOT REGISTERED — NO MATCH FOUND**.

---

## 3. Gas Efficiency & Actual Measured Contract Costs

`contracts/HashProofRegistry.sol` is compiled with Solidity `0.8.24` and the optimizer enabled (`runs: 200`).

- **Single-Slot Struct Packing**: `FileRecord` packs `address owner` (20 bytes) and `uint64 timestamp` (8 bytes) into **28 bytes**, fitting inside a single 32-byte EVM storage slot (`SSTORE`).
- **Custom Errors**: Uses `InvalidFileHash()` and `HashAlreadyRegistered(...)` instead of expensive revert strings.
- **No Unbounded Loops**: `getMyFileHashes(address user, uint256 offset, uint256 limit)` uses bounded pagination.

**Measured Gas Report (from `npx hardhat test` with `hardhat-gas-reporter`):**
- **`HashProofRegistry` Contract Deployment**: `354,820 gas` (0.6% of block limit)
- **`registerFile(bytes32)` Transaction**:
  - First registration for a wallet (cold array length slot): `90,687 gas`
  - Subsequent registrations for a wallet (warm array length slot): `73,587 gas`
  - Average across test suite: `86,616 gas`
- **`isRegistered`, `getFileRecord`, `getMyFileCount`, `getMyFileHashes`**: `0 gas` (free read-only `view` calls)

---

## 4. Botchain Testnet Network Configuration

| Parameter | Value |
| :--- | :--- |
| **Network Name** | Botchain Testnet |
| **Chain ID** | `968` (`0x3c8`) |
| **RPC URL** | `https://rpc.bohr.life` |
| **Native Token** | `BOT` (18 decimals, Total Supply: 150 Million) |
| **Block Explorer** | `https://scan.bohr.life/` |

---

## 5. Installation, Compilation, Testing & Deployment

### Step 1: Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` and configure:
- `DEPLOYER_PRIVATE_KEY`: Your dedicated **Botchain Testnet** wallet private key funded with testnet `BOT` (never use a mainnet key).
- `BOTCHAIN_RPC_URL`: `https://rpc.bohr.life`
- `VITE_CONTRACT_ADDRESS`: Populated automatically upon deployment or set manually if already deployed.
- `VITE_BOTCHAIN_RPC_URL`: `https://rpc.bohr.life`
- `VITE_BOTCHAIN_EXPLORER_URL`: `https://scan.bohr.life`
- `VITE_REOWN_PROJECT_ID`: Optional Reown AppKit Project ID from `https://cloud.reown.com`.

### Step 3: Compile Smart Contract
```bash
npx hardhat compile
```

### Step 4: Run Automated Tests
Run the Hardhat smart contract test suite:
```bash
npx hardhat test
```
Run the frontend unit test suite (SHA-256 hashing, hash format validation, error parsing, URL builders):
```bash
npm run test:frontend
```

### Step 5: Deploy to Botchain Testnet (Chain ID 968)
Ensure your `.env` has a funded `DEPLOYER_PRIVATE_KEY` on Botchain Testnet (Chain ID 968), then run:
```bash
npx hardhat run scripts/deploy.ts --network botchain
```
The deployment script will:
1. Verify that the connected RPC returns Chain ID `968` (refusing deployment otherwise).
2. Check that your deployer wallet has a non-zero `BOT` balance.
3. Deploy `HashProofRegistry` and wait for on-chain confirmation.
4. Print the deployed contract address, network, Chain ID, and deployment transaction hash.
5. Automatically save the deployment metadata to `deployments/botchain.json` and `src/config/deployment.json` so the frontend immediately uses the deployed contract address.

*(Note: You can also paste or switch any deployed `HashProofRegistry` contract address directly in the frontend UI banner at any time.)*

### Step 6: Run Frontend Locally & Build for Production
Start the local Vite development server:
```bash
npm run dev
```
Build the production bundle:
```bash
npm run build
```
Preview the production build locally:
```bash
npm run preview
```

---

## 6. Security & Privacy Limitations

1. **Files Never Leave Your Browser**: HashProof hashes raw file bytes locally in your browser using `crypto.subtle.digest("SHA-256", fileBytes)`. The contract only stores the 32-byte SHA-256 digest, registering wallet address, and timestamp.
2. **Integrity vs. Institutional Authenticity**: A matching SHA-256 hash cryptographically proves that the uploaded file's contents are byte-for-byte identical to the file registered at that timestamp by that wallet address. It does **not** by itself prove that the document was originally issued by a specific real-world organization unless you independently verify that the registering wallet address belongs to that organization.
3. **Permanent Records**: `HashProofRegistry` has no admin keys, no update function, and no delete function. Once a file fingerprint is anchored on Botchain Testnet, the record is permanent.

