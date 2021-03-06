import { TransmuterSDK } from "../sdk";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { MutationData, TransmuterData, TransmuterProgram } from "../constants";
import {
  AugmentedProvider,
  TransactionEnvelope,
} from "@saberhq/solana-contrib";
import {
  findRarityPDA,
  findWhitelistProofPDA,
  GEM_BANK_PROG_ID,
  RarityConfig,
  WhitelistType,
} from "@gemworks/gem-farm-ts";
import { findTransmuterAuthorityPDA } from "../pda";

export class TransmuterWrapper {
  private _data?: TransmuterData;

  constructor(
    readonly sdk: TransmuterSDK,
    readonly key: PublicKey,
    readonly bankA: PublicKey,
    readonly bankB: PublicKey,
    readonly bankC: PublicKey,
    _data?: TransmuterData,
    readonly program: TransmuterProgram = sdk.programs.Transmuter
  ) {}

  get provider(): AugmentedProvider {
    return this.sdk.provider;
  }

  get data(): TransmuterData | undefined {
    return this._data;
  }

  /**
   * reloadData into _data
   */
  async reloadData(): Promise<MutationData> {
    this._data = await this.program.account.transmuter.fetch(this.key);
    return this._data;
  }

  // --------------------------------------- ixs

  async updateTransmuter(newOwner: PublicKey) {
    const ix = await this.program.instruction.updateTransmuter(newOwner, {
      accounts: {
        transmuter: this.key,
        owner: this.provider.wallet.publicKey,
      },
    });

    return { tx: new TransactionEnvelope(this.provider, [ix]) };
  }

  async addToBankWhitelist(
    bank: PublicKey,
    addressToWhitelist: PublicKey,
    whitelistType: WhitelistType
  ) {
    await this.reloadData();

    const [authority, authBump] = await findTransmuterAuthorityPDA(this.key);
    const [whitelistProof, wlBump] = await findWhitelistProofPDA(
      bank,
      addressToWhitelist
    );

    const ix = await this.program.instruction.addToBankWhitelist(
      authBump,
      whitelistType,
      {
        accounts: {
          transmuter: this.key,
          owner: this.provider.wallet.publicKey,
          authority,
          bank,
          addressToWhitelist,
          whitelistProof,
          systemProgram: SystemProgram.programId,
          gemBank: GEM_BANK_PROG_ID,
        },
      }
    );

    return {
      authority,
      whitelistProof,
      tx: new TransactionEnvelope(this.provider, [ix]),
    };
  }

  async removeFromBankWhitelist(bank: PublicKey, addressToRemove: PublicKey) {
    await this.reloadData();

    const [authority, authBump] = await findTransmuterAuthorityPDA(this.key);
    const [whitelistProof, wlBump] = await findWhitelistProofPDA(
      bank,
      addressToRemove
    );

    const ix = await this.program.instruction.removeFromBankWhitelist(
      authBump,
      wlBump,
      {
        accounts: {
          transmuter: this.key,
          owner: this.provider.wallet.publicKey,
          authority,
          bank,
          addressToRemove,
          whitelistProof,
          gemBank: GEM_BANK_PROG_ID,
        },
      }
    );

    return {
      authority,
      whitelistProof,
      tx: new TransactionEnvelope(this.provider, [ix]),
    };
  }

  async addRaritiesToBank(bank: PublicKey, rarityConfigs: RarityConfig[]) {
    await this.reloadData();

    const [authority, authBump] = await findTransmuterAuthorityPDA(this.key);

    //prepare rarity configs
    const completeRarityConfigs = [...rarityConfigs];
    const remainingAccounts = [];

    for (const config of completeRarityConfigs) {
      const [gemRarity] = await findRarityPDA(bank, config.mint);
      //add mint
      remainingAccounts.push({
        pubkey: config.mint,
        isWritable: false,
        isSigner: false,
      });
      //add rarity pda
      remainingAccounts.push({
        pubkey: gemRarity,
        isWritable: true,
        isSigner: false,
      });
    }

    const ix = await this.program.instruction.addRaritiesToBank(
      authBump,
      completeRarityConfigs,
      {
        accounts: {
          transmuter: this.key,
          owner: this.provider.wallet.publicKey,
          authority,
          bank,
          gemBank: GEM_BANK_PROG_ID,
          systemProgram: SystemProgram.programId,
        },
        remainingAccounts,
      }
    );

    return {
      authority,
      tx: new TransactionEnvelope(this.provider, [ix]),
    };
  }

  // --------------------------------------- load

  static async load(
    sdk: TransmuterSDK,
    key: PublicKey,
    bankA: PublicKey,
    bankB: PublicKey,
    bankC: PublicKey
  ): Promise<TransmuterWrapper> {
    const data = await sdk.programs.Transmuter.account.transmuter.fetch(key);
    return new TransmuterWrapper(sdk, key, bankA, bankB, bankC, data);
  }
}
