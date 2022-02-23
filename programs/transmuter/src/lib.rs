pub use anchor_lang::prelude::*;
use gem_bank::instructions::record_rarity_points::RarityConfig;
pub use vipers::*;

pub mod error;
pub mod instructions;
pub mod state;
pub mod try_math;
pub mod util;

pub use error::{ErrorCode, *};
pub use instructions::*;
pub use state::*;
pub use try_math::*;
pub use util::*;

declare_id!("4c5WjWPmecCLHMSo8bQESo26VCotSKtjiUpCPnfEPL2p");

#[program]
pub mod transmuter_v0 {
    use super::*;

    // --------------------------------------- maker (transmuter)

    pub fn init_transmuter<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, InitTransmuter<'info>>,
        bump_auth: u8,
    ) -> Result<()> {
        msg!("init new transmuter");
        instructions::init_transmuter::handler(ctx, bump_auth)
    }

    pub fn update_transmuter(ctx: Context<UpdateTransmuter>, new_owner: Pubkey) -> Result<()> {
        msg!("update transmuter");
        instructions::update_transmuter::handler(ctx, new_owner)
    }

    pub fn add_to_bank_whitelist(
        ctx: Context<AddToBankWhitelist>,
        _bump_auth: u8,
        whitelist_type: u8,
    ) -> Result<()> {
        msg!("add to bank whitelist");
        instructions::add_to_bank_whitelist::handler(ctx, whitelist_type)
    }

    pub fn remove_from_bank_whitelist(
        ctx: Context<RemoveFromBankWhitelist>,
        _bump_auth: u8,
        bump_wl: u8,
    ) -> Result<()> {
        msg!("remove from bank whitelist");
        instructions::remove_from_bank_whitelist::handler(ctx, bump_wl)
    }

    pub fn add_rarities_to_bank<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, AddRaritiesToBank<'info>>,
        _bump_auth: u8,
        rarity_configs: Vec<RarityConfig>,
    ) -> Result<()> {
        msg!("add rarities to bank");
        instructions::add_rarities_to_bank::handler(ctx, rarity_configs)
    }

    // --------------------------------------- maker (mutation)

    pub fn init_mutation(
        ctx: Context<InitMutation>,
        _bump_auth: u8,
        bump_b: u8,
        bump_c: u8,
        config: MutationConfig,
        uses: u64,
        name: String,
    ) -> Result<()> {
        msg!("init new mutation");
        instructions::init_mutation::handler(ctx, config, uses, bump_b, bump_c, name)
    }

    pub fn destroy_mutation(ctx: Context<DestroyMutation>, _bump_auth: u8) -> Result<()> {
        msg!("destroy mutation");
        instructions::destroy_mutation::handler(ctx)
    }

    // --------------------------------------- taker
    // deposits / withdrawals are done by hitting bank program directly

    pub fn init_taker_vault(ctx: Context<InitTakerVault>, bump_creator: u8) -> Result<()> {
        msg!("init taker vault");
        instructions::init_vault::handler(ctx, bump_creator)
    }

    pub fn execute_mutation<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ExecuteMutation<'info>>,
    ) -> Result<()> {
        // msg!("execute mutation"); //save compute
        instructions::execute_mutation::handler(ctx)
    }

    pub fn reverse_mutation<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ExecuteMutation<'info>>,
    ) -> Result<()> {
        // msg!("reverse mutation"); //save compute
        instructions::reverse_mutation::handler(ctx)
    }
}
