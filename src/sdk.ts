import {
  AugmentedProvider,
  Provider,
  SolanaAugmentedProvider,
  TransactionEnvelope,
} from "@saberhq/solana-contrib";
import { Programs, TRANSMUTER_ADDRESSES, TRANSMUTER_IDLS } from "./constants";
import { newProgramMap } from "@saberhq/anchor-contrib";
import { MutationWrapper, TransmuterWrapper } from "./wrappers";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import { BN } from "@project-serum/anchor";
import { GEM_BANK_PROG_ID, toBN } from "@gemworks/gem-farm-ts";
import {
  createMint,
  getATAAddress,
  getOrCreateATA,
  Token,
  TokenAmount,
  TokenOwner,
} from "@saberhq/token-utils";
import { TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import {
  findExecutionReceiptPDA,
  findTokenEscrowPDA,
  findTransmuterAuthorityPDA,
} from "./pda";

export const feeAccount = new PublicKey(
  "2U9sG2BRF8TbUjor1Dms8rRRxVqAjJSktZYCwhXFNYCC"
);

export interface TakerTokenConfig {
  gemBank: PublicKey;
  requiredAmount: BN;
  requiredUnits: any;
  vaultAction: any;
}

export interface MakerTokenConfig {
  mint: PublicKey;
  totalFunding: BN;
  amountPerUse: BN;
}

export const RequiredUnits = {
  RarityPoints: { rarityPoints: {} },
  Gems: { gems: {} },
};

export const VaultAction = {
  ChangeOwner: { changeOwner: {} },
  Lock: { lock: {} },
  DoNothing: { doNothing: {} },
};

export const MutationState = {
  Exhausted: { exhausted: {} },
  Available: { available: {} },
};

export const ExecutionState = {
  NotStarted: { notStarted: {} },
  Pending: { pending: {} },
  Complete: { complete: {} },
};

export interface PriceConfig {
  priceLamports: BN;
  reversalPriceLamports: BN;
}

export interface MutationConfig {
  takerTokenA: TakerTokenConfig;
  takerTokenB: TakerTokenConfig | null;
  takerTokenC: TakerTokenConfig | null;

  makerTokenA: MakerTokenConfig;
  makerTokenB: MakerTokenConfig | null;
  makerTokenC: MakerTokenConfig | null;

  price: PriceConfig;

  mutationDurationSec: BN;

  reversible: boolean;
}

export class TransmuterSDK {
  constructor(
    readonly provider: AugmentedProvider,
    readonly programs: Programs
  ) {}

  // --------------------------------------- fetchers

  async fetchReceipt(mutation: PublicKey, taker: PublicKey) {
    const [receiptAddr] = await findExecutionReceiptPDA(mutation, taker);
    return this.programs.Transmuter.account.executionReceipt.fetch(receiptAddr);
  }

  // --------------------------------------- finders

  async findAllReceipts(
    transmuter?: PublicKey,
    mutation?: PublicKey,
    taker?: PublicKey
  ) {
    let filter = [];
    if (transmuter) {
      filter = [
        {
          memcmp: {
            offset: 8, //need to prepend 8 bytes for anchor's disc
            bytes: transmuter.toBase58(),
          },
        },
      ];
    } else if (mutation) {
      filter = [
        {
          memcmp: {
            offset: 40, //need to prepend 8 bytes for anchor's disc
            bytes: mutation.toBase58(),
          },
        },
      ];
    } else if (taker) {
      filter = [
        {
          memcmp: {
            offset: 72, //need to prepend 8 bytes for anchor's disc
            bytes: taker.toBase58(),
          },
        },
      ];
    }

    return this.programs.Transmuter.account.executionReceipt.all(filter);
  }

  // --------------------------------------- initializers

  async initTransmuter(payer?: PublicKey) {
    const transmuter = Keypair.generate();
    const bankA = Keypair.generate();
    const bankB = Keypair.generate();
    const bankC = Keypair.generate();

    const [authority, bump] = await findTransmuterAuthorityPDA(
      transmuter.publicKey
    );

    const ix = this.programs.Transmuter.instruction.initTransmuter(bump, {
      accounts: {
        transmuter: transmuter.publicKey,
        owner: this.provider.wallet.publicKey,
        authority,
        bankA: bankA.publicKey,
        bankB: bankB.publicKey,
        bankC: bankC.publicKey,
        gemBank: GEM_BANK_PROG_ID,
        payer: payer ?? this.provider.wallet.publicKey,
        feeAcc: feeAccount,
        systemProgram: SystemProgram.programId,
      },
    });

    return {
      transmuterWrapper: new TransmuterWrapper(
        this,
        transmuter.publicKey,
        bankA.publicKey,
        bankB.publicKey,
        bankC.publicKey
      ),
      authority,
      tx: new TransactionEnvelope(
        this.provider,
        [ix],
        [transmuter, bankA, bankB, bankC]
      ),
    };
  }

  async initMutation(
    config: MutationConfig,
    transmuter: PublicKey,
    uses: BN,
    payer?: PublicKey,
    name: string = "mutation"
  ) {
    const mutation = Keypair.generate();

    const tokenAMint =
      config.makerTokenA.mint ?? (await createMint(this.provider));
    const [tokenAEscrow, tokenAEscrowBump, tokenASource] =
      await this.prepTokenAccounts(mutation.publicKey, tokenAMint);

    const tokenBMint =
      config.makerTokenB && config.makerTokenB.mint
        ? config.makerTokenB.mint
        : await createMint(this.provider);
    const [tokenBEscrow, tokenBEscrowBump, tokenBSource] =
      await this.prepTokenAccounts(mutation.publicKey, tokenBMint);

    const tokenCMint =
      config.makerTokenC && config.makerTokenC.mint
        ? config.makerTokenC.mint
        : await createMint(this.provider);
    const [tokenCEscrow, tokenCEscrowBump, tokenCSource] =
      await this.prepTokenAccounts(mutation.publicKey, tokenCMint);

    const [authority, bump] = await findTransmuterAuthorityPDA(transmuter);

    const ix = this.programs.Transmuter.instruction.initMutation(
      bump,
      tokenBEscrowBump,
      tokenCEscrowBump,
      config as any,
      uses,
      name,
      {
        accounts: {
          transmuter,
          mutation: mutation.publicKey,
          owner: this.provider.wallet.publicKey,
          authority,
          tokenAEscrow,
          tokenASource,
          tokenAMint,
          tokenBEscrow,
          tokenBSource,
          tokenBMint,
          tokenCEscrow,
          tokenCSource,
          tokenCMint,
          payer: payer ?? this.provider.wallet.publicKey,
          feeAcc: feeAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
      }
    );

    return {
      mutationWrapper: new MutationWrapper(
        this,
        mutation.publicKey,
        transmuter
      ),
      authority,
      tx: new TransactionEnvelope(this.provider, [ix], [mutation]),
    };
  }

  // --------------------------------------- helpers

  async prepTokenAccounts(
    mutation: PublicKey,
    tokenMint: PublicKey,
    owner?: PublicKey
  ): Promise<[PublicKey, number, PublicKey]> {
    const [tokenEscrow, tokenEscrowBump] = await findTokenEscrowPDA(
      mutation,
      tokenMint
    );
    const tokenAcc = await getATAAddress({
      mint: tokenMint,
      owner: owner ?? this.provider.wallet.publicKey,
    });

    return [tokenEscrow, tokenEscrowBump, tokenAcc];
  }

  async createMintAndATA(initialFunding: u64, owner?: Keypair) {
    //create mint
    const mint = await createMint(
      this.provider,
      owner ? owner.publicKey : undefined
    );

    //create ATA ix
    const { address: ata, instruction } = await getOrCreateATA({
      provider: this.provider,
      mint,
      owner: owner ? owner.publicKey : undefined,
    });

    //create mintTo ix
    const token = Token.fromMint(mint, 0);
    const tokenOwner = new TokenOwner(
      owner ? owner.publicKey : this.provider.wallet.publicKey
    );
    const amount = new TokenAmount(token, initialFunding);
    const mintToIx = tokenOwner.mintTo(amount, ata);

    //prep & send tx
    const mintTx = new TransactionEnvelope(
      this.provider,
      [instruction, mintToIx],
      [owner]
    );
    await mintTx.confirm();

    return [mint, ata];
  }

  createExtraComputeIx(newComputeBudget: number): TransactionInstruction {
    const data = Buffer.from(
      Uint8Array.of(0, ...toBN(newComputeBudget).toArray("le", 4))
    );

    return new TransactionInstruction({
      keys: [],
      programId: new PublicKey("ComputeBudget111111111111111111111111111111"),
      data,
    });
  }

  // --------------------------------------- load sdk

  static load({
    provider,
    addresses = TRANSMUTER_ADDRESSES,
  }: {
    provider: Provider;
    addresses?: { [K in keyof Programs]: PublicKey };
  }): TransmuterSDK {
    const programs = newProgramMap<Programs>(
      provider,
      TRANSMUTER_IDLS,
      addresses
    );
    return new TransmuterSDK(new SolanaAugmentedProvider(provider), programs);
  }
}
