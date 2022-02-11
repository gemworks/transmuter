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
} from "@solana/web3.js";
import { BN } from "@project-serum/anchor";
import { GEM_BANK_PROG_ID } from "@gemworks/gem-farm-ts";
import {
  createMint,
  getATAAddress,
  getOrCreateATA,
  Token,
  TokenAmount,
  TokenOwner,
} from "@saberhq/token-utils";
import { TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";

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

export interface PriceConfig {
  priceLamports: BN;
  payEveryTime: boolean;
  paid: boolean;
}

export interface MutationConfig {
  takerTokenA: TakerTokenConfig;
  takerTokenB: TakerTokenConfig | null;
  takerTokenC: TakerTokenConfig | null;

  makerTokenA: MakerTokenConfig;
  makerTokenB: MakerTokenConfig | null;
  makerTokenC: MakerTokenConfig | null;

  price: PriceConfig;

  mutationTimeSec: BN;

  reversible: boolean;
}

export class TransmuterSDK {
  constructor(
    readonly provider: AugmentedProvider,
    readonly programs: Programs
  ) {}

  // --------------------------------------- pda derivations

  async findTransmuterAuthorityPDA(
    transmuter: PublicKey
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [transmuter.toBytes()],
      this.programs.Transmuter.programId
    );
  }

  async findTokenEscrowPDA(
    mutation: PublicKey,
    mint: PublicKey
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from("escrow"), mutation.toBytes(), mint.toBytes()],
      this.programs.Transmuter.programId
    );
  }

  //todo should be using gem farm's instead, but need to re-do the sdk for that
  async findVaultPDA(
    bank: PublicKey,
    creator: PublicKey
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from("vault"), bank.toBytes(), creator.toBytes()],
      GEM_BANK_PROG_ID
    );
  }

  async findExecutionReceiptPDA(
    mutation: PublicKey,
    taker: PublicKey
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from("receipt"), mutation.toBytes(), taker.toBytes()],
      this.programs.Transmuter.programId
    );
  }

  // --------------------------------------- initializers

  async initTransmuter(
    bankCount: number, //1-3
    payer?: PublicKey
  ) {
    const transmuter = Keypair.generate();
    const bankA = Keypair.generate();
    let bankB;
    let bankC;

    const signers: Keypair[] = [transmuter, bankA];
    const remainingAccounts = [];

    if (bankCount >= 2) {
      bankB = Keypair.generate();
      signers.push(bankB);
      remainingAccounts.push({
        pubkey: bankB.publicKey,
        isWritable: true,
        isSigner: true,
      });
    }
    if (bankCount >= 3) {
      bankC = Keypair.generate();
      signers.push(bankC);
      remainingAccounts.push({
        pubkey: bankC.publicKey,
        isWritable: true,
        isSigner: true,
      });
    }

    const [authority, bump] = await this.findTransmuterAuthorityPDA(
      transmuter.publicKey
    );

    const ix = this.programs.Transmuter.instruction.initTransmuter(bump, {
      accounts: {
        transmuter: transmuter.publicKey,
        owner: this.provider.wallet.publicKey,
        authority,
        bankA: bankA.publicKey,
        gemBank: GEM_BANK_PROG_ID,
        payer: payer ?? this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      remainingAccounts,
    });

    return {
      transmuterWrapper: new TransmuterWrapper(
        this,
        transmuter.publicKey,
        bankA.publicKey,
        bankB ? bankB.publicKey : undefined,
        bankC ? bankC.publicKey : undefined
      ),
      tx: new TransactionEnvelope(this.provider, [ix], signers),
    };
  }

  async initMutation(
    config: MutationConfig,
    transmuter: PublicKey,
    uses: BN,
    payer?: PublicKey
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

    const [authority, bump] = await this.findTransmuterAuthorityPDA(transmuter);

    const ix = this.programs.Transmuter.instruction.initMutation(
      bump,
      tokenAEscrowBump,
      tokenBEscrowBump,
      tokenCEscrowBump,
      config as any,
      uses,
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
      tx: new TransactionEnvelope(this.provider, [ix], [mutation]),
    };
  }

  // --------------------------------------- helpers

  async prepTokenAccounts(
    mutation: PublicKey,
    tokenMint: PublicKey,
    owner?: PublicKey
  ): Promise<[PublicKey, number, PublicKey]> {
    const [tokenEscrow, tokenEscrowBump] = await this.findTokenEscrowPDA(
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

  // --------------------------------------- load sdk

  static load({
    provider,
    addresses = TRANSMUTER_ADDRESSES,
  }: {
    provider: Provider;
    addresses?: any; //todo
  }): TransmuterSDK {
    const programs = newProgramMap<Programs>(
      provider,
      TRANSMUTER_IDLS,
      addresses
    );
    return new TransmuterSDK(new SolanaAugmentedProvider(provider), programs);
  }
}
