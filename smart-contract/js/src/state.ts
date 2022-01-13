import { deserialize, Schema } from "borsh";
import BN from "bn.js";
import { Connection, PublicKey } from "@solana/web3.js";
import { u64 } from "./u64";

const STAKE_BUFFER_LEN = 365;

export enum Tag {
  Uninitialized = 0,
  StakePool = 1,
  StakeAccount = 2,
  // Bond accounts are inactive until the buyer transfered the funds
  InactiveBondAccount = 3,
  BondAccount = 4,
  CentralState = 5,
  Deleted = 6,
}

export class StakePool {
  tag: Tag;
  nonce: number;
  currentDayIdx: number;
  _padding: Uint8Array;
  minimumStakeAmount: BN;
  totalStaked: BN;
  lastCrankTime: BN;
  lastClaimedTime: BN;
  owner: PublicKey;
  rewardsDestination: PublicKey;
  vault: PublicKey;

  balances: BN[];

  static schema: Schema = new Map([
    [
      StakePool,
      {
        kind: "struct",
        fields: [
          ["tag", "u8"],
          ["nonce", "u8"],
          ["currentDayIdx", "u16"],
          ["_padding", [4]],
          ["minimumStakeAmount", "u64"],
          ["totalStaked", "u64"],
          ["lastCrankTime", "u64"],
          ["lastClaimedTime", "u64"],
          ["owner", [32]],
          ["rewardsDestination", [32]],
          ["vault", [32]],
          ["balances", ["u128", STAKE_BUFFER_LEN]],
        ],
      },
    ],
  ]);

  constructor(obj: {
    tag: number;
    nonce: number;
    currentDayIdx: number;
    _padding: Uint8Array;
    minimumStakeAmount: BN;
    totalStaked: BN;
    lastCrankTime: BN;
    lastClaimed: BN;
    owner: Uint8Array;
    rewardsDestination: Uint8Array;
    vault: Uint8Array;
    balances: BN[];
  }) {
    this.tag = obj.tag as Tag;
    this.nonce = obj.nonce;
    this.currentDayIdx = obj.currentDayIdx;
    this._padding = obj._padding;
    this.minimumStakeAmount = obj.minimumStakeAmount;
    this.totalStaked = obj.totalStaked;
    this.lastCrankTime = obj.lastCrankTime;
    this.lastClaimedTime = obj.lastClaimed;
    this.owner = new PublicKey(obj.owner);
    this.rewardsDestination = new PublicKey(obj.rewardsDestination);
    this.vault = new PublicKey(obj.vault);
    this.balances = obj.balances;
  }

  static deserialize(data: Buffer) {
    return deserialize(this.schema, StakePool, data);
  }

  static async retrieve(connection: Connection, key: PublicKey) {
    const accountInfo = await connection.getAccountInfo(key);
    if (!accountInfo || !accountInfo.data) {
      throw new Error("Stake pool not found");
    }
    return this.deserialize(accountInfo.data);
  }

  static async getKey(
    programId: PublicKey,
    owner: PublicKey,
    destination: PublicKey
  ) {
    return await PublicKey.findProgramAddress(
      [Buffer.from("stake_pool"), owner.toBuffer(), destination.toBuffer()],
      programId
    );
  }
}

export class StakeAccount {
  tag: Tag;
  owner: PublicKey;
  stakeAmount: BN;
  stakePool: PublicKey;
  lastClaimedTime: BN;
  poolMinimumAtCreation: BN;

  static schema: Schema = new Map([
    [
      StakeAccount,
      {
        kind: "struct",
        fields: [
          ["tag", "u8"],
          ["owner", [32]],
          ["stakeAmount", "u64"],
          ["stakePool", [32]],
          ["lastClaimedTime", "u64"],
          ["poolMinimumAtCreation", "u64"],
        ],
      },
    ],
  ]);

  constructor(obj: {
    tag: number;
    owner: Uint8Array;
    stakeAmount: BN;
    stakePool: Uint8Array;
    lastClaimedTime: BN;
    poolMinimumAtCreation: BN;
  }) {
    this.tag = obj.tag;
    this.owner = new PublicKey(obj.owner);
    this.stakeAmount = obj.stakeAmount;
    this.stakePool = new PublicKey(obj.stakePool);
    this.lastClaimedTime = obj.lastClaimedTime;
    this.poolMinimumAtCreation = obj.poolMinimumAtCreation;
  }

  static deserialize(data: Buffer) {
    return deserialize(this.schema, StakeAccount, data);
  }

  static async retrieve(connection: Connection, key: PublicKey) {
    const accountInfo = await connection.getAccountInfo(key);
    if (!accountInfo || !accountInfo.data) {
      throw new Error("Stake account not found");
    }
    return this.deserialize(accountInfo.data);
  }

  static async getKey(
    programId: PublicKey,
    owner: PublicKey,
    stakePool: PublicKey
  ) {
    return await PublicKey.findProgramAddress(
      [Buffer.from("stake_account"), owner.toBuffer(), stakePool.toBuffer()],
      programId
    );
  }
}

export class CentralState {
  tag: Tag;
  signerNonce: number;
  dailyInflation: BN;
  tokenMint: PublicKey;
  authority: PublicKey;

  static schema: Schema = new Map([
    [
      CentralState,
      {
        kind: "struct",
        fields: [
          ["tag", "u8"],
          ["signerNonce", "u8"],
          ["dailyInflation", "u64"],
          ["tokenMint", [32]],
          ["authority", [32]],
        ],
      },
    ],
  ]);

  constructor(obj: {
    tag: number;
    signerNonce: number;
    dailyInflation: BN;
    tokenMint: Uint8Array;
    authority: Uint8Array;
  }) {
    this.tag = obj.tag as Tag;
    this.signerNonce = obj.signerNonce;
    this.dailyInflation = obj.dailyInflation;
    this.tokenMint = new PublicKey(obj.tokenMint);
    this.authority = new PublicKey(obj.authority);
  }

  static deserialize(data: Buffer) {
    return deserialize(this.schema, CentralState, data);
  }

  static async retrieve(connection: Connection, key: PublicKey) {
    const accountInfo = await connection.getAccountInfo(key);
    if (!accountInfo || !accountInfo.data) {
      throw new Error("Central state not found");
    }
    return this.deserialize(accountInfo.data);
  }
  static async getKey(programId: PublicKey) {
    return await PublicKey.findProgramAddress(
      [programId.toBuffer()],
      programId
    );
  }
}

export class BondAccount {
  tag: Tag;
  owner: PublicKey;
  totalAmountSold: BN;
  totalStaked: BN;
  totalQuoteAmount: BN;
  quoteMint: PublicKey;
  sellerTokenAccount: PublicKey;
  unlockStartDate: BN;
  unlockPeriod: BN;
  lastUnlockTime: BN;
  totalUnlockedAmount: BN;
  poolMinimumAtCreation: BN;
  stakePool: PublicKey;
  lastClaimedTime: BN;
  sellers: PublicKey[];

  static schema: Schema = new Map([
    [
      BondAccount,
      {
        kind: "struct",
        fields: [
          ["tag", "u8"],
          ["owner", [32]],
          ["totalAmountSold", "u64"],
          ["totalStaked", "u64"],
          ["totalQuoteAmount", "u64"],
          ["quoteMint", [32]],
          ["sellerTokenAccount", [32]],
          ["unlockStartDate", "u64"],
          ["unlockPeriod", "u64"],
          ["lastUnlockTime", "u64"],
          ["totalUnlockedAmount", "u64"],
          ["poolMinimumAtCreation", "u64"],
          ["stakePool", [32]],
          ["lastClaimedTime", "u64"],
          ["sellers", [[32]]],
        ],
      },
    ],
  ]);

  constructor(obj: {
    tag: number;
    owner: Uint8Array;
    totalAmountSold: BN;
    totalStaked: BN;
    totalQuoteAmount: BN;
    quoteMint: Uint8Array;
    sellerTokenAccount: Uint8Array;
    unlockStartDate: BN;
    unlockPeriod: BN;
    lastUnlockTime: BN;
    totalUnlockedAmount: BN;
    poolMinimumAtCreation: BN;
    stakePool: Uint8Array;
    lastClaimedTime: BN;
    sellers: Uint8Array[];
  }) {
    this.tag = obj.tag as Tag;
    this.owner = new PublicKey(obj.owner);
    this.totalAmountSold = obj.totalAmountSold;
    this.totalStaked = obj.totalStaked;
    this.totalQuoteAmount = obj.totalQuoteAmount;
    this.quoteMint = new PublicKey(obj.quoteMint);
    this.sellerTokenAccount = new PublicKey(obj.sellerTokenAccount);
    this.unlockStartDate = obj.unlockStartDate;
    this.unlockPeriod = obj.unlockPeriod;
    this.lastUnlockTime = obj.lastUnlockTime;
    this.totalUnlockedAmount = obj.totalUnlockedAmount;
    this.poolMinimumAtCreation = obj.poolMinimumAtCreation;
    this.stakePool = new PublicKey(obj.stakePool);
    this.lastClaimedTime = obj.lastClaimedTime;
    this.sellers = obj.sellers.map((e) => new PublicKey(e));
  }

  static deserialize(data: Buffer) {
    return deserialize(this.schema, BondAccount, data);
  }

  static async retrieve(connection: Connection, key: PublicKey) {
    const accountInfo = await connection.getAccountInfo(key);
    if (!accountInfo || !accountInfo.data) {
      throw new Error("Bond account not found");
    }
    return this.deserialize(accountInfo.data);
  }

  static async getKey(
    programId: PublicKey,
    owner: PublicKey,
    totalAmountSold: number
  ) {
    return await PublicKey.findProgramAddress(
      [
        Buffer.from("bond_account"),
        owner.toBuffer(),
        new u64(totalAmountSold).toBuffer(),
      ],
      programId
    );
  }
}