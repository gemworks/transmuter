import "chai-bn";
import { MutationTester } from "../mutation.tester";
import { toBN } from "@gemworks/gem-farm-ts";
import { expectTX } from "@saberhq/chai-solana";
import { expect } from "chai";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

describe("transmuter (reverse)", () => {
  let mt: MutationTester;

  beforeEach("setup tester class", async () => {
    mt = await MutationTester.load();
  });

  it("tries to reverse a non-reversible mutation", async () => {
    await mt.prepareMutation({ reversible: false });

    //call execute
    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("executed");

    //call reverse
    const { tx: reverseTx } = await mt.mutation.reverse(mt.taker.publicKey);
    reverseTx.addSigners(mt.taker);
    expect(reverseTx.confirm()).to.be.rejectedWith("0x177d");
  });

  it("tries to reverse a mutation w/o a receipt", async () => {
    await mt.prepareMutation({ reversible: true });

    //call reverse
    const { tx: reverseTx } = await mt.mutation.reverse(mt.taker.publicKey);
    reverseTx.addSigners(mt.taker);
    expect(reverseTx.confirm()).to.be.rejectedWith("0x177f");
  });

  it("tries to reverse a pending mutation", async () => {
    await mt.prepareMutation({ reversible: true, mutationTimeSec: toBN(30) });

    //call execute
    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("executed");

    //call reverse
    const { tx: reverseTx } = await mt.mutation.reverse(mt.taker.publicKey);
    reverseTx.addSigners(mt.taker);
    expect(reverseTx.confirm()).to.be.rejectedWith("0x177b");
  });

  it("issues a full refund on reversal", async () => {
    await mt.prepareMutation({
      reversible: true,
      reversalPriceLamports: toBN(-LAMPORTS_PER_SOL),
    });

    const oldBalance = await mt.conn.getBalance(mt.taker.publicKey);

    //call execute
    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("executed");

    const newBalance = await mt.conn.getBalance(mt.taker.publicKey);
    expect(newBalance).to.be.gt(oldBalance - 2 * LAMPORTS_PER_SOL);
    expect(newBalance).to.be.lt(oldBalance - LAMPORTS_PER_SOL);

    //call reverse
    const { tx: reverseTx } = await mt.mutation.reverse(mt.taker.publicKey);
    reverseTx.addSigners(mt.taker);
    await expectTX(reverseTx).to.be.fulfilled;

    const newBalance2 = await mt.conn.getBalance(mt.taker.publicKey);
    expect(newBalance2).to.be.gt(oldBalance - LAMPORTS_PER_SOL);
    expect(newBalance2).to.be.lt(oldBalance);
  });
});
