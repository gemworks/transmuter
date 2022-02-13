import { RequiredUnits, VaultAction } from "../src";
import { expectTX } from "@saberhq/chai-solana";

import "chai-bn";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { pause, toBN } from "@gemworks/gem-farm-ts";
import { expect } from "chai";
import { MutationTester } from "./mutation.tester";

describe("transmuter", () => {
  let mt: MutationTester;

  beforeEach("setup tester class", async () => {
    mt = await MutationTester.load();
  });

  it("happy path (lock vault)", async () => {
    await mt.prepareMutation({});

    //call execute
    const tx = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;

    //verify fee paid
    const newBalance = await mt.conn.getBalance(mt.taker.publicKey);
    expect(newBalance).to.be.lessThan(2 * LAMPORTS_PER_SOL);

    //verify vault is locked and owned by taker
    await mt.verifyVault(true, mt.taker);

    //verify tokens are indeed in taker's wallet
    await mt.verifyTakerReceivedMakerTokens();
  });

  it("happy path (change owner)", async () => {
    await mt.prepareMutation({
      vaultAction: VaultAction.ChangeOwner,
    });

    //call execute
    const tx = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;

    //verify vault is unlocked and owned by mutation maker
    await mt.verifyVault(false, mt.maker);

    //verify tokens are indeed in taker's wallet
    await mt.verifyTakerReceivedMakerTokens();
  });

  it("happy path (do nothing)", async () => {
    await mt.prepareMutation({
      vaultAction: VaultAction.DoNothing,
    });

    //call execute
    const tx = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;

    //verify vault is unlocked and owned by taker
    await mt.verifyVault(false, mt.taker);

    //verify tokens are indeed in taker's wallet
    await mt.verifyTakerReceivedMakerTokens();
  });

  //using max maker tokens and max taker tokens to test out compute budget
  it("happy path (mutation time > 0, 3x3))", async () => {
    await mt.prepareMutation({
      mutationTimeSec: toBN(5),
      takerTokenB: {
        gemBank: mt.transmuter.bankB,
        requiredAmount: toBN(mt.takerTokenAmount),
        requiredUnits: RequiredUnits.RarityPoints,
        vaultAction: VaultAction.Lock,
      },
      takerTokenC: {
        gemBank: mt.transmuter.bankC,
        requiredAmount: toBN(mt.takerTokenAmount),
        requiredUnits: RequiredUnits.RarityPoints,
        vaultAction: VaultAction.Lock,
      },
      makerTokenBAmount: mt.makerTokenAmount,
      makerTokenCAmount: mt.makerTokenAmount,
    });

    //call execute
    const tx = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("executed once");

    //verify vault is locked and owned by taker
    await mt.verifyVault(true, mt.taker);

    //verify no tokens in taker's wallet after first call
    await mt.verifyTakerReceivedMakerTokens(toBN(0));

    //try to call immediately again - will fail, since not enough time passed
    await expect(tx.confirm()).to.be.rejected;
    console.log("tried to execute twice (failure expected)");

    // todo
    // try {
    //   await tx.confirm();
    // } catch (e) {
    //   expect(e.message).to.include("0x177a");
    // }

    console.log("pausing for mutation duration");
    await pause(6000);

    //call again
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("executed third time");

    //this time tokens present
    await mt.verifyTakerReceivedMakerTokens();
  });

  it("happy path (reversible, 3x3))", async () => {
    await mt.prepareMutation({
      takerTokenB: {
        gemBank: mt.transmuter.bankB,
        requiredAmount: toBN(mt.takerTokenAmount),
        requiredUnits: RequiredUnits.RarityPoints,
        vaultAction: VaultAction.Lock,
      },
      takerTokenC: {
        gemBank: mt.transmuter.bankC,
        requiredAmount: toBN(mt.takerTokenAmount),
        requiredUnits: RequiredUnits.RarityPoints,
        vaultAction: VaultAction.Lock,
      },
      makerTokenBAmount: mt.makerTokenAmount,
      makerTokenCAmount: mt.makerTokenAmount,
      reversible: true,
    });

    //call execute
    const tx = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("executed once");

    //verify vault is locked and owned by taker
    await mt.verifyVault(true, mt.taker);

    //this time tokens present
    await mt.verifyTakerReceivedMakerTokens();
  });

  it("happy path (reverse)", async () => {
    await mt.prepareMutation({ reversible: true });

    //call execute
    const tx = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("executed");

    //call reverse
    const reverseTx = await mt.mutation.reverse(mt.taker.publicKey);
    reverseTx.addSigners(mt.taker);
    await expectTX(reverseTx, "reverses mutation").to.be.fulfilled;

    //will have paid TWICE
    const newBalance = await mt.conn.getBalance(mt.taker.publicKey);
    expect(newBalance).to.be.lessThan(LAMPORTS_PER_SOL);

    //verify vault is UNlocked and owned by taker
    await mt.verifyVault(false, mt.taker);

    //verify NO tokens are indeed in taker's wallet
    await mt.verifyTakerReceivedMakerTokens(toBN(0));
  });
});
