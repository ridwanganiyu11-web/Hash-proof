import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { Contract } from "ethers";

describe("HashProofRegistry", function () {
  let registry: Contract;
  let owner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let alice: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let bob: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let anonymousReader: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  const SAMPLE_HASH_1 = ethers.keccak256(ethers.toUtf8Bytes("document-1-raw-bytes"));
  const SAMPLE_HASH_2 = ethers.keccak256(ethers.toUtf8Bytes("document-2-raw-bytes"));
  const SAMPLE_HASH_3 = ethers.keccak256(ethers.toUtf8Bytes("document-3-raw-bytes"));
  const ZERO_HASH = ethers.ZeroHash;

  beforeEach(async function () {
    [owner, alice, bob, anonymousReader] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("HashProofRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();
  });

  describe("1. Deployment", function () {
    it("deploys successfully with a valid contract address and empty initial state", async function () {
      const address = await registry.getAddress();
      expect(ethers.isAddress(address)).to.be.true;
      expect(address).to.not.equal(ethers.ZeroAddress);
      expect(await registry.isRegistered(SAMPLE_HASH_1)).to.be.false;
      expect(await registry.getMyFileCount(alice.address)).to.equal(0n);
    });
  });

  describe("2-4. File Hash Registration, Owner Storage & Timestamp Storage", function () {
    it("registers a valid non-zero SHA-256 hash and stores the caller as owner with block timestamp", async function () {
      const tx = await registry.connect(alice).registerFile(SAMPLE_HASH_1);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      const [recordedOwner, recordedTimestamp, exists] = await registry.getFileRecord(SAMPLE_HASH_1);
      expect(exists).to.be.true;
      expect(recordedOwner).to.equal(alice.address);
      expect(recordedTimestamp).to.equal(BigInt(block!.timestamp));
    });
  });

  describe("5-7. Public Lookups (isRegistered & getFileRecord)", function () {
    it("returns true for registered hashes and false for unregistered hashes via isRegistered", async function () {
      expect(await registry.isRegistered(SAMPLE_HASH_1)).to.be.false;
      await registry.connect(alice).registerFile(SAMPLE_HASH_1);
      expect(await registry.isRegistered(SAMPLE_HASH_1)).to.be.true;
      expect(await registry.isRegistered(SAMPLE_HASH_2)).to.be.false;
    });

    it("returns complete record details via getFileRecord and empty defaults for unregistered hashes", async function () {
      const [unregOwner, unregTime, unregExists] = await registry.getFileRecord(SAMPLE_HASH_1);
      expect(unregOwner).to.equal(ethers.ZeroAddress);
      expect(unregTime).to.equal(0n);
      expect(unregExists).to.be.false;

      await registry.connect(alice).registerFile(SAMPLE_HASH_1);
      const [regOwner, regTime, regExists] = await registry.getFileRecord(SAMPLE_HASH_1);
      expect(regOwner).to.equal(alice.address);
      expect(regTime).to.be.greaterThan(0n);
      expect(regExists).to.be.true;
    });

    it("allows any account or read-only provider to read a registered record", async function () {
      await registry.connect(alice).registerFile(SAMPLE_HASH_1);

      const [recordOwner, , exists] = await registry
        .connect(anonymousReader)
        .getFileRecord(SAMPLE_HASH_1);
      expect(exists).to.be.true;
      expect(recordOwner).to.equal(alice.address);
      expect(await registry.connect(anonymousReader).isRegistered(SAMPLE_HASH_1)).to.be.true;
    });
  });

  describe("8-9. Validation & Reverts (Duplicate & Zero Hash)", function () {
    it("reverts when attempting to register a duplicate hash from the same or different wallet", async function () {
      const tx = await registry.connect(alice).registerFile(SAMPLE_HASH_1);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(registry.connect(alice).registerFile(SAMPLE_HASH_1))
        .to.be.revertedWithCustomError(registry, "HashAlreadyRegistered")
        .withArgs(SAMPLE_HASH_1, alice.address, block!.timestamp);

      await expect(registry.connect(bob).registerFile(SAMPLE_HASH_1))
        .to.be.revertedWithCustomError(registry, "HashAlreadyRegistered")
        .withArgs(SAMPLE_HASH_1, alice.address, block!.timestamp);
    });

    it("reverts when attempting to register the zero hash (0x000...000)", async function () {
      await expect(
        registry.connect(alice).registerFile(ZERO_HASH)
      ).to.be.revertedWithCustomError(registry, "InvalidFileHash");
    });
  });

  describe("10-12. Wallet File Count, Pagination & Multi-Wallet Isolation", function () {
    it("accurately tracks wallet file counts across multiple registrations", async function () {
      expect(await registry.getMyFileCount(alice.address)).to.equal(0n);

      await registry.connect(alice).registerFile(SAMPLE_HASH_1);
      expect(await registry.getMyFileCount(alice.address)).to.equal(1n);

      await registry.connect(alice).registerFile(SAMPLE_HASH_2);
      expect(await registry.getMyFileCount(alice.address)).to.equal(2n);

      expect(await registry.getMyFileCount(bob.address)).to.equal(0n);
    });

    it("retrieves paginated wallet file hashes safely without out-of-range errors", async function () {
      const hashes: string[] = [];
      for (let i = 0; i < 5; i++) {
        const h = ethers.keccak256(ethers.toUtf8Bytes(`alice-file-${i}`));
        hashes.push(h);
        await registry.connect(alice).registerFile(h);
      }

      // First page of 2
      const page1 = await registry.getMyFileHashes(alice.address, 0, 2);
      expect(page1).to.deep.equal([hashes[0], hashes[1]]);

      // Second page of 2
      const page2 = await registry.getMyFileHashes(alice.address, 2, 2);
      expect(page2).to.deep.equal([hashes[2], hashes[3]]);

      // Third page requesting 2 when only 1 remains
      const page3 = await registry.getMyFileHashes(alice.address, 4, 2);
      expect(page3).to.deep.equal([hashes[4]]);

      // Offset >= total returns empty array instead of reverting
      const outOfBounds = await registry.getMyFileHashes(alice.address, 10, 5);
      expect(outOfBounds).to.deep.equal([]);

      // Limit == 0 returns empty array
      const zeroLimit = await registry.getMyFileHashes(alice.address, 0, 0);
      expect(zeroLimit).to.deep.equal([]);
    });

    it("allows different wallets to register different hashes independently", async function () {
      await registry.connect(alice).registerFile(SAMPLE_HASH_1);
      await registry.connect(bob).registerFile(SAMPLE_HASH_2);
      await registry.connect(owner).registerFile(SAMPLE_HASH_3);

      expect(await registry.getMyFileCount(alice.address)).to.equal(1n);
      expect(await registry.getMyFileCount(bob.address)).to.equal(1n);
      expect(await registry.getMyFileCount(owner.address)).to.equal(1n);

      expect(await registry.getMyFileHashes(alice.address, 0, 10)).to.deep.equal([SAMPLE_HASH_1]);
      expect(await registry.getMyFileHashes(bob.address, 0, 10)).to.deep.equal([SAMPLE_HASH_2]);
      expect(await registry.getMyFileHashes(owner.address, 0, 10)).to.deep.equal([SAMPLE_HASH_3]);
    });
  });

  describe("13-14. Event Emission & Record Permanence", function () {
    it("emits FileRegistered event with indexed fileHash, indexed owner, and timestamp", async function () {
      const nextTime = (await time.latest()) + 100;
      await time.setNextBlockTimestamp(nextTime);

      await expect(registry.connect(alice).registerFile(SAMPLE_HASH_1))
        .to.emit(registry, "FileRegistered")
        .withArgs(SAMPLE_HASH_1, alice.address, nextTime);
    });

    it("ensures records remain permanent and exposes no delete, update, or admin functions", async function () {
      await registry.connect(alice).registerFile(SAMPLE_HASH_1);
      const [initialOwner, initialTimestamp, initialExists] = await registry.getFileRecord(SAMPLE_HASH_1);

      // Advance time and register other files
      await time.increase(86400 * 365);
      await registry.connect(bob).registerFile(SAMPLE_HASH_2);

      const [laterOwner, laterTimestamp, laterExists] = await registry.getFileRecord(SAMPLE_HASH_1);
      expect(laterExists).to.equal(initialExists);
      expect(laterOwner).to.equal(initialOwner);
      expect(laterTimestamp).to.equal(initialTimestamp);

      // Verify ABI contains only the 5 expected read/write functions
      const functionNames = registry.interface.fragments
        .filter((f) => f.type === "function")
        .map((f) => (f as { name: string }).name)
        .sort();

      expect(functionNames).to.deep.equal([
        "getFileRecord",
        "getMyFileCount",
        "getMyFileHashes",
        "isRegistered",
        "registerFile",
      ]);
    });
  });
});
