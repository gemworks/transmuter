use crate::*;

pub const LATEST_TRANSMUTER_VERSION: u16 = 0;

// todo add size check
#[repr(C)]
#[account]
pub struct Mutation {
    pub version: u16,

    // in tokens
    pub in_token_a: InTokenConfig,
    pub in_token_b: InTokenConfig,
    pub in_token_c: InTokenConfig,

    // out tokens
    pub out_token_a: OutTokenConfig,
    pub out_token_b: OutTokenConfig,
    pub out_token_c: OutTokenConfig,

    pub sink_settings: SinkSettings,

    pub time_settings: TimeSettings,

    pub price_settings: PriceSettings,

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

    pub destination: Pubkey,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct TimeSettings {
    pub time_to_mutate_sec: u64,

    pub time_to_cancel_sec: u64,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct PriceSettings {
    pub paid: bool,

    pub pay_every_time: bool,
}
