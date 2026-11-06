import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const EXPECTED_CHAIN_ID = 968n;

async function main() {
  console.log("=========================================================");
  console.log("  HashProof — Botchain Testnet Deployment Script");
  console.log("=========================================================");

  const providerNetwork = await ethers.provider.getNetwork();
  const chainId = providerNetwork.chainId;

  console.log(`Connected Network : ${network.name}`);
  console.log(`Detected Chain ID : ${chainId.toString()}`);

  if (chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(
      `Deployment aborted: Expected Botchain Testnet Chain ID ${EXPECTED_CHAIN_ID.toString()}, but connected RPC returned Chain ID ${chainId.toString()}.`
    );
  }

  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error(
      "Deployment aborted: No deployer wallet configured. Set DEPLOYER_PRIVATE_KEY in your .env file with a funded Botchain Testnet wallet."
    );
  }

  const deployer = signers[0];
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log(`Deployer Address  : ${deployerAddress}`);
  console.log(`Deployer Balance  : ${ethers.formatEther(balance)} BOT`);

  if (balance === 0n) {
    throw new Error(
      `Deployment aborted: Deployer wallet ${deployerAddress} has 0 BOT on Botchain Testnet (Chain ID 968). Fund this wallet with testnet BOT before deploying.`
    );
  }

  console.log("\nDeploying HashProofRegistry...");
  const HashProofRegistryFactory = await ethers.getContractFactory("HashProofRegistry");
  const contract = await HashProofRegistryFactory.deploy();

  const deployTx = contract.deploymentTransaction();
  if (!deployTx) {
    throw new Error("Deployment transaction could not be retrieved.");
  }

  console.log(`Deployment Tx Hash: ${deployTx.hash}`);
  console.log("Waiting for block confirmation...");

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("\n=========================================================");
  console.log("  HashProofRegistry Deployed Successfully!");
  console.log("=========================================================");
  console.log(`Contract Address  : ${contractAddress}`);
  console.log(`Network Name      : ${network.name}`);
  console.log(`Chain ID          : ${chainId.toString()}`);
  console.log(`Transaction Hash  : ${deployTx.hash}`);
  console.log(`Explorer Link     : https://scan.bohr.life/address/${contractAddress}`);
  console.log("=========================================================\n");

  const deploymentInfo = {
    contractName: "HashProofRegistry",
    contractAddress,
    network: network.name,
    chainId: Number(chainId),
    deploymentTxHash: deployTx.hash,
    deployer: deployerAddress,
    deployedAt: new Date().toISOString(),
    rpcUrl: "https://rpc.bohr.life",
    explorerUrl: "https://scan.bohr.life",
  };

  // Save to deployments/botchain.json
  const deploymentsDir = path.resolve(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  const deploymentFilePath = path.join(deploymentsDir, "botchain.json");
  fs.writeFileSync(deploymentFilePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Saved deployment artifact to: ${deploymentFilePath}`);

  // Also save to src/config/deployment.json so the frontend automatically picks up the deployed contract
  const frontendConfigDir = path.resolve(__dirname, "..", "src", "config");
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }
  const frontendDeploymentPath = path.join(frontendConfigDir, "deployment.json");
  fs.writeFileSync(frontendDeploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Updated frontend config at  : ${frontendDeploymentPath}`);
}

main().catch((error) => {
  console.error("\n[ERROR] Deployment failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

