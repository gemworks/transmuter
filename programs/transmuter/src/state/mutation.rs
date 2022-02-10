use crate::ErrorCode::NoMoreUsesLeft;
use crate::*;
use gem_bank::state::Vault;

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

    // todo test
    pub fn try_decrement_uses(&mut self) -> ProgramResult {
        self.remaining_uses.try_sub(1).map_err(|_| NoMoreUsesLeft)?;
        self.try_mark_exhausted();
        Ok(())
    }

    // todo test
    fn try_mark_exhausted(&mut self) {
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
pub enum RequiredUnits {
    RarityPoints,
    Gems,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct TakerTokenConfig {
    /// each gem bank has a whitelist with mints/creators allowed / not allowed
    pub gem_bank: Pubkey,

    pub required_amount: u64,

    pub required_units: RequiredUnits,

    pub vault_action: VaultAction,
}

impl TakerTokenConfig {
    // todo test
    pub fn assert_correct_bank(&self, bank_key: Pubkey) -> ProgramResult {
        require!(bank_key == self.gem_bank, BankDoesNotMatch);
        Ok(())
    }

    // todo test
    pub fn assert_sufficient_amount(&self, vault: &Account<Vault>) -> ProgramResult {
        match self.required_units {
            RequiredUnits::RarityPoints => {
                let taker_rarity_points = vault.rarity_points;
                require!(
                    taker_rarity_points >= self.required_amount,
                    InsufficientVaultRarityPoints
                );
            }
            RequiredUnits::Gems => {
                let taker_gems = vault.gem_count;
                require!(taker_gems >= self.required_amount, InsufficientVaultGems);
            }
        }

        Ok(())
    }
}

#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct MakerTokenConfig {
    pub mint: Pubkey,

    pub total_funding: u64,

    /// in theory could be backcalculated, but making the user specify this upfront
    /// makes it more robust and prevents errors
    pub amount_per_use: u64,
}

impl MakerTokenConfig {
    // todo test
    pub fn assert_correct_mint(&self, mint: Pubkey) -> ProgramResult {
        require!(mint == self.mint, MintDoesNotMatch);
        Ok(())
    }

    // todo test
    pub fn assert_sufficient_funding(&self, uses: u64) -> ProgramResult {
        require!(
            self.total_funding == uses.try_mul(self.amount_per_use)?,
            IncorrectFunding
        );
        Ok(())
    }
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
    /// setting to anything >0 will force the user to execute twice
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
