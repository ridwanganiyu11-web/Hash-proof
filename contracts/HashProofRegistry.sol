// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title HashProofRegistry
 * @notice Gas-efficient, immutable on-chain file SHA-256 fingerprint registry for Botchain Testnet.
 * @dev Stores only the registering wallet address and 64-bit timestamp packed into a single 32-byte storage slot.
 *      Does not store documents, titles, metadata, or mutable records.
 */
contract HashProofRegistry {
    /// @notice Reverts when attempting to register a zero SHA-256 hash (0x000...000).
    error InvalidFileHash();

    /// @notice Reverts when attempting to register a SHA-256 hash that has already been registered.
    error HashAlreadyRegistered(bytes32 fileHash, address existingOwner, uint64 timestamp);

    /// @notice Packed record fitting inside a single 256-bit (32-byte) EVM storage slot (20 bytes + 8 bytes = 28 bytes).
    struct FileRecord {
        address owner;
        uint64 timestamp;
    }

    /// @dev Mapping from SHA-256 file hash to its permanent registration record.
    mapping(bytes32 => FileRecord) private records;

    /// @dev Mapping from wallet address to the list of file hashes registered by that wallet.
    mapping(address => bytes32[]) private userHashes;

    /// @notice Emitted permanently whenever a new file SHA-256 fingerprint is registered on-chain.
    event FileRegistered(
        bytes32 indexed fileHash,
        address indexed owner,
        uint64 timestamp
    );

    /**
     * @notice Registers a SHA-256 file fingerprint permanently on the blockchain.
     * @param fileHash The 32-byte SHA-256 digest of the file's raw bytes.
     */
    function registerFile(bytes32 fileHash) external {
        if (fileHash == bytes32(0)) {
            revert InvalidFileHash();
        }

        FileRecord memory existing = records[fileHash];
        if (existing.owner != address(0)) {
            revert HashAlreadyRegistered(fileHash, existing.owner, existing.timestamp);
        }

        uint64 currentTimestamp = uint64(block.timestamp);

        records[fileHash] = FileRecord({
            owner: msg.sender,
            timestamp: currentTimestamp
        });

        userHashes[msg.sender].push(fileHash);

        emit FileRegistered(fileHash, msg.sender, currentTimestamp);
    }

    /**
     * @notice Checks whether a SHA-256 file hash has been registered.
     * @param fileHash The 32-byte SHA-256 digest to look up.
     * @return exists True if the hash is registered on-chain, false otherwise.
     */
    function isRegistered(bytes32 fileHash) external view returns (bool exists) {
        return records[fileHash].owner != address(0);
    }

    /**
     * @notice Retrieves the public registration record for a given SHA-256 file hash.
     * @param fileHash The 32-byte SHA-256 digest to look up.
     * @return owner The wallet address that registered the hash (address(0) if unregistered).
     * @return timestamp The Unix block timestamp when the hash was registered (0 if unregistered).
     * @return exists True if the hash has been registered.
     */
    function getFileRecord(bytes32 fileHash)
        external
        view
        returns (
            address owner,
            uint64 timestamp,
            bool exists
        )
    {
        FileRecord memory record = records[fileHash];
        return (record.owner, record.timestamp, record.owner != address(0));
    }

    /**
     * @notice Returns the total number of file hashes registered by a specific wallet.
     * @param user The wallet address to query.
     * @return count Total number of registered hashes for `user`.
     */
    function getMyFileCount(address user) external view returns (uint256 count) {
        return userHashes[user].length;
    }

    /**
     * @notice Returns a paginated list of file hashes registered by a specific wallet.
     * @dev Prevents out-of-range errors and caps unbounded array returns.
     * @param user The wallet address whose registered file hashes are queried.
     * @param offset The starting index in the user's registration array (0-based).
     * @param limit The maximum number of hashes to return.
     * @return hashes Slice of registered `bytes32` file hashes.
     */
    function getMyFileHashes(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory hashes) {
        uint256 total = userHashes[user].length;
        if (offset >= total || limit == 0) {
            return new bytes32[](0);
        }

        uint256 available = total - offset;
        uint256 count = limit < available ? limit : available;

        hashes = new bytes32[](count);
        bytes32[] storage userList = userHashes[user];
        for (uint256 i = 0; i < count; ) {
            hashes[i] = userList[offset + i];
            unchecked {
                ++i;
            }
        }
    }
}

