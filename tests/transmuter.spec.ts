import { makeSDK } from "./workspace";
import {
  MutationConfig,
  MutationWrapper,
  TransmuterWrapper,
  VaultAction,
} from "../src";
import { expectTX } from "@saberhq/chai-solana";

import "chai-bn";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
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

  let transmuter: TransmuterWrapper;
  let mutation: MutationWrapper;
  let receiver: Keypair;

  beforeEach("prep", () => {
    receiver = Keypair.generate();
  });

  const prepareTransmuter = async (bankCount: number) => {
    const { transmuterWrapper, tx } = await sdk.initTransmuter(bankCount);
    await expectTX(tx, "init new transmuter").to.be.fulfilled;
    transmuter = transmuterWrapper;

    console.log("transmuter ready");
  };

  const prepareMutation = async (vaultAction: any) => {
    const [makerMint] = await sdk.createMintAndATA(toBN(10));

    const config: MutationConfig = {
      takerTokenA: {
        gemBank: transmuter.bankA,
        requiredRarityPoints: toBN(5),
        requiredGemCount: null,
        vaultAction,
      },
      takerTokenB: null,
      takerTokenC: null,
      makerTokenA: {
        mint: makerMint,
        amount: toBN(3),
      },
      makerTokenB: null,
      makerTokenC: null,
      timeConfig: {
        mutationTimeSec: toBN(1),
        cancelWindowSec: toBN(1),
      },
      priceConfig: {
        price: toBN(0),
        payEveryTime: false,
        paid: false,
      },
      reversible: false,
    };

    const { mutationWrapper, tx } = await sdk.initMutation(
      config,
      transmuter.key,
      toBN(1)
    );
    await expectTX(tx, "init new mutation").to.be.fulfilled;
    mutation = mutationWrapper;

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
      transmuter.bankA,
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
      transmuter.bankA,
      vault,
      receiver,
      toBN(5),
      takerMint,
      takerAcc
    );

    return { vault, takerMint, takerAcc };
  };

  it("happy path (lock vault)", async () => {
    await prepareTransmuter(3); //test 3
    await prepareMutation(VaultAction.Lock);
    const { vault, takerAcc, takerMint } = await prepareReceiverVaults();

    //call execute
    const tx = await mutation.execute(receiver.publicKey);
    tx.addSigners(receiver);

    await expectTX(tx, "executes mutation").to.be.fulfilled;

    //verify vault is locked and owned by taker
    const vaultAcc = await gb.fetchVaultAcc(vault);
    expect(vaultAcc.owner.toBase58()).to.be.eq(receiver.publicKey.toBase58());
    expect(vaultAcc.locked).to.be.true;

    //verify taker can't withdraw gems
    await expect(
      gb.withdrawGem(
        transmuter.bankA,
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
    await prepareTransmuter(1); //test 2
    await prepareMutation(VaultAction.ChangeOwner);
    const { vault, takerAcc, takerMint } = await prepareReceiverVaults();

    //call execute
    const tx = await mutation.execute(receiver.publicKey);
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
      transmuter.bankA,
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
    await prepareTransmuter(1); //test 1
    await prepareMutation(VaultAction.DoNothing);
    const { vault, takerAcc, takerMint } = await prepareReceiverVaults();

    //call execute
    const tx = await mutation.execute(receiver.publicKey);
    tx.addSigners(receiver);

    await expectTX(tx, "executes mutation").to.be.fulfilled;

    //verify vault is unlocked and owned by taker
    const vaultAcc = await gb.fetchVaultAcc(vault);
    expect(vaultAcc.owner.toBase58()).to.be.eq(receiver.publicKey.toBase58());
    expect(vaultAcc.locked).to.be.false;

    //verify taker can withdraw tokens
    await gb.withdrawGem(
      transmuter.bankA,
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
