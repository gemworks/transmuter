pub use anchor_lang::prelude::*;
pub use vipers::*;

pub mod error;
pub mod instructions;
pub mod state;
pub mod try_math;

pub use error::*;
pub use instructions::*;
pub use state::*;
pub use try_math::*;

declare_id!("4c5WjWPmecCLHMSo8bQESo26VCotSKtjiUpCPnfEPL2p");

#[program]
pub mod transmuter_v0 {
    use super::*;

    // --------------------------------------- maker
    pub fn init_transmuter<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, InitTransmuter<'info>>,
        bump_auth: u8,
    ) -> ProgramResult {
        msg!("init new transmuter");
        instructions::init_transmuter::handler(ctx, bump_auth)
    }

    pub fn init_mutation(
        ctx: Context<InitMutation>,
        _bump_auth: u8,
        _bump_a: u8,
        _bump_b: u8,
        _bump_c: u8,
        config: MutationConfig,
        uses: u64,
    ) -> ProgramResult {
        msg!("init new mutation");
        instructions::init_mutation::handler(ctx, config, uses)
    }

    pub fn update_mutation(ctx: Context<UpdateMutation>) -> ProgramResult {
        msg!("update mutation");
        instructions::update_mutation::handler(ctx)
    }

    pub fn destroy_mutation(ctx: Context<DestroyMutation>) -> ProgramResult {
        msg!("destroy mutation");
        instructions::destroy_mutation::handler(ctx)
    }

    pub fn whitelist_tokens(ctx: Context<WhitelistTokens>) -> ProgramResult {
        msg!("whitelist tokens");
        instructions::whitelist_tokens::handler(ctx)
    }

    // --------------------------------------- taker

    pub fn execute_mutation<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ExecuteMutation<'info>>,
        _bump_auth: u8,
        _bump_a: u8,
        _bump_b: u8,
        _bump_c: u8,
    ) -> ProgramResult {
        msg!("execute mutation");
        instructions::execute_mutation::handler(ctx)
    }

    pub fn abort_mutation(ctx: Context<AbortMutation>) -> ProgramResult {
        msg!("abort mutation");
        instructions::abort_mutation::handler(ctx)
    }
}
