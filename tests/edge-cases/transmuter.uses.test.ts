import "chai-bn";
import { MutationTester } from "../mutation.tester";
import { toBN } from "@gemworks/gem-farm-ts";
import { expectTX } from "@saberhq/chai-solana";
import { expect } from "chai";
import { Keypair } from "@solana/web3.js";
import { MutationState } from "../../src";
import { UtransmuterErrors } from "../../src/idls/transmuter";

describe("transmuter (uses)", () => {
  let mt: MutationTester;

  beforeEach("setup tester class", async () => {
    mt = await MutationTester.load();
  });

  it("decrements then increments uses during execution", async () => {
    await mt.prepareMutation({ uses: toBN(2), reversible: true });

    //call execute
    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("mutation executed (1st taker)");

    //verify uses
    await mt.mutation.reloadData();
    expect(mt.mutation.data.totalUses.toNumber()).to.eq(2);
    expect(mt.mutation.data.remainingUses.toNumber()).to.eq(1);
    expect(mt.mutation.data.state).to.deep.eq(MutationState.Available);

    // ----------------- 2nd taker
    const taker2 = Keypair.generate();
    await mt.prepareTakerVaults(mt.transmuter.bankA, taker2);

    //call execute
    const { tx: tx2 } = await mt.mutation.execute(taker2.publicKey);
    tx2.addSigners(taker2);
    await expectTX(tx2, "executes mutation").to.be.fulfilled;
    console.log("mutation executed (2nd taker)");

    //verify uses again
    await mt.mutation.reloadData();
    expect(mt.mutation.data.totalUses.toNumber()).to.eq(2);
    expect(mt.mutation.data.remainingUses.toNumber()).to.eq(0);
    expect(mt.mutation.data.state).to.deep.eq(MutationState.Exhausted);

    // ----------------- 3rd taker
    const taker3 = Keypair.generate();
    await mt.prepareTakerVaults(mt.transmuter.bankA, taker3);

    //call execute (fails)
    const { tx: tx3 } = await mt.mutation.execute(taker3.publicKey);
    tx3.addSigners(taker3);
    expect(tx3.confirm()).to.be.rejectedWith(
      UtransmuterErrors.NoMoreUsesLeft.code.toString(16)
    );

    // ----------------- reverse one taker
    const { tx: reverseTx1 } = await mt.mutation.reverse(mt.taker.publicKey);
    reverseTx1.addSigners(mt.taker);
    await expectTX(reverseTx1, "reverses mutation").to.be.fulfilled;

    //now 3rd taker can execute
    await expectTX(tx3, "executed mutation").to.be.fulfilled;

    // ----------------- reverse all takers, to restore full uses
    const { tx: reverseTx2 } = await mt.mutation.reverse(taker2.publicKey);
    reverseTx2.addSigners(taker2);
    await expectTX(reverseTx2, "reverses mutation").to.be.fulfilled;

    const { tx: reverseTx3 } = await mt.mutation.reverse(taker3.publicKey);
    reverseTx3.addSigners(taker3);
    await expectTX(reverseTx3, "reverses mutation").to.be.fulfilled;

    //verify uses again
    await mt.mutation.reloadData();
    expect(mt.mutation.data.totalUses.toNumber()).to.eq(2);
    expect(mt.mutation.data.remainingUses.toNumber()).to.eq(2);
    expect(mt.mutation.data.state).to.deep.eq(MutationState.Available);

    // ----------------- try to reverse 1 too many
    expect(reverseTx1.confirm()).to.be.rejectedWith(
      UtransmuterErrors.MutationNotComplete.code.toString(16)
    );
  });
});
