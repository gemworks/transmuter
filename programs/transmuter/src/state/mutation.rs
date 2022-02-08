use crate::*;

pub const LATEST_MUTATION_VERSION: u16 = 0;

// todo add reserve space + size check
#[repr(C)]
#[account]
pub struct Mutation {
    pub version: u16,

    pub owner: Pubkey,

    pub authority: Pubkey,
    pub authority_seed: Pubkey,
    pub authority_bump_seed: [u8; 1],

    pub config: MutationConfig,

    pub paid: bool,

    pub state: MutationState,
}

impl Mutation {
    pub fn get_seeds(&self) -> [&[u8]; 2] {
        [self.authority_seed.as_ref(), &self.authority_bump_seed]
    }
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub enum MutationState {
    Open,
    Complete,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct MutationConfig {
    // in tokens
    pub in_token_a: InTokenConfig,
    pub in_token_b: Option<InTokenConfig>,
    pub in_token_c: Option<InTokenConfig>,

    // out tokens
    pub out_token_a: OutTokenConfig,
    pub out_token_b: Option<OutTokenConfig>,
    pub out_token_c: Option<OutTokenConfig>,

    pub time_settings: TimeSettings,

    pub price: u64,

    pub pay_every_time: bool,

    pub update_metadata: bool,

    pub reversible: bool,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct InTokenConfig {
    /// each gem bank has a whitelist with mints/creators allowed / not allowed
    pub gem_bank: Pubkey,

    pub amount: u64,

    pub action: SinkAction,

    // in case we need to transfer somewhere, this will record where
    pub destination: Option<Pubkey>,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize, PartialEq)]
pub enum OutTokenSource {
    // todo this can either be CM directly or a custom 3rd party program that creates NFTs
    Mint,
    Prefunded,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct OutTokenConfig {
    pub source: OutTokenSource,

    pub amount: u64,

    // only if CM
    pub candy_machine: Option<Pubkey>,

    // only if prefunded
    pub mint: Option<Pubkey>,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub enum SinkAction {
    Burn,
    Transfer,
    Preserve,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct TimeSettings {
    pub mutation_time_sec: u64,

    pub cancel_window_sec: u64,
}
