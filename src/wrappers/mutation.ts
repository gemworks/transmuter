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
import { GEM_BANK_PROG_ID, stringifyPKsAndBNs } from "@gemworks/gem-farm-ts";
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

  get data(): MutationData | undefined {
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

  async execute(taker: PublicKey, reverse: boolean = false) {
    await this.reloadData();
    let config = this._data.config;

    // ----------------- prep banks & vaults

    const bankA = config.takerTokenA.gemBank;
    const [vaultA] = await this.sdk.findVaultPDA(bankA, taker);
    let bankB: PublicKey;
    let vaultB: PublicKey;
    let bankC: PublicKey;
    let vaultC: PublicKey;

    const remainingAccounts = [];

    if (config.takerTokenB) {
      bankB = config.takerTokenB.gemBank;
      [vaultB] = await this.sdk.findVaultPDA(bankB, taker);
      remainingAccounts.push({
        pubkey: bankB,
        isWritable: false,
        isSigner: false,
      });
      remainingAccounts.push({
        pubkey: vaultB,
        isWritable: true,
        isSigner: false,
      });
    }

    if (config.takerTokenC) {
      bankC = config.takerTokenC.gemBank;
      [vaultC] = await this.sdk.findVaultPDA(bankC, taker);
      remainingAccounts.push({
        pubkey: bankC,
        isWritable: false,
        isSigner: false,
      });
      remainingAccounts.push({
        pubkey: vaultC,
        isWritable: true,
        isSigner: false,
      });
    }

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

    const [authority, bump] = await this.sdk.findTransmuterAuthorityPDA(
      this.transmuter
    );

    const [executionReceipt, receiptBump] =
      await this.sdk.findExecutionReceiptPDA(this.key, taker);

    const ix = this.program.instruction.executeMutation(
      bump,
      tokenAEscrowBump,
      tokenBEscrowBump,
      tokenCEscrowBump,
      receiptBump,
      reverse,
      {
        accounts: {
          transmuter: this.transmuter,
          mutation: this.key,
          authority,
          owner: this.sdk.provider.wallet.publicKey,
          vaultA,
          bankA,
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
        remainingAccounts,
      }
    );

    return new TransactionEnvelope(this.sdk.provider, [ix]);
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
