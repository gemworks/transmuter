import { PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { buildCoderMap } from "@saberhq/anchor-contrib";
import { IDL, Transmuter } from "./types/transmuter";

//todo doesn't work - dig deeper into how Goki are doing it
export type MutationData = Programs["Transmuter"]["account"]["mutation"];
export type MutationProgram = Programs["Transmuter"];

export interface Programs {
  Transmuter: anchor.Program<Transmuter>;
}

export const TRANSMUTER_IDLS = {
  Transmuter: IDL,
};

export const TRANSMUTER_ADDRESSES = {
  Transmuter: new PublicKey("4c5WjWPmecCLHMSo8bQESo26VCotSKtjiUpCPnfEPL2p"),
};

export const TRANSMUTER_CODES = buildCoderMap(
  TRANSMUTER_IDLS,
  TRANSMUTER_ADDRESSES
);
