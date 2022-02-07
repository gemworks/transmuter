import {
  AugmentedProvider,
  Provider,
  SolanaAugmentedProvider,
  TransactionEnvelope,
} from "@saberhq/solana-contrib";
import { Programs, TRANSMUTER_ADDRESSES, TRANSMUTER_IDLS } from "./constants";
import { newProgramMap } from "@saberhq/anchor-contrib";
import { MutationWrapper } from "./wrappers";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";
import { GEM_BANK_PROG_ID } from "@gemworks/gem-farm-ts";

export interface InTokenConfig {
  gemBank: PublicKey;
  count: BN;
}

export const OutTokenSource = {
  Mint: { mint: {} },
  Prefunded: { prefunded: {} },
};

export interface OutTokenConfig {
  source: any; //OutTokenSource
  count: BN;
}

export const SinkAction = {
  Burn: { burn: {} },
  Transfer: { transfer: {} },
  Preserve: { preserve: {} },
};

export interface SinkSettings {
  action: any; //SinkAction
  destination: PublicKey | null;
}

export interface TimeSettings {
  mutationTimeSec: BN;
  cancelWindowSec: BN;
}

export interface MutationConfig {
  inTokenA: InTokenConfig;
  inTokenB: InTokenConfig | null;
  inTokenC: InTokenConfig | null;

  outTokenA: OutTokenConfig;
  outTokenB: OutTokenConfig | null;
  outTokenC: OutTokenConfig | null;

  sinkSettings: SinkSettings;

  timeSettings: TimeSettings;

  payEveryTime: boolean;

  updateMetadata: boolean;

  reversible: boolean;
}

export class TransmuterSDK {
  constructor(
    readonly provider: AugmentedProvider,
    readonly programs: Programs
  ) {}

  // --------------------------------------- pda derivations

  // --------------------------------------- initializers

  async initMutation(
    config: MutationConfig,
    mutation: PublicKey,
    payer?: PublicKey
  ) {
    const bankA = config.inTokenA.gemBank;
    let bankB: PublicKey;
    let bankC: PublicKey;

    const signers: Keypair[] = [];

    if (config.inTokenB) {
      bankB = config.inTokenB.gemBank;
    } else {
      const fakeBankB = Keypair.generate();
      bankB = fakeBankB.publicKey;
      signers.push(fakeBankB);
    }

    if (config.inTokenC) {
      bankC = config.inTokenC.gemBank;
    } else {
      const fakeBankC = Keypair.generate();
      bankC = fakeBankC.publicKey;
      signers.push(fakeBankC);
    }

    const ix = this.programs.Transmuter.instruction.initMutation(
      config as any,
      {
        accounts: {
          mutation,
          mutationOwner: this.provider.wallet.publicKey,
          bankA,
          bankB,
          bankC,
          gemBank: GEM_BANK_PROG_ID,
          payer: payer ?? this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
      }
    );

    return {
      mutationWrapper: new MutationWrapper(this),
      tx: new TransactionEnvelope(this.provider, [ix], signers),
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
