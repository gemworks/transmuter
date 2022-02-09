import { makeSDK } from "./workspace";
import { MutationConfig, MutationWrapper, VaultAction } from "../src";
import { expectTX } from "@saberhq/chai-solana";

import "chai-bn";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { GEM_BANK_PROG_ID, GemBankClient, toBN } from "@gemworks/gem-farm-ts";
import { expect } from "chai";

describe("transmuter", () => {
  const sdk = makeSDK();

  const bankIdl = require("./programs/gem_bank.json");
  const gb = new GemBankClient(
    sdk.provider.connection,
    sdk.provider.wallet as any,
    bankIdl,
    GEM_BANK_PROG_ID
  );

  let gemBank: Keypair;
  let mutation: Keypair;
  let receiver: Keypair;

  let mutationWrapper: MutationWrapper;

  beforeEach("prep", () => {
    gemBank = Keypair.generate();
    mutation = Keypair.generate();
    receiver = Keypair.generate();
  });

  const prepareMutation = async (vaultAction: any) => {
    const [makerMint] = await sdk.createMintAndATA(toBN(10));

    const config: MutationConfig = {
      takerTokenA: {
        gemBank: gemBank.publicKey,
        amount: toBN(5),
        vaultAction,
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

    console.log("mutation ready");
  };

  const prepareReceiverVaults = async () => {
    //fund receiver
    await sdk.provider.connection
      .requestAirdrop(receiver.publicKey, LAMPORTS_PER_SOL)
      .then((sig) =>
        sdk.provider.connection.confirmTransaction(sig, "confirmed")
      );

    //create vaults
    const { vault } = await gb.initVault(
      gemBank.publicKey,
      receiver,
      receiver,
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

    return { vault, takerMint, takerAcc };
  };

  it("happy path (lock vault)", async () => {
    await prepareMutation(VaultAction.Lock);
    const { vault, takerAcc, takerMint } = await prepareReceiverVaults();

    //call execute
    const tx = await mutationWrapper.execute(receiver.publicKey);
    tx.addSigners(receiver);

    await expectTX(tx, "executes mutation").to.be.fulfilled;

    //verify vault is locked and owned by taker
    const vaultAcc = await gb.fetchVaultAcc(vault);
    expect(vaultAcc.owner.toBase58()).to.be.eq(receiver.publicKey.toBase58());
    expect(vaultAcc.locked).to.be.true;

    //verify taker can't withdraw gems
    await expect(
      gb.withdrawGem(
        gemBank.publicKey,
        vault,
        receiver,
        toBN(5),
        takerMint,
        Keypair.generate().publicKey
      )
    ).to.be.rejectedWith("0x1784");

    //verify tokens are indeed in taker's wallet
    const result = parseInt(
      (await sdk.provider.connection.getTokenAccountBalance(takerAcc)).value
        .amount
    );
    expect(result).to.eq(5);
  });

  it("happy path (change owner)", async () => {
    await prepareMutation(VaultAction.ChangeOwner);
    const { vault, takerAcc, takerMint } = await prepareReceiverVaults();

    //call execute
    const tx = await mutationWrapper.execute(receiver.publicKey);
    tx.addSigners(receiver);

    await expectTX(tx, "executes mutation").to.be.fulfilled;

    //verify vault is unlocked and owned by mutation maker
    const vaultAcc = await gb.fetchVaultAcc(vault);
    expect(vaultAcc.owner.toBase58()).to.be.eq(
      sdk.provider.wallet.publicKey.toBase58()
    );
    expect(vaultAcc.locked).to.be.false;

    //verify mutation maker can withdraw tokens
    await gb.withdrawGem(
      gemBank.publicKey,
      vault,
      sdk.provider.wallet.publicKey,
      toBN(5),
      takerMint,
      Keypair.generate().publicKey
    );

    //verify tokens are indeed in taker's wallet
    const result = parseInt(
      (await sdk.provider.connection.getTokenAccountBalance(takerAcc)).value
        .amount
    );
    expect(result).to.eq(5);
  });

  it("happy path (do nothing)", async () => {
    await prepareMutation(VaultAction.DoNothing);
    const { vault, takerAcc, takerMint } = await prepareReceiverVaults();

    //call execute
    const tx = await mutationWrapper.execute(receiver.publicKey);
    tx.addSigners(receiver);

    await expectTX(tx, "executes mutation").to.be.fulfilled;

    //verify vault is unlocked and owned by taker
    const vaultAcc = await gb.fetchVaultAcc(vault);
    expect(vaultAcc.owner.toBase58()).to.be.eq(receiver.publicKey.toBase58());
    expect(vaultAcc.locked).to.be.false;

    //verify taker can withdraw tokens
    await gb.withdrawGem(
      gemBank.publicKey,
      vault,
      receiver,
      toBN(5),
      takerMint,
      Keypair.generate().publicKey
    );

    //verify tokens are indeed in taker's wallet
    const result = parseInt(
      (await sdk.provider.connection.getTokenAccountBalance(takerAcc)).value
        .amount
    );
    expect(result).to.eq(5);
  });
});
