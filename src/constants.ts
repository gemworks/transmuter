import { PublicKey } from "@solana/web3.js";
import { AnchorTypes, buildCoderMap } from "@saberhq/anchor-contrib";
import { UtransmuterIDL, UtransmuterJSON } from "./idls/transmuter";

// --------------------------------------- types & interfaces

export type TransmuterTypes = AnchorTypes<
  UtransmuterIDL,
  {
    transmuter: TransmuterData;
    mutation: MutationData;
    executionReceipt: ExecutionReceiptData;
  }
>;

type Accounts = TransmuterTypes["Accounts"];
export type TransmuterData = Accounts["Transmuter"];
export type MutationData = Accounts["Mutation"];
export type ExecutionReceiptData = Accounts["ExecutionReceipt"];

export type TransmuterError = TransmuterTypes["Error"];
export type TransmuterEvents = TransmuterTypes["Events"];
export type TransmuterProgram = TransmuterTypes["Program"];

export interface Programs {
  Transmuter: TransmuterProgram;
}

// --------------------------------------- constants

export const TRANSMUTER_IDLS = {
  Transmuter: UtransmuterJSON,
};

export const TRANSMUTER_ADDRESSES = {
  Transmuter: new PublicKey("4c5WjWPmecCLHMSo8bQESo26VCotSKtjiUpCPnfEPL2p"),
};

export const TRANSMUTER_CODES = buildCoderMap<{ Transmuter: TransmuterTypes }>(
  TRANSMUTER_IDLS,
  TRANSMUTER_ADDRESSES
);
