import { makeSDK } from "./workspace";
import {
  MakerTokenSource,
  MutationConfig,
  MutationWrapper,
  SinkAction,
} from "../src";
import { expectTX } from "@saberhq/chai-solana";

import "chai-bn";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { GEM_BANK_PROG_ID, GemBankClient, toBN } from "@gemworks/gem-farm-ts";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { expect } from "chai";

describe("transmuter", () => {
  const sdk = makeSDK();

  const gemBank = Keypair.generate();
  const mutation = Keypair.generate();
  const receiver = Keypair.generate();

  //we'll be interacting with Gem Bank as receiver
  const bankIdl = require("./programs/gem_bank.json");
  const gb = new GemBankClient(
    sdk.provider.connection,
    new NodeWallet(receiver),
    bankIdl,
    GEM_BANK_PROG_ID
  );

  let mutationWrapper: MutationWrapper;

  before("prep", async () => {
    const [makerMint] = await sdk.createMintAndATA(toBN(10));

    const config: MutationConfig = {
      takerTokenA: {
        gemBank: gemBank.publicKey,
        amount: toBN(5),
        action: SinkAction.Burn,
        destination: Keypair.generate().publicKey,
      },
      takerTokenB: null,
      takerTokenC: null,
      makerTokenA: {
        mint: makerMint,
        amount: toBN(1),
      },
      makerTokenB: null,
      makerTokenC: null,
      timeSettings: {
        mutationTimeSec: toBN(1),
        cancelWindowSec: toBN(1),
      },
      price: toBN(0),
      payEveryTime: false,
      updateMetadata: false,
      reversible: false,
    };

    const { mutationWrapper: wrapper, tx } = await sdk.initMutation(
      config,
      mutation.publicKey
    );

    tx.addSigners(gemBank);
    tx.addSigners(mutation);

    await expectTX(tx, "init new mutation").to.be.fulfilled;
    mutationWrapper = wrapper;

    console.log("prep done");
  });

  it("happy path", async () => {
    //fund receiver
    await sdk.provider.connection
      .requestAirdrop(receiver.publicKey, LAMPORTS_PER_SOL)
      .then((sig) =>
        sdk.provider.connection.confirmTransaction(sig, "confirmed")
      );

    //create vaults
    const { vault } = await gb.initVault(
      gemBank.publicKey,
      receiver.publicKey,
      receiver.publicKey,
      receiver.publicKey,
      "abc"
    );

    //create tokens
    const [takerMint, takerAcc] = await sdk.createMintAndATA(
      toBN(10),
      receiver
    );

    //deposit tokens
    await gb.depositGem(
      gemBank.publicKey,
      vault,
      receiver,
      toBN(5),
      takerMint,
      takerAcc
    );

    //call execute
    const tx = await mutationWrapper.execute(receiver.publicKey);
    tx.addSigners(receiver);

    console.log("tx size is", tx.estimateSize());

    await expectTX(tx, "executes mutation").to.be.fulfilled;

    //verify tokens are indeed in user's wallet
    const result = parseInt(
      (await sdk.provider.connection.getTokenAccountBalance(takerAcc)).value
        .amount
    );
    expect(result).to.eq(5);

    console.log("happy path works");
  });
});
