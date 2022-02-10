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

    // transmuter controls up to 3 banks
    pub bank_a: Pubkey,
    pub bank_b: Option<Pubkey>,
    pub bank_c: Option<Pubkey>,
}

impl Transmuter {
    pub fn get_seeds(&self) -> [&[u8]; 2] {
        [self.authority_seed.as_ref(), &self.authority_bump_seed]
    }
}
