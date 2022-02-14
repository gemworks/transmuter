import "chai-bn";
import { MutationTester } from "../mutation.tester";
import { toBN } from "@gemworks/gem-farm-ts";
import { expectTX } from "@saberhq/chai-solana";
import { expect } from "chai";

describe("transmuter (receipt)", () => {
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
    console.log("mutation executed");

    expect(tx.confirm()).to.be.rejectedWith("0x177c");
  });

  it("doesnt create a receipt for non-reversible, 0-timeout txs", async () => {
    await mt.prepareMutation({});

    //call execute
    const tx = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("mutation executed");

    expect(mt.sdk.fetchReceipt(mt.mutation.key, mt.taker.publicKey)).to.be
      .rejected;
  });
});
