import { ExecutionState, RequiredUnits, VaultAction } from "../src";
import { expectTX } from "@saberhq/chai-solana";

import "chai-bn";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { pause, stringToBytes, toBN } from "@gemworks/gem-farm-ts";
import { expect } from "chai";
import { MutationTester } from "./mutation.tester";

describe("transmuter (main spec)", () => {
  let mt: MutationTester;

  beforeEach("setup tester class", async () => {
    mt = await MutationTester.load();
  });

  it("execute mutation (lock vault)", async () => {
    await mt.prepareMutation({});

    await mt.mutation.reloadData();
    expect(mt.mutation.data.name).to.deep.include.members(
      stringToBytes("mutation123")
    );

    const oldBalance = await mt.conn.getBalance(mt.taker.publicKey);

    //call execute
    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;

    //verify fee paid
    const newBalance = await mt.conn.getBalance(mt.taker.publicKey);
    expect(newBalance).to.be.lessThan(oldBalance - LAMPORTS_PER_SOL);

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
    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
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
    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;

    //verify vault is unlocked and owned by taker
    await mt.verifyVault(false, mt.taker);

    //verify tokens are indeed in taker's wallet
    await mt.verifyTakerReceivedMakerTokens();
  });

  //using max maker tokens and max taker tokens to test out compute budget
  //also tests receipts behave the way they should
  it("execute mutation (lock vault, mutation time > 0, 3x3))", async () => {
    await mt.prepareMutation({
      mutationDurationSec: toBN(5),
      takerTokenB: {
        gemBank: mt.transmuter.bankB,
        requiredAmount: toBN(mt.takerTokenAmountPerUse.mul(toBN(2))), //have to manually mult
        requiredUnits: RequiredUnits.RarityPoints,
        vaultAction: VaultAction.Lock,
      },
      takerTokenC: {
        gemBank: mt.transmuter.bankC,
        requiredAmount: toBN(mt.takerTokenAmountPerUse.mul(toBN(2))), //have to manually mult
        requiredUnits: RequiredUnits.RarityPoints,
        vaultAction: VaultAction.Lock,
      },
      makerTokenBAmountPerUse: mt.makerTokenAmount,
      makerTokenCAmountPerUse: mt.makerTokenAmount,
      uses: toBN(2),
    });

    // ----------------- 1st execution
    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
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

    // ----------------- 2nd (failed) execution, since not enough time passed
    expect(tx.confirm()).to.be.rejectedWith("0x177b"); //MutationNotComplete
    console.log("tried to execute twice (failure expected)");

    console.log("pausing for mutation duration");
    await pause(6000);

    // ----------------- 3rd execution
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("executed again");

    //verify vault REMAINS LOCKED and owned by taker
    await mt.verifyVault(true, mt.taker);

    //verify receipt exists and is complete
    const receipt2 = await mt.sdk.fetchReceipt(
      mt.mutation.key,
      mt.taker.publicKey
    );
    expect(receipt2.state == ExecutionState.Complete);

    //this time tokens present
    await mt.verifyTakerReceivedMakerTokens();
  });

  it("execute mutation (change owner, mutation time > 0, 3x3))", async () => {
    await mt.prepareMutation({
      vaultAction: VaultAction.ChangeOwner,
      mutationDurationSec: toBN(5),
      takerTokenB: {
        gemBank: mt.transmuter.bankB,
        requiredAmount: toBN(mt.takerTokenAmountPerUse.mul(toBN(2))), //have to manually mult
        requiredUnits: RequiredUnits.RarityPoints,
        vaultAction: VaultAction.Lock,
      },
      takerTokenC: {
        gemBank: mt.transmuter.bankC,
        requiredAmount: toBN(mt.takerTokenAmountPerUse.mul(toBN(2))), //have to manually mult
        requiredUnits: RequiredUnits.RarityPoints,
        vaultAction: VaultAction.Lock,
      },
      makerTokenBAmountPerUse: mt.makerTokenAmount,
      makerTokenCAmountPerUse: mt.makerTokenAmount,
      uses: toBN(2),
    });

    //call execute
    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("executed once");

    //verify vault is locked and owned by taker
    await mt.verifyVault(true, mt.taker);

    //verify no tokens in taker's wallet after first call
    await mt.verifyTakerReceivedMakerTokens(toBN(0));

    console.log("pausing for mutation duration");
    await pause(6000);

    //call again
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("executed again");

    //verify vault is UNLOCKED and owned by MAKER
    await mt.verifyVault(false, mt.maker);

    //this time tokens present
    await mt.verifyTakerReceivedMakerTokens();
  });

  it("execute mutation (do nothing, mutation time > 0, 3x3))", async () => {
    await mt.prepareMutation({
      vaultAction: VaultAction.DoNothing,
      mutationDurationSec: toBN(5),
      takerTokenB: {
        gemBank: mt.transmuter.bankB,
        requiredAmount: toBN(mt.takerTokenAmountPerUse.mul(toBN(2))), //have to manually mult
        requiredUnits: RequiredUnits.RarityPoints,
        vaultAction: VaultAction.Lock,
      },
      takerTokenC: {
        gemBank: mt.transmuter.bankC,
        requiredAmount: toBN(mt.takerTokenAmountPerUse.mul(toBN(2))), //have to manually mult
        requiredUnits: RequiredUnits.RarityPoints,
        vaultAction: VaultAction.Lock,
      },
      makerTokenBAmountPerUse: mt.makerTokenAmount,
      makerTokenCAmountPerUse: mt.makerTokenAmount,
      uses: toBN(2),
    });

    //call execute
    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("executed once");

    //verify vault is locked and owned by taker
    await mt.verifyVault(true, mt.taker);

    //verify no tokens in taker's wallet after first call
    await mt.verifyTakerReceivedMakerTokens(toBN(0));

    console.log("pausing for mutation duration");
    await pause(6000);

    //call again
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("executed again");

    //verify vault is UNLOCKED and owned by TAKER
    await mt.verifyVault(false, mt.taker);

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
      makerTokenBAmountPerUse: mt.makerTokenAmount,
      makerTokenCAmountPerUse: mt.makerTokenAmount,
      reversible: true,
    });

    const oldBalance = await mt.conn.getBalance(mt.taker.publicKey);

    // ----------------- 1st execution
    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;
    console.log("executed");

    // verify vault locked & belongs to owner
    await mt.verifyVault(true, mt.taker);

    //verify receipt exists and is complete
    const receipt = await mt.sdk.fetchReceipt(
      mt.mutation.key,
      mt.taker.publicKey
    );
    expect(receipt.state == ExecutionState.Complete);

    // ----------------- reversal
    const { tx: reverseTx } = await mt.mutation.reverse(mt.taker.publicKey);
    reverseTx.addSigners(mt.taker);
    await expectTX(reverseTx, "reverses mutation").to.be.fulfilled;
    console.log("reversed");

    //will have paid TWICE (execution + reversal)
    const newBalance = await mt.conn.getBalance(mt.taker.publicKey);
    expect(newBalance).to.be.lessThan(oldBalance - 2 * LAMPORTS_PER_SOL);

    //verify vault unlocked & belongs to owner (manually, not to withdraw tokens)
    const vaultAcc2 = await mt.gb.fetchVaultAcc(mt.takerVaultA);
    expect(vaultAcc2.owner.toBase58()).to.be.eq(mt.taker.publicKey.toBase58());
    expect(vaultAcc2.locked).to.be.eq(false);

    //verify receipt exists and is not started
    const receipt2 = await mt.sdk.fetchReceipt(
      mt.mutation.key,
      mt.taker.publicKey
    );
    expect(receipt2.state == ExecutionState.NotStarted);

    //verify NO tokens are indeed in taker's wallet
    await mt.verifyTakerReceivedMakerTokens(toBN(0));

    // ----------------- 2nd execution
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
      makerTokenBAmountPerUse: mt.makerTokenAmount,
      makerTokenCAmountPerUse: mt.makerTokenAmount,
      reversible: true,
    });

    await mt.mutation.reloadData();
    const data = mt.mutation.data;

    //BEFORE - rent should be paid
    expect(await mt.conn.getBalance(data.tokenAEscrow)).to.be.gt(0);
    expect(await mt.conn.getBalance(data.tokenBEscrow)).to.be.gt(0);
    expect(await mt.conn.getBalance(data.tokenCEscrow)).to.be.gt(0);
    expect(await mt.conn.getBalance(mt.mutation.key)).to.be.gt(0);

    //BEFORE - tokens should be present
    expect(
      (await mt.conn.getTokenAccountBalance(data.tokenAEscrow)).value.uiAmount
    ).to.be.gt(0);
    expect(
      (await mt.conn.getTokenAccountBalance(data.tokenBEscrow)).value.uiAmount
    ).to.be.gt(0);
    expect(
      (await mt.conn.getTokenAccountBalance(data.tokenCEscrow)).value.uiAmount
    ).to.be.gt(0);

    const { tx } = await mt.mutation.destroy(mt.transmuter.key);
    await expectTX(tx, "destroy mutation").to.be.fulfilled;

    //AFTER - rent should be empty
    expect((await mt.conn.getBalance(data.tokenAEscrow)) == 0);
    expect((await mt.conn.getBalance(data.tokenBEscrow)) == 0);
    expect((await mt.conn.getBalance(data.tokenCEscrow)) == 0);
    expect((await mt.conn.getBalance(mt.mutation.key)) == 0);

    //AFTER - tokens should be empty
    expect(mt.conn.getTokenAccountBalance(data.tokenAEscrow)).to.be.rejected;
    expect(mt.conn.getTokenAccountBalance(data.tokenBEscrow)).to.be.rejected;
    expect(mt.conn.getTokenAccountBalance(data.tokenCEscrow)).to.be.rejected;
  });

  it("executes multiple mutations for same taker", async () => {
    //transmuter 1
    await mt.prepareMutation({});

    //transmuter 2
    const mt2 = await MutationTester.load(mt.transmuter);
    await mt2.prepareMutation({});

    //execute mutation 1
    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;

    //verify vault count (1 for each taker)
    expect((await mt.gb.fetchAllVaultPDAs(mt.transmuter.bankA)).length == 2);

    //execute mutation 2
    await mt2.prepareTakerVaults(mt.transmuter.bankA, mt.taker);
    const { tx: tx2 } = await mt2.mutation.execute(mt.taker.publicKey);
    tx2.addSigners(mt.taker);
    await expectTX(tx2, "executes mutation").to.be.fulfilled;

    //verify vault count (1 for mt2.taker, 2 for mt.taker)
    expect((await mt.gb.fetchAllVaultPDAs(mt.transmuter.bankA)).length == 3);
  });

  it("updates transmuter owner", async () => {
    const newOwner = Keypair.generate().publicKey;

    const { tx } = await mt.transmuter.updateTransmuter(newOwner);
    await expectTX(tx, "updates owner").to.be.fulfilled;

    await mt.transmuter.reloadData();
    expect((<any>mt.transmuter.data).owner.toBase58()).to.be.eq(
      newOwner.toBase58()
    );
  });
});
