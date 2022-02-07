import * as anchor from "@project-serum/anchor";
import { makeSDK } from "./workspace";
import {
  MutationConfig,
  MutationWrapper,
  OutTokenSource,
  SinkAction,
} from "../src";
import { expectTX } from "@saberhq/chai-solana";

import "chai-bn";
import { Keypair } from "@solana/web3.js";
import { toBN } from "@gemworks/gem-farm-ts";

describe("transmuter", () => {
  const { BN, web3 } = anchor;
  const sdk = makeSDK();
  const program = sdk.programs.Transmuter;
  let mutationWrapper: MutationWrapper;

  before("prep", async () => {
    const gemBank = Keypair.generate();
    const mutation = Keypair.generate();

    const config: MutationConfig = {
      inTokenA: {
        gemBank: gemBank.publicKey,
        count: toBN(5),
        action: SinkAction.Burn,
        destination: Keypair.generate().publicKey,
      },
      inTokenB: null,
      inTokenC: null,
      outTokenA: {
        source: OutTokenSource.Prefunded,
        count: toBN(1),
      },
      outTokenB: null,
      outTokenC: null,
      timeSettings: {
        mutationTimeSec: toBN(1),
        cancelWindowSec: toBN(1),
      },
      payEveryTime: false,
      updateMetadata: false,
      reversible: false,
    };

    const { mutationWrapper: wrapper, tx } = await sdk.initMutation(
      config,
      mutation.publicKey
    );

    tx.addSigners(gemBank);
    tx.addSigners(mutation);

    await expectTX(tx, "init new mutation").to.be.fulfilled;
    mutationWrapper = wrapper;
  });

  it("happy path", async () => {
    console.log("works!");
  });
});
