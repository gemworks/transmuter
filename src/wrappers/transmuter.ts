import { TransmuterSDK } from "../sdk";
import { PublicKey } from "@solana/web3.js";
import { MutationData, TransmuterData, TransmuterProgram } from "../constants";
import { AugmentedProvider } from "@saberhq/solana-contrib";

export class TransmuterWrapper {
  private _data?: any;

  constructor(
    readonly sdk: TransmuterSDK,
    readonly key: PublicKey,
    readonly bankA: PublicKey,
    readonly bankB?: PublicKey,
    readonly bankC?: PublicKey,
    _data?: TransmuterData,
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

  // --------------------------------------- load

  static async load(
    sdk: TransmuterSDK,
    key: PublicKey,
    bankA: PublicKey,
    bankB?: PublicKey,
    bankC?: PublicKey
  ): Promise<TransmuterWrapper> {
    const data = (await sdk.programs.Transmuter.account.transmuter.fetch(
      key
    )) as any;
    return new TransmuterWrapper(sdk, key, bankA, bankB, bankC, data);
  }
}
