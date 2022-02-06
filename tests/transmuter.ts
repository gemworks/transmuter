import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Transmuter } from '../target/types/transmuter';

describe('transmuter', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Transmuter as Program<Transmuter>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
