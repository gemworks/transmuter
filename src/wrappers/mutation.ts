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

  async execute(receiver: PublicKey) {
    await this.reloadData();
    let config = this._data.config;

    // ----------------- prep banks
    const bankA = config.takerTokenA.gemBank;
    let bankB: PublicKey;
    let bankC: PublicKey;

    if (config.takerTokenB) {
      bankB = config.takerTokenB.gemBank;
    } else {
      const fakeBankB = Keypair.generate();
      bankB = fakeBankB.publicKey;
    }

    if (config.takerTokenC) {
      bankC = config.takerTokenC.gemBank;
    } else {
      const fakeBankC = Keypair.generate();
      bankC = fakeBankC.publicKey;
    }

    // ----------------- prep vaults

    const [vaultA] = await this.sdk.findVaultPDA(bankA, receiver);
    const [vaultB] = await this.sdk.findVaultPDA(bankB, receiver);
    const [vaultC] = await this.sdk.findVaultPDA(bankC, receiver);

    // ----------------- prep escrows

    const tokenAMint =
      config.makerTokenA.mint ?? (await createMint(this.provider));
    const [tokenAEscrow, tokenAEscrowBump, tokenADestination] =
      await this.sdk.prepTokenAccounts(this.key, tokenAMint, receiver);

    const tokenBMint =
      config.makerTokenB && config.makerTokenB.mint
        ? config.makerTokenB.mint
        : await createMint(this.provider);
    const [tokenBEscrow, tokenBEscrowBump, tokenBDestination] =
      await this.sdk.prepTokenAccounts(this.key, tokenBMint, receiver);

    const tokenCMint =
      config.makerTokenC && config.makerTokenC.mint
        ? config.makerTokenC.mint
        : await createMint(this.provider);
    const [tokenCEscrow, tokenCEscrowBump, tokenCDestination] =
      await this.sdk.prepTokenAccounts(this.key, tokenCMint, receiver);

    // ----------------- prep ix

    const [authority, bump] = await this.sdk.findTransmuterAuthorityPDA(
      this.transmuter
    );

    const ix = this.program.instruction.executeMutation(
      bump,
      tokenAEscrowBump,
      tokenBEscrowBump,
      tokenCEscrowBump,
      {
        accounts: {
          transmuter: this.transmuter,
          mutation: this.key,
          authority,
          vaultA,
          bankA,
          vaultB,
          bankB,
          vaultC,
          bankC,
          gemBank: GEM_BANK_PROG_ID,
          tokenAEscrow,
          tokenADestination,
          tokenAMint,
          tokenBEscrow,
          tokenBDestination,
          tokenBMint,
          tokenCEscrow,
          tokenCDestination,
          tokenCMint,
          receiver,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
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
