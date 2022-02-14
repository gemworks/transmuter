import { ExecutionState, RequiredUnits, VaultAction } from "../src";
import { expectTX } from "@saberhq/chai-solana";

import "chai-bn";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { pause, toBN } from "@gemworks/gem-farm-ts";
import { expect } from "chai";
import { MutationTester } from "./mutation.tester";

describe("transmuter (main spec)", () => {
  let mt: MutationTester;

  beforeEach("setup tester class", async () => {
    mt = await MutationTester.load();
  });

  it("execute mutation (lock vault)", async () => {
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

  it("execute mutation (change owner)", async () => {
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

  it("execute mutation (do nothing)", async () => {
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
  it("execute mutation (mutation time > 0, 3x3))", async () => {
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
      uses: toBN(2),
    });

    //call execute
    const tx = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("executed once");

    //verify vault is locked and owned by taker
    await mt.verifyVault(true, mt.taker);

    //verify receipt exists and is pending
    const receipt = await mt.sdk.fetchReceipt(
      mt.mutation.key,
      mt.taker.publicKey
    );
    expect(receipt.state == ExecutionState.Pending);
    expect(receipt.mutationCompleteTs.toNumber()).to.be.gt(+new Date() / 1000);
    expect(receipt.mutationCompleteTs.toNumber()).to.be.lt(
      +new Date() / 1000 + 10
    );

    //verify no tokens in taker's wallet after first call
    await mt.verifyTakerReceivedMakerTokens(toBN(0));

    //try to call immediately again - will fail, since not enough time passed
    expect(tx.confirm()).to.be.rejectedWith("0x177b"); //MutationNotComplete
    console.log("tried to execute twice (failure expected)");

    console.log("pausing for mutation duration");
    await pause(6000);

    //call again
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("executed third time");

    //verify receipt exists and is complete
    const receipt2 = await mt.sdk.fetchReceipt(
      mt.mutation.key,
      mt.taker.publicKey
    );
    expect(receipt2.state == ExecutionState.Complete);

    //this time tokens present
    await mt.verifyTakerReceivedMakerTokens();
  });

  it("execute mutation (reversible, 3x3))", async () => {
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

  it("reverse mutation (3x3)", async () => {
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
    console.log("executed");

    // verify vault locked & belongs to owner
    const vaultAcc = await mt.gb.fetchVaultAcc(mt.takerVaultA);
    expect(vaultAcc.owner.toBase58()).to.be.eq(mt.taker.publicKey.toBase58());
    expect(vaultAcc.locked).to.be.eq(true);

    //verify receipt exists and is complete
    const receipt = await mt.sdk.fetchReceipt(
      mt.mutation.key,
      mt.taker.publicKey
    );
    expect(receipt.state == ExecutionState.Complete);

    //call reverse
    const reverseTx = await mt.mutation.reverse(mt.taker.publicKey);
    reverseTx.addSigners(mt.taker);
    await expectTX(reverseTx, "reverses mutation").to.be.fulfilled;

    //will have paid TWICE
    const newBalance = await mt.conn.getBalance(mt.taker.publicKey);
    expect(newBalance).to.be.lessThan(LAMPORTS_PER_SOL);

    //verify vault unlocked & belongs to owner
    const vaultAcc2 = await mt.gb.fetchVaultAcc(mt.takerVaultA);
    expect(vaultAcc2.owner.toBase58()).to.be.eq(mt.taker.publicKey.toBase58());
    expect(vaultAcc2.locked).to.be.eq(false);

    //verify NO tokens are indeed in taker's wallet
    await mt.verifyTakerReceivedMakerTokens(toBN(0));

    //call execute again, to prove same taker can re-execute
    await mt.doAirdrop(mt.taker.publicKey, LAMPORTS_PER_SOL); //need more funding
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("re-executed");

    await mt.verifyTakerReceivedMakerTokens();
  });

  it.only("destroys mutation (3x3)", async () => {
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

    const tx = await mt.mutation.destroy(mt.transmuter.key);
    await expectTX(tx, "destroy mutation").to.be.fulfilled;
  });
});
