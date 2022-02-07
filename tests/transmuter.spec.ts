import * as anchor from "@project-serum/anchor";
import { makeSDK } from "./workspace";
import { MutationWrapper } from "../src";
import { expectTX } from "@saberhq/chai-solana";

import "chai-bn";

describe("transmuter", () => {
  const { BN, web3 } = anchor;
  const sdk = makeSDK();
  const program = sdk.programs.Transmuter;
  let mutationWrapper: MutationWrapper;

  before("prep", async () => {
    const { mutationWrapper: wrapper, tx } = await sdk.initMutation();

    await expectTX(tx, "init new mutation").to.be.fulfilled;
    mutationWrapper = wrapper;
  });

  it("happy path", async () => {
    console.log("works!");
  });
});
