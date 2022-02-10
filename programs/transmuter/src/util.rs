use std::convert::TryInto;

use anchor_lang::solana_program::hash::hash;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::solana_program::system_instruction::create_account;
use anchor_lang::{prelude::*, solana_program::clock};

pub fn now_ts() -> Result<u64, ProgramError> {
    //i64 -> u64 ok to unwrap
    Ok(clock::Clock::get()?.unix_timestamp.try_into().unwrap())
}

pub fn create_pda_with_space<'info>(
    pda_seeds: &[&[u8]],
    pda_info: &AccountInfo<'info>,
    space: usize,
    owner: &Pubkey,
    funder_info: &AccountInfo<'info>,
    system_program_info: &AccountInfo<'info>,
) -> ProgramResult {
    //create a PDA and allocate space inside of it at the same time
    //can only be done from INSIDE the program
    //based on https://github.com/solana-labs/solana-program-library/blob/7c8e65292a6ebc90de54468c665e30bc590c513a/feature-proposal/program/src/processor.rs#L148-L163
    invoke_signed(
        &create_account(
            &funder_info.key,
            &pda_info.key,
            1.max(Rent::get()?.minimum_balance(space)),
            space as u64,
            owner,
        ),
        &[
            funder_info.clone(),
            pda_info.clone(),
            system_program_info.clone(),
        ],
        &[pda_seeds], //this is the part you can't do outside the program
    )
}
