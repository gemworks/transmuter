import "chai-bn";
import { MutationTester } from "../mutation.tester";
import { RarityConfig, WhitelistType } from "@gemworks/gem-farm-ts";
import { Keypair, PublicKey } from "@solana/web3.js";
import { expectTX } from "@saberhq/chai-solana";
import { expect } from "chai";

describe("transmuter (bank instructions)", () => {
  let mt: MutationTester;

  beforeEach("setup tester class", async () => {
    mt = await MutationTester.load();
  });

  it("adds to / removes from bank whitelist", async () => {
    const addressToWhitelist = Keypair.generate().publicKey;

    //add
    const { tx, whitelistProof } = await mt.transmuter.addToBankWhitelist(
      mt.transmuter.bankA,
      addressToWhitelist,
      WhitelistType.Creator
    );
    await expectTX(tx, "add to whitelist").to.be.fulfilled;
    console.log("whitelisted");

    const proofAcc = await mt.gb.fetchWhitelistProofAcc(whitelistProof);
    expect(proofAcc.whitelistedAddress.toBase58()).to.be.eq(
      addressToWhitelist.toBase58()
    );

    //remove
    const { tx: tx2 } = await mt.transmuter.removeFromBankWhitelist(
      mt.transmuter.bankA,
      addressToWhitelist
    );
    await expectTX(tx2, "remove from whitelist").to.be.fulfilled;
    console.log("removed");

    expect(mt.gb.fetchWhitelistProofAcc(whitelistProof)).to.be.rejected;
  });

  it("adds rarities to bank", async () => {
    const configs: RarityConfig[] = [];
    const rarityAddresses: PublicKey[] = [];

    //(!) EMPIRICAL TESTING SHOWED CAN'T GO ABOVE 7, TX SIZE BECOMES TOO BIG
    for (let i = 0; i < 7; i++) {
      const mint = Keypair.generate().publicKey;

      const [rarityAddr] = await mt.gb.findRarityPDA(mt.transmuter.bankA, mint);

      configs.push({
        mint,
        rarityPoints: 11,
      });
      rarityAddresses.push(rarityAddr);
    }

    const { tx } = await mt.transmuter.addRaritiesToBank(
      mt.transmuter.bankA,
      configs
    );
    await expectTX(tx, "add rarities").to.be.fulfilled;
    console.log("added rarities");

    const results = await Promise.all(
      rarityAddresses.map((a) => mt.gb.fetchRarity(a))
    );
    for (const r of results) {
      expect(r.points).to.be.eq(11);
    }
  });
});
