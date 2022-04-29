import "chai-as-promised";
import "chai-bn";

import * as anchor from "@project-serum/anchor";
import { chaiSolana } from "@saberhq/chai-solana";
import { SolanaProvider } from "@saberhq/solana-contrib";
import chai from "chai";

import { TransmuterSDK } from "../src";

chai.use(chaiSolana);

export const makeSDK = (): TransmuterSDK => {
  const anchorProvider = anchor.AnchorProvider.env();
  anchor.setProvider(anchorProvider);

  const provider = SolanaProvider.init({
    connection: anchorProvider.connection,
    wallet: anchorProvider.wallet,
    opts: anchorProvider.opts,
  });

  return TransmuterSDK.load({ provider });
};
