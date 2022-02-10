use crate::*;

#[repr(C)]
#[account]
pub struct Mutation {
    /// each mutation belongs to a single transmuter
    pub transmuter: Pubkey,

    pub config: MutationConfig,

    total_uses: u64,

    remaining_uses: u64,

    state: MutationState,
}

impl Mutation {
    pub fn init_uses(&mut self, uses: u64) {
        self.total_uses = uses;
        self.remaining_uses = uses;
        self.state = MutationState::Available;
    }

    pub fn decrement_uses(&mut self) -> ProgramResult {
        self.remaining_uses.try_sub(1)?;
        self.verify_remaining_uses();
        Ok(())
    }

    pub fn verify_remaining_uses(&mut self) {
        if self.remaining_uses == 0 {
            self.state = MutationState::Exhausted;
        }
    }
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub enum MutationState {
    Available,
    Exhausted,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct MutationConfig {
    pub taker_token_a: TakerTokenConfig,
    pub taker_token_b: Option<TakerTokenConfig>,
    pub taker_token_c: Option<TakerTokenConfig>,

    pub maker_token_a: MakerTokenConfig,
    pub maker_token_b: Option<MakerTokenConfig>,
    pub maker_token_c: Option<MakerTokenConfig>,

    pub time_config: TimeConfig,

    pub price_config: PriceConfig,

    pub reversible: bool,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct TakerTokenConfig {
    /// each gem bank has a whitelist with mints/creators allowed / not allowed
    pub gem_bank: Pubkey,

    /// req rarity points checked first, if None, amount is used. One of 2 must be present
    pub required_rarity_points: Option<u64>,

    pub required_gem_count: Option<u64>,

    pub vault_action: VaultAction,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct MakerTokenConfig {
    pub mint: Pubkey,

    pub amount: u64,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub enum VaultAction {
    ChangeOwner,
    Lock,
    DoNothing,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct TimeConfig {
    pub mutation_time_sec: u64,

    pub cancel_window_sec: u64,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct PriceConfig {
    pub price: u64,

    pub pay_every_time: bool,

    pub paid: bool,
}
