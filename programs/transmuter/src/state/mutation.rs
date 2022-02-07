use crate::*;

pub const LATEST_MUTATION_VERSION: u16 = 0;

// todo add reserve space + size check
#[repr(C)]
#[account]
pub struct Mutation {
    pub version: u16,

    pub owner: Pubkey,

    pub config: MutationConfig,

    pub paid: bool,
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

    pub sink_settings: SinkSettings,

    pub time_settings: TimeSettings,

    pub pay_every_time: bool,

    pub update_metadata: bool,

    pub reversible: bool,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct InTokenConfig {
    /// each gem bank has a whitelist with mints/creators allowed / not allowed
    pub gem_bank: Pubkey,

    pub count: u64,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub enum OutTokenSource {
    Mint,
    Prefunded,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct OutTokenConfig {
    pub source: OutTokenSource,

    pub count: u64,
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
pub struct SinkSettings {
    pub action: SinkAction,

    pub destination: Option<Pubkey>,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct TimeSettings {
    pub mutation_time_sec: u64,

    pub cancel_window_sec: u64,
}
