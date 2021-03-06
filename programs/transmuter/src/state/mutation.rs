use crate::ErrorCode::NoMoreUsesLeft;
use crate::*;
use gem_bank::state::Vault;

#[proc_macros::assert_size(624)]
#[repr(C)]
#[account]
pub struct Mutation {
    /// each mutation belongs to a single transmuter
    pub transmuter: Pubkey,

    pub config: MutationConfig,

    /// storing these here to save compute during ix execution (has_one cheaper than derivation)
    pub token_a_escrow: Pubkey,
    pub token_b_escrow: Option<Pubkey>, //option adds 4 to size
    pub token_c_escrow: Option<Pubkey>, //option adds 4 to size

    total_uses: u64,

    remaining_uses: u64,

    state: MutationState,

    pub name: [u8; 32],

    _reserved: [u8; 64],
}

impl Mutation {
    pub fn init_uses(&mut self, uses: u64) {
        self.total_uses = uses;
        self.remaining_uses = uses;
        self.state = MutationState::Available;
    }

    pub fn try_decrement_uses(&mut self) -> Result<()> {
        self.remaining_uses
            .try_sub_assign(1)
            .map_err(|_| NoMoreUsesLeft)?;
        self.update_state();
        Ok(())
    }

    pub fn increment_uses(&mut self) -> Result<()> {
        self.remaining_uses.try_add_assign(1)?;
        self.update_state();
        Ok(())
    }

    fn update_state(&mut self) {
        if self.remaining_uses == 0 {
            self.state = MutationState::Exhausted;
        } else {
            self.state = MutationState::Available;
        }
    }
}

#[proc_macros::assert_size(4)]
#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub enum MutationState {
    Available,
    Exhausted,
}

#[proc_macros::assert_size(368)]
#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct MutationConfig {
    pub taker_token_a: TakerTokenConfig,
    pub taker_token_b: Option<TakerTokenConfig>, //option adds 0 to size
    pub taker_token_c: Option<TakerTokenConfig>,
    pub maker_token_a: MakerTokenConfig,
    pub maker_token_b: Option<MakerTokenConfig>, //option adds 8 to size ¯\_(ツ)_/¯
    pub maker_token_c: Option<MakerTokenConfig>,
    pub price: PriceConfig,

    pub mutation_duration_sec: u64,

    pub reversible: bool,

    _reserved: [u8; 32],
}

impl MutationConfig {
    /// for a mutation to be reversible, all vaults must be set to Lock
    pub fn assert_is_valid(&self) -> Result<()> {
        if self.reversible {
            require!(
                self.taker_token_a.vault_action == VaultAction::Lock,
                VaultsNotSetToLock
            );
            if let Some(taker_token_b) = self.taker_token_b {
                require!(
                    taker_token_b.vault_action == VaultAction::Lock,
                    VaultsNotSetToLock
                );
            }
            if let Some(taker_token_c) = self.taker_token_c {
                require!(
                    taker_token_c.vault_action == VaultAction::Lock,
                    VaultsNotSetToLock
                );
            }
        }
        Ok(())
    }
}

#[proc_macros::assert_size(4)]
#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub enum RequiredUnits {
    RarityPoints,
    Gems,
}

/// Token required FROM taker
#[proc_macros::assert_size(48)]
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
    /// verifies that bank passed matches bank stored on taker token config
    pub fn assert_correct_bank(&self, bank_key: Pubkey) -> Result<()> {
        require!(bank_key == self.gem_bank, BankDoesNotMatch);
        Ok(())
    }

    /// verifies taker has indeed fulfilled the requirements set out by maker
    pub fn assert_sufficient_amount(&self, vault: &Account<Vault>) -> Result<()> {
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

/// Token returned TO taker
#[proc_macros::assert_size(48)]
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
    /// verifies the passed mint matches that recorded on token config
    pub fn assert_correct_mint(&self, mint: Pubkey) -> Result<()> {
        require!(mint == self.mint, MintDoesNotMatch);
        Ok(())
    }

    /// verifies the math of uses * funding per use = total funding
    pub fn assert_sufficient_funding(&self, uses: u64) -> Result<()> {
        require!(
            self.total_funding == uses.try_mul(self.amount_per_use)?,
            IncorrectFunding
        );
        Ok(())
    }
}

#[proc_macros::assert_size(4)]
#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize, PartialEq)]
pub enum VaultAction {
    ChangeOwner,
    Lock,
    DoNothing,
}

#[proc_macros::assert_size(16)]
#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct PriceConfig {
    pub price_lamports: u64,

    /// negative means refund
    pub reversal_price_lamports: i64,
}
