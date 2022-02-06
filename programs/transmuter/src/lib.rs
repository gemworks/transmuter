pub use anchor_lang::prelude::*;
pub use vipers::*;

pub mod instructions;
pub mod state;

pub use instructions::*;
pub use state::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod transmuter {
    use super::*;

    pub fn init_mutation(ctx: Context<InitMutation>) -> ProgramResult {
        instructions::init_mutation::handler(ctx)
    }

    pub fn begin_mutation(ctx: Context<BeginMutation>) -> ProgramResult {
        instructions::begin_mutation::handler(ctx)
    }

    pub fn complete_mutation(ctx: Context<CompleteMutation>) -> ProgramResult {
        instructions::complete_mutation::handler(ctx)
    }

    pub fn cancel_mutation(ctx: Context<CancelMutation>) -> ProgramResult {
        instructions::cancel_mutation::handler(ctx)
    }
}
