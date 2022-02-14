import "chai-bn";
import { MutationTester } from "./mutation.tester";
import { expect } from "chai";
import { RequiredUnits, VaultAction } from "../src";
import { toBN } from "@gemworks/gem-farm-ts";

describe("transmuter (bad config)", () => {
  let mt: MutationTester;

  beforeEach("setup tester class", async () => {
    mt = await MutationTester.load();
  });

  it("tries a reversible mutation w/ 1st non-lock vault", async () => {
    await mt.prepareMutation({
      vaultAction: VaultAction.DoNothing,
      reversible: true,
      mutationInitError: "0x177a",
    });
  });

  it("tries a reversible mutation w/ 3rd non-lock vault", async () => {
    await mt.prepareMutation({
      vaultAction: VaultAction.Lock,
      reversible: true,
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
        vaultAction: VaultAction.DoNothing, //<-- should cause to fail
      },
      mutationInitError: "0x177a",
    });
  });
});
