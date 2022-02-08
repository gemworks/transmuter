import { TransmuterSDK } from "../sdk";
import { PublicKey } from "@solana/web3.js";
import { AugmentedProvider } from "@saberhq/solana-contrib";
import { MutationData, Programs } from "../constants";

export class MutationWrapper {
  private _data?: MutationData;

  constructor(
    readonly sdk: TransmuterSDK,
    readonly key: PublicKey,
    _data?: MutationData
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
    console.log("accounts:", this.sdk.programs.Transmuter.account);
    this._data = (await this.sdk.programs.Transmuter.account.mutation.fetch(
      this.key
    )) as any;
    return this._data;
  }

  async execute() {}

  // --------------------------------------- load

  static async load(
    sdk: TransmuterSDK,
    key: PublicKey
  ): Promise<MutationWrapper> {
    const data = (await sdk.programs.Transmuter.account.mutation.fetch(
      key
    )) as any;
    return new MutationWrapper(sdk, key, data);
  }
}
