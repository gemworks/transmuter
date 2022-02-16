import "chai-bn";
import { MutationTester } from "../mutation.tester";
import { expect } from "chai";
import { RequiredUnits, VaultAction } from "../../src";
import { toBN } from "@gemworks/gem-farm-ts";
import { Keypair } from "@solana/web3.js";
import { expectTX } from "@saberhq/chai-solana";
import { UtransmuterErrors } from "../../src/idls/transmuter";

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
    expect(tx.confirm()).to.be.rejectedWith(
      UtransmuterErrors.InsufficientVaultRarityPoints.code.toString(16)
    );
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
    expect(tx.confirm()).to.be.rejectedWith(
      UtransmuterErrors.InsufficientVaultGems.code.toString(16)
    );
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
    expect(tx.confirm()).to.be.rejectedWith(
      UtransmuterErrors.InsufficientVaultGems.code.toString(16)
    );
  });

  it("tries to init a vault with a wrong bank", async () => {
    await mt.prepareMutation({});
    expect(
      mt.prepareTakerVaults(Keypair.generate().publicKey, mt.taker)
    ).to.be.rejectedWith(
      UtransmuterErrors.NoneOfTheBanksMatch.code.toString(16)
    );
  });

  it("tries to init a vault for a completed mutation", async () => {
    await mt.prepareMutation({});

    const { tx } = await mt.mutation.execute(mt.taker.publicKey);
    tx.addSigners(mt.taker);
    await expectTX(tx, "executes mutation").to.be.fulfilled;

    expect(
      mt.prepareTakerVaults(mt.transmuter.bankB, mt.taker)
    ).to.be.rejectedWith(
      UtransmuterErrors.MutationAlreadyComplete.code.toString(16)
    );
  });
});
