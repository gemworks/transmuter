import { PublicKey } from "@solana/web3.js";
import { findVaultPDA } from "@gemworks/gem-farm-ts";
import { TRANSMUTER_ADDRESSES } from "./constants";

export const findTransmuterAuthorityPDA = async (
  transmuter: PublicKey
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddress(
    [transmuter.toBytes()],
    TRANSMUTER_ADDRESSES.Transmuter
  );
};

export const findTokenEscrowPDA = async (
  mutation: PublicKey,
  mint: PublicKey
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddress(
    [Buffer.from("escrow"), mutation.toBytes(), mint.toBytes()],
    TRANSMUTER_ADDRESSES.Transmuter
  );
};

export const findVaultCreatorPDA = async (
  mutation: PublicKey,
  taker: PublicKey
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddress(
    [Buffer.from("creator"), mutation.toBytes(), taker.toBytes()],
    TRANSMUTER_ADDRESSES.Transmuter
  );
};

export const findTakerVaultPDA = async (
  bank: PublicKey,
  mutation: PublicKey,
  taker: PublicKey
) => {
  const [creator, creatorBump] = await findVaultCreatorPDA(mutation, taker);
  const [vault, vaultBump] = await findVaultPDA(bank, creator);
  return { creator, creatorBump, vault, vaultBump };
};

export const findExecutionReceiptPDA = async (
  mutation: PublicKey,
  taker: PublicKey
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddress(
    [Buffer.from("receipt"), mutation.toBytes(), taker.toBytes()],
    TRANSMUTER_ADDRESSES.Transmuter
  );
};
