use crate::*;

pub const LATEST_TRANSMUTER_VERSION: u16 = 0;

// todo add reserve space + size check
#[repr(C)]
#[account]
pub struct Transmuter {
    pub version: u16,

    pub owner: Pubkey,

    pub authority: Pubkey,
    pub authority_seed: Pubkey,
    pub authority_bump_seed: [u8; 1],

    // transmuter controls 3 banks - but not all 3 have to be used for each mutation
    pub bank_a: Pubkey,
    pub bank_b: Pubkey,
    pub bank_c: Pubkey,
}

impl Transmuter {
    pub fn get_seeds(&self) -> [&[u8]; 2] {
        [self.authority_seed.as_ref(), &self.authority_bump_seed]
    }
}
