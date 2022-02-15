import "chai-bn";
import { MutationTester } from "../mutation.tester";
import { expect } from "chai";
import { RequiredUnits, VaultAction } from "../../src";
import { toBN } from "@gemworks/gem-farm-ts";
import { Keypair } from "@solana/web3.js";

describe("transmuter (vault)", () => {
  let mt: MutationTester;

  beforeEach("setup tester class", async () => {
    mt = await MutationTester.load();
  });

  it("tries to execute w/o fulfilling maker's requirements (rarity points)", async () => {
    await mt.prepareMutation({});

    //intentionally withdraw gem
    await mt.gb.withdrawGem(
      mt.transmuter.bankA,
      mt.takerVaultA,
      mt.taker,
      toBN(mt.takerTokenAmount),
      mt.takerMintA,
      Keypair.generate().publicKey
    );

    //call execute
    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    expect(tx.confirm()).to.be.rejectedWith("0x1778");
  });

  it("tries to execute w/o fulfilling maker's requirements (gem count, 2nd vault)", async () => {
    await mt.prepareMutation({
      takerTokenB: {
        gemBank: mt.transmuter.bankB,
        requiredAmount: toBN(mt.takerTokenAmount),
        requiredUnits: RequiredUnits.Gems,
        vaultAction: VaultAction.Lock,
      },
    });

    //intentionally withdraw gem
    await mt.gb.withdrawGem(
      mt.transmuter.bankB,
      mt.takerVaultB,
      mt.taker,
      toBN(mt.takerTokenAmount),
      mt.takerMintB,
      Keypair.generate().publicKey
    );

    //call execute
    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    expect(tx.confirm()).to.be.rejectedWith("0x1777");
  });

  it("tries to execute w/o fulfilling maker's requirements (gem count, 3rd vault)", async () => {
    await mt.prepareMutation({
      takerTokenB: {
        gemBank: mt.transmuter.bankB,
        requiredAmount: toBN(mt.takerTokenAmount),
        requiredUnits: RequiredUnits.Gems,
        vaultAction: VaultAction.Lock,
      },
      takerTokenC: {
        gemBank: mt.transmuter.bankC,
        requiredAmount: toBN(mt.takerTokenAmount),
        requiredUnits: RequiredUnits.Gems,
        vaultAction: VaultAction.Lock,
      },
    });

    //intentionally withdraw gem
    await mt.gb.withdrawGem(
      mt.transmuter.bankC,
      mt.takerVaultC,
      mt.taker,
      toBN(mt.takerTokenAmount),
      mt.takerMintC,
      Keypair.generate().publicKey
    );

    //call execute
    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    expect(tx.confirm()).to.be.rejectedWith("0x1777");
  });
});
