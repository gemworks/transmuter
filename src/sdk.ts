import {
  AugmentedProvider,
  Provider,
  SolanaAugmentedProvider,
  TransactionEnvelope,
} from "@saberhq/solana-contrib";
import { Programs, TRANSMUTER_ADDRESSES, TRANSMUTER_IDLS } from "./constants";
import { newProgramMap } from "@saberhq/anchor-contrib";
import { MutationWrapper } from "./wrappers";

export class TransmuterSDK {
  constructor(
    readonly provider: AugmentedProvider,
    readonly programs: Programs
  ) {}

  // --------------------------------------- pda derivations

  // --------------------------------------- initializers

  async initMutation() {
    const ix = this.programs.Transmuter.instruction.initMutation({});

    return {
      mutationWrapper: new MutationWrapper(this),
      tx: new TransactionEnvelope(this.provider, [ix]),
    };
  }

  // --------------------------------------- load

  static load({
    provider,
    addresses = TRANSMUTER_ADDRESSES,
  }: {
    provider: Provider;
    addresses?: any; //todo
  }): TransmuterSDK {
    const programs = newProgramMap<Programs>(
      provider,
      TRANSMUTER_IDLS,
      addresses
    );
    return new TransmuterSDK(new SolanaAugmentedProvider(provider), programs);
  }
}
