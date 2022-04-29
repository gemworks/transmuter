import {
  MutationConfig,
  MutationWrapper,
  RequiredUnits,
  TakerTokenConfig,
  TransmuterWrapper,
  VaultAction,
} from "../src";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { expectTX } from "@saberhq/chai-solana";
import {
  GEM_BANK_PROG_ID,
  GemBankClient,
  isKp,
  stringifyPKsAndBNs,
  toBN,
} from "@gemworks/gem-farm-ts";
import { BN } from "@project-serum/anchor";
import { makeSDK } from "./workspace";
import { getATAAddress } from "@saberhq/token-utils";
import { expect } from "chai";

const bankIdl = require("./programs/gem_bank.json");

export class MutationTester {
  // --------------------------------------- state & constructor

  transmuter: TransmuterWrapper;
  mutation: MutationWrapper;

  // maker
  makerMintA: PublicKey;
  makerMintB?: PublicKey;
  makerMintC?: PublicKey;

  // taker
  takerMintA: PublicKey;
  takerAccA: PublicKey;
  takerVaultA: PublicKey;

  takerMintB: PublicKey;
  takerAccB: PublicKey;
  takerVaultB: PublicKey;

  takerMintC: PublicKey;
  takerAccC: PublicKey;
  takerVaultC: PublicKey;

  // amounts & uses
  uses: BN = toBN(1);

  constructor(
    readonly taker = Keypair.generate(),
    readonly sdk = makeSDK(),
    readonly conn = sdk.provider.connection,
    readonly maker = sdk.provider.wallet.publicKey,
    readonly makerTokenAmountPerUse = toBN(10),
    readonly takerTokenAmountPerUse = toBN(10),
    readonly gb = new GemBankClient(
      sdk.provider.connection,
      sdk.provider.wallet as any,
      bankIdl,
      GEM_BANK_PROG_ID
    )
  ) {}

  get makerTokenAmount() {
    return this.makerTokenAmountPerUse.mul(this.uses);
  }

  get takerTokenAmount() {
    return this.takerTokenAmountPerUse.mul(this.uses);
  }

  // --------------------------------------- ix call wrappers

  prepareTransmuter = async () => {
    const { transmuterWrapper, tx } = await this.sdk.initTransmuter();
    await expectTX(tx, "init new transmuter").to.be.fulfilled;
    this.transmuter = transmuterWrapper;

    console.log("transmuter ready");
  };

  prepareMutation = async ({
    vaultAction = VaultAction.Lock,
    mutationDurationSec = toBN(0),
    takerTokenB = null,
    takerTokenC = null,
    makerTokenBAmountPerUse = null,
    makerTokenCAmountPerUse = null,
    reversible = false,
    uses = toBN(1),
    mutationInitError = undefined,
    reversalPriceLamports = toBN(0.1 * LAMPORTS_PER_SOL),
    name = "mutation123",
  }: {
    vaultAction?: any;
    mutationDurationSec?: BN;
    takerTokenB?: TakerTokenConfig;
    takerTokenC?: TakerTokenConfig;
    makerTokenBAmountPerUse?: BN;
    makerTokenCAmountPerUse?: BN;
    reversible?: boolean;
    uses?: BN;
    mutationInitError?: string;
    reversalPriceLamports?: BN;
    name?: string;
  }) => {
    // record uses
    this.uses = uses;

    // create any relevant maker mints
    [this.makerMintA] = await this.sdk.createMintAndATA(this.makerTokenAmount);
    if (makerTokenBAmountPerUse) {
      [this.makerMintB] = await this.sdk.createMintAndATA(
        makerTokenBAmountPerUse.mul(uses)
      );
    }
    if (makerTokenCAmountPerUse) {
      [this.makerMintC] = await this.sdk.createMintAndATA(
        makerTokenCAmountPerUse.mul(uses)
      );
    }

    const config: MutationConfig = {
      takerTokenA: {
        gemBank: this.transmuter.bankA,
        requiredAmount: this.takerTokenAmount,
        requiredUnits: RequiredUnits.RarityPoints,
        vaultAction,
      },
      takerTokenB,
      takerTokenC,
      makerTokenA: {
        mint: this.makerMintA,
        totalFunding: this.makerTokenAmount,
        amountPerUse: this.makerTokenAmountPerUse,
      },
      makerTokenB: makerTokenBAmountPerUse
        ? {
            mint: this.makerMintB,
            totalFunding: makerTokenBAmountPerUse.mul(uses),
            amountPerUse: makerTokenBAmountPerUse,
          }
        : null,
      makerTokenC: makerTokenCAmountPerUse
        ? {
            mint: this.makerMintC,
            totalFunding: makerTokenCAmountPerUse.mul(uses),
            amountPerUse: makerTokenCAmountPerUse,
          }
        : null,
      price: {
        priceLamports: toBN(0.1 * LAMPORTS_PER_SOL),
        reversalPriceLamports,
      },
      mutationDurationSec,
      reversible,
    };

    const { mutationWrapper, tx } = await this.sdk.initMutation(
      config,
      this.transmuter.key,
      uses,
      undefined,
      name
    );

    if (!mutationInitError) {
      await expectTX(tx, "init new mutation").to.be.fulfilled;
      this.mutation = mutationWrapper;
      console.log("mutation ready");

      // setup & fill up any relevant taker vaults
      ({
        vault: this.takerVaultA,
        takerMint: this.takerMintA,
        takerAcc: this.takerAccA,
      } = await this.prepareTakerVaults(this.transmuter.bankA));
      if (takerTokenB) {
        ({
          vault: this.takerVaultB,
          takerMint: this.takerMintB,
          takerAcc: this.takerAccB,
        } = await this.prepareTakerVaults(this.transmuter.bankB));
      }
      if (takerTokenC) {
        ({
          vault: this.takerVaultC,
          takerMint: this.takerMintC,
          takerAcc: this.takerAccC,
        } = await this.prepareTakerVaults(this.transmuter.bankC));
      }
    } else {
      expect(tx.confirm()).to.be.rejectedWith(mutationInitError);
    }
  };

  doAirdrop = async (receiver: PublicKey, amount: number) => {
    await this.conn
      .requestAirdrop(receiver, amount)
      .then((sig) => this.conn.confirmTransaction(sig, "confirmed"))
      .catch((e) => console.log("failed to get airdrop", e));
  };

  prepareTakerVaults = async (bank: PublicKey, taker = this.taker) => {
    // fund taker
    const balance = await this.conn.getBalance(taker.publicKey);
    if (balance < 0.1 * LAMPORTS_PER_SOL) {
      await this.doAirdrop(taker.publicKey, LAMPORTS_PER_SOL);
    }

    // create vaults
    const { tx, vault } = await this.mutation.initTakerVault(
      bank,
      taker.publicKey
    );
    tx.addSigners(taker);
    await tx.confirm();

    // create tokens
    const [takerMint, takerAcc] = await this.sdk.createMintAndATA(
      toBN(this.takerTokenAmountPerUse.mul(this.uses)),
      taker
    );

    // deposit tokens
    await this.gb.depositGem(
      bank,
      vault,
      taker,
      toBN(this.takerTokenAmount),
      takerMint,
      takerAcc
    );

    console.log("vault set up & funded");

    return { vault, takerMint, takerAcc };
  };

  // --------------------------------------- loader

  static load = async (
    transmuter?: TransmuterWrapper
  ): Promise<MutationTester> => {
    let tester = new MutationTester();

    //either attach an existing transmuter (useful for multi-mutation testing), or create new
    if (transmuter) {
      tester.transmuter = transmuter;
    } else {
      await tester.prepareTransmuter();
    }

    return tester;
  };

  // --------------------------------------- verifiers

  verifyTakerReceivedMakerTokens = async (amount?: BN) => {
    const makerATA = await getATAAddress({
      mint: this.makerMintA,
      owner: this.taker.publicKey,
    });
    expect(
      (await this.sdk.provider.connection.getTokenAccountBalance(makerATA))
        .value.amount
    ).to.eq(
      amount
        ? amount.toString()
        : this.makerTokenAmount.div(this.uses).toString()
    );

    console.log("received tokens valid");
  };

  verifyVault = async (locked: boolean, owner: PublicKey | Keypair) => {
    const vaultAcc = await this.gb.fetchVaultAcc(this.takerVaultA);

    // verify owner & lock
    expect(vaultAcc.owner).to.eqAddress(
      isKp(owner) ? (<Keypair>owner).publicKey : <PublicKey>owner
    );
    expect(vaultAcc.locked).to.be.eq(locked);

    // verify taker can/can't withdraw gems
    if (!locked) {
      await this.gb.withdrawGem(
        this.transmuter.bankA,
        this.takerVaultA,
        owner,
        toBN(this.takerTokenAmount),
        this.takerMintA,
        Keypair.generate().publicKey
      );
    } else {
      await expect(
        this.gb.withdrawGem(
          this.transmuter.bankA,
          this.takerVaultA,
          owner,
          toBN(this.takerTokenAmount),
          this.takerMintA,
          Keypair.generate().publicKey
        )
      ).to.be.rejectedWith("VaultAccessSuspended.");
    }

    console.log("vault valid");
  };
}
