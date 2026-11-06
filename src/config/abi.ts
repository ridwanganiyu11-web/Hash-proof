export const HASH_PROOF_REGISTRY_ABI = [
  {
    type: "error",
    name: "HashAlreadyRegistered",
    inputs: [
      { name: "fileHash", type: "bytes32", internalType: "bytes32" },
      { name: "existingOwner", type: "address", internalType: "address" },
      { name: "timestamp", type: "uint64", internalType: "uint64" },
    ],
  },
  {
    type: "error",
    name: "InvalidFileHash",
    inputs: [],
  },
  {
    type: "event",
    name: "FileRegistered",
    anonymous: false,
    inputs: [
      { name: "fileHash", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "owner", type: "address", indexed: true, internalType: "address" },
      { name: "timestamp", type: "uint64", indexed: false, internalType: "uint64" },
    ],
  },
  {
    type: "function",
    name: "getFileRecord",
    stateMutability: "view",
    inputs: [{ name: "fileHash", type: "bytes32", internalType: "bytes32" }],
    outputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "timestamp", type: "uint64", internalType: "uint64" },
      { name: "exists", type: "bool", internalType: "bool" },
    ],
  },
  {
    type: "function",
    name: "getMyFileCount",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "count", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    name: "getMyFileHashes",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "offset", type: "uint256", internalType: "uint256" },
      { name: "limit", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "hashes", type: "bytes32[]", internalType: "bytes32[]" }],
  },
  {
    type: "function",
    name: "isRegistered",
    stateMutability: "view",
    inputs: [{ name: "fileHash", type: "bytes32", internalType: "bytes32" }],
    outputs: [{ name: "exists", type: "bool", internalType: "bool" }],
  },
  {
    type: "function",
    name: "registerFile",
    stateMutability: "nonpayable",
    inputs: [{ name: "fileHash", type: "bytes32", internalType: "bytes32" }],
    outputs: [],
  },
] as const;

