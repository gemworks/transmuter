import "chai-bn";
import { MutationTester } from "./mutation.tester";
import { toBN } from "@gemworks/gem-farm-ts";
import { expectTX } from "@saberhq/chai-solana";
import { expect } from "chai";

describe("transmuter (uses)", () => {
  let mt: MutationTester;

  beforeEach("setup tester class", async () => {
    mt = await MutationTester.load();
  });

  it("prevents same taker from executing twice", async () => {
    await mt.prepareMutation({ uses: toBN(2), reversible: true });

    //call execute
    const tx = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("mutation executed (1st taker)");

    expect(tx.confirm()).to.be.rejectedWith("0x177c");
  });
});
