import { TransmuterSDK } from "../sdk";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  AugmentedProvider,
  TransactionEnvelope,
} from "@saberhq/solana-contrib";
import { MutationData, TransmuterProgram } from "../constants";
import { GEM_BANK_PROG_ID } from "@gemworks/gem-farm-ts";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { createMint } from "@saberhq/token-utils";

export class MutationWrapper {
  private _data?: any; //todo temp

  constructor(
    readonly sdk: TransmuterSDK,
    readonly key: PublicKey,
    readonly transmuter: PublicKey,
    _data?: MutationData,
    readonly program: TransmuterProgram = sdk.programs.Transmuter
  ) {}

  get provider(): AugmentedProvider {
    return this.sdk.provider;
  }

  get data(): any {
    return this._data;
  }

  /**
   * reloadData into _data
   */
  async reloadData(): Promise<MutationData> {
    this._data = (await this.program.account.mutation.fetch(this.key)) as any;
    return this._data;
  }

  // --------------------------------------- ixs

  async execute(taker: PublicKey) {
    return this._executeOrReverse(taker, false);
  }

  async reverse(taker: PublicKey) {
    return this._executeOrReverse(taker, true);
  }

  async _executeOrReverse(taker: PublicKey, reverse = false) {
    await this.reloadData();
    let config = this._data.config;

    // ----------------- prep banks & vaults
    // if a bank doesn't exist, we create a fake bank. Cheaper (compute) than optional accs

    const bankA = config.takerTokenA.gemBank;
    const { vault: vaultA } = await this.sdk.findTakerVaultPDA(
      bankA,
      this.key,
      taker
    );
    const bankB = config.takerTokenB
      ? config.takerTokenB.gemBank
      : Keypair.generate().publicKey;
    const { vault: vaultB } = await this.sdk.findTakerVaultPDA(
      bankB,
      this.key,
      taker
    );
    const bankC = config.takerTokenC
      ? config.takerTokenC.gemBank
      : Keypair.generate().publicKey;
    const { vault: vaultC } = await this.sdk.findTakerVaultPDA(
      bankC,
      this.key,
      taker
    );

    // ----------------- prep escrows

    const tokenAMint = config.makerTokenA.mint;
    const [tokenAEscrow, tokenAEscrowBump, tokenATakerAta] =
      await this.sdk.prepTokenAccounts(this.key, tokenAMint, taker);

    const tokenBMint = config.makerTokenB
      ? config.makerTokenB.mint
      : await createMint(this.provider);
    const [tokenBEscrow, tokenBEscrowBump, tokenBTakerAta] =
      await this.sdk.prepTokenAccounts(this.key, tokenBMint, taker);

    const tokenCMint = config.makerTokenC
      ? config.makerTokenC.mint
      : await createMint(this.provider);
    const [tokenCEscrow, tokenCEscrowBump, tokenCTakerAta] =
      await this.sdk.prepTokenAccounts(this.key, tokenCMint, taker);

    // ----------------- prep ix

    const [authority] = await this.sdk.findTransmuterAuthorityPDA(
      this.transmuter
    );

    const [executionReceipt, receiptBump] =
      await this.sdk.findExecutionReceiptPDA(this.key, taker);

    let ix;
    if (!reverse) {
      ix = this.program.instruction.executeMutation(receiptBump, {
        accounts: {
          transmuter: this.transmuter,
          mutation: this.key,
          authority,
          owner: this.sdk.provider.wallet.publicKey,
          bankA,
          vaultA,
          bankB,
          vaultB,
          bankC,
          vaultC,
          gemBank: GEM_BANK_PROG_ID,
          tokenAEscrow,
          tokenATakerAta,
          tokenAMint,
          tokenBEscrow,
          tokenBTakerAta,
          tokenBMint,
          tokenCEscrow,
          tokenCTakerAta,
          tokenCMint,
          taker,
          executionReceipt,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
      });
    } else {
      ix = this.program.instruction.reverseMutation(receiptBump, {
        accounts: {
          transmuter: this.transmuter,
          mutation: this.key,
          authority,
          owner: this.sdk.provider.wallet.publicKey,
          bankA,
          vaultA,
          bankB,
          vaultB,
          bankC,
          vaultC,
          gemBank: GEM_BANK_PROG_ID,
          tokenAEscrow,
          tokenATakerAta,
          tokenAMint,
          tokenBEscrow,
          tokenBTakerAta,
          tokenBMint,
          tokenCEscrow,
          tokenCTakerAta,
          tokenCMint,
          taker,
          executionReceipt,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
      });
    }

    return {
      authority,
      executionReceipt,
      tx: new TransactionEnvelope(this.sdk.provider, [ix]),
    };
  }

  async destroy(transmuter: PublicKey) {
    await this.reloadData();
    let config = this._data.config;

    // ----------------- prep escrows

    const tokenAMint = config.makerTokenA.mint;
    const [tokenAEscrow, tokenAEscrowBump, tokenADest] =
      await this.sdk.prepTokenAccounts(this.key, tokenAMint);

    const tokenBMint = config.makerTokenB
      ? config.makerTokenB.mint
      : await createMint(this.provider);
    const [tokenBEscrow, tokenBEscrowBump, tokenBDest] =
      await this.sdk.prepTokenAccounts(this.key, tokenBMint);

    const tokenCMint = config.makerTokenC
      ? config.makerTokenC.mint
      : await createMint(this.provider);
    const [tokenCEscrow, tokenCEscrowBump, tokenCDest] =
      await this.sdk.prepTokenAccounts(this.key, tokenCMint);

    // ----------------- prep ix

    const [authority, bump] = await this.sdk.findTransmuterAuthorityPDA(
      this.transmuter
    );

    const ix = this.program.instruction.destroyMutation(bump, {
      accounts: {
        transmuter,
        mutation: this.key,
        owner: this.provider.wallet.publicKey,
        authority,
        tokenAEscrow,
        tokenADest,
        tokenAMint,
        tokenBEscrow,
        tokenBDest,
        tokenBMint,
        tokenCEscrow,
        tokenCDest,
        tokenCMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
    });

    return { authority, tx: new TransactionEnvelope(this.provider, [ix]) };
  }

  async initTakerVault(bank: PublicKey, taker: PublicKey) {
    const { creator, creatorBump, vault, vaultBump } =
      await this.sdk.findTakerVaultPDA(bank, this.key, taker);
    const [executionReceipt, receiptBump] =
      await this.sdk.findExecutionReceiptPDA(this.key, taker);

    const ix = this.program.instruction.initTakerVault(
      creatorBump,
      receiptBump,
      vaultBump,
      {
        accounts: {
          transmuter: this.transmuter,
          mutation: this.key,
          bank,
          vault,
          creator,
          gemBank: GEM_BANK_PROG_ID,
          taker,
          executionReceipt,
          systemProgram: SystemProgram.programId,
        },
      }
    );

    return {
      creator,
      vault,
      executionReceipt,
      tx: new TransactionEnvelope(this.provider, [ix]),
    };
  }

  // --------------------------------------- load

  static async load(
    sdk: TransmuterSDK,
    key: PublicKey,
    transmuter: PublicKey
  ): Promise<MutationWrapper> {
    const data = (await sdk.programs.Transmuter.account.mutation.fetch(
      key
    )) as any;
    return new MutationWrapper(sdk, key, transmuter, data);
  }
}
