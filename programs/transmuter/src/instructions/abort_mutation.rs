use crate::*;

#[derive(Accounts)]
pub struct AbortMutation {}

pub fn handler(ctx: Context<AbortMutation>) -> ProgramResult {
    Ok(())
}
