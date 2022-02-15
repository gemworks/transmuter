import "chai-bn";
import { MutationTester } from "../mutation.tester";
import { toBN } from "@gemworks/gem-farm-ts";
import { expectTX } from "@saberhq/chai-solana";
import { expect } from "chai";
import { Keypair } from "@solana/web3.js";

describe("transmuter (receipt)", () => {
  let mt: MutationTester;

  beforeEach("setup tester class", async () => {
    mt = await MutationTester.load();
  });

  it("prevents same taker from executing twice", async () => {
    await mt.prepareMutation({ uses: toBN(2), reversible: true });

    //call execute
    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("mutation executed");

    expect(tx.confirm()).to.be.rejectedWith("0x177c");
  });

  it("doesnt create a receipt for non-reversible, 0-timeout txs", async () => {
    await mt.prepareMutation({});

    //call execute
    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("mutation executed");

    expect(mt.sdk.fetchReceipt(mt.mutation.key, mt.taker.publicKey)).to.be
      .rejected;
  });

  it("finds relevant receipts", async () => {
    await mt.prepareMutation({ uses: toBN(2) });

    //call execute (taker 1)
    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("mutation executed (taker 1)");

    //call execute (taker 2)
    const taker2 = Keypair.generate();
    await mt.prepareTakerVaults(mt.transmuter.bankA, taker2);
    const { tx: tx2 } = await mt.mutation.execute(taker2.publicKey);
    tx2.addSigners(taker2);
    await expectTX(tx2, "executes mutation").to.be.fulfilled;
    console.log("mutation executed (taker 1)");

    //fetch w/o options
    const receipts = await mt.sdk.findAllReceipts();
    expect(receipts.length).to.be.eq(2);

    //fetch by transmuter
    const receipts2 = await mt.sdk.findAllReceipts(mt.transmuter.key);
    expect(receipts2.length).to.be.eq(2);

    //fetch by mutation
    const receipts3 = await mt.sdk.findAllReceipts(undefined, mt.mutation.key);
    expect(receipts3.length).to.be.eq(2);

    //fetch by taker
    const receipts4 = await mt.sdk.findAllReceipts(
      undefined,
      undefined,
      mt.taker.publicKey
    );
    expect(receipts4.length).to.be.eq(1);
  });
});
