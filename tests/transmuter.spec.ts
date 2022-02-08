import { makeSDK } from "./workspace";
import {
  MutationConfig,
  MutationWrapper,
  MakerTokenSource,
  SinkAction,
} from "../src";
import { expectTX } from "@saberhq/chai-solana";

import "chai-bn";
import { Keypair } from "@solana/web3.js";
import { toBN } from "@gemworks/gem-farm-ts";

describe("transmuter", () => {
  const sdk = makeSDK();

  let mutationWrapper: MutationWrapper;

  before("prep", async () => {
    const gemBank = Keypair.generate();
    const mutation = Keypair.generate();
    const [outMint] = await sdk.createMintAndATA(toBN(10));

    const config: MutationConfig = {
      takerTokenA: {
        gemBank: gemBank.publicKey,
        amount: toBN(5),
        action: SinkAction.Burn,
        destination: Keypair.generate().publicKey,
      },
      takerTokenB: null,
      takerTokenC: null,
      makerTokenA: {
        source: MakerTokenSource.Prefunded,
        amount: toBN(1),
        mint: outMint,
        candyMachine: null,
      },
      makerTokenB: null,
      makerTokenC: null,
      timeSettings: {
        mutationTimeSec: toBN(1),
        cancelWindowSec: toBN(1),
      },
      price: toBN(0),
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
