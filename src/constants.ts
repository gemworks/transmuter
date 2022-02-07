import { PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { buildCoderMap } from "@saberhq/anchor-contrib";
import { UtransmuterIDL, UtransmuterJSON } from "./idls/transmuter";

export interface Programs {
  Transmuter: anchor.Program<UtransmuterIDL>;
}

export const TRANSMUTER_IDLS = {
  Transmuter: UtransmuterJSON,
};

export const TRANSMUTER_ADDRESSES = {
  Transmuter: new PublicKey("4c5WjWPmecCLHMSo8bQESo26VCotSKtjiUpCPnfEPL2p"),
};

export const TRANSMUTER_CODES = buildCoderMap(
  TRANSMUTER_IDLS,
  TRANSMUTER_ADDRESSES
);
