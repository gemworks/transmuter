pub use anchor_lang::prelude::*;
pub use vipers::*;

pub mod error;
pub mod instructions;
pub mod state;

pub use error::*;
pub use instructions::*;
pub use state::*;

declare_id!("4c5WjWPmecCLHMSo8bQESo26VCotSKtjiUpCPnfEPL2p");

#[program]
pub mod transmuter {
    use super::*;

    // --------------------------------------- maker
    pub fn init_mutation(
        ctx: Context<InitMutation>,
        bump_auth: u8,
        _bump_a: u8,
        _bump_b: u8,
        _bump_c: u8,
        config: MutationConfig,
    ) -> ProgramResult {
        msg!("init new mutation");
        instructions::init_mutation::handler(ctx, bump_auth, config)
    }

    // pub fn fund_mutation(ctx: Context<FundMutation>) -> ProgramResult {
    //     instructions::fund_mutation::handler(ctx)
    // }

    pub fn update_mutation(ctx: Context<UpdateMutation>) -> ProgramResult {
        instructions::update_mutation::handler(ctx)
    }

    // --------------------------------------- taker

    pub fn cancel_mutation(ctx: Context<CancelMutation>) -> ProgramResult {
        instructions::cancel_mutation::handler(ctx)
    }

    pub fn execute_mutation(ctx: Context<ExecuteMutation>) -> ProgramResult {
        instructions::execute_mutation::handler(ctx)
    }
}
