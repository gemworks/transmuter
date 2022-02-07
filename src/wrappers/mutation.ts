import { TransmuterSDK } from "../sdk";

export class MutationWrapper {
  constructor(readonly SDK: TransmuterSDK) {}

  async begin() {}

  async complete() {}

  async cancel() {}
}
