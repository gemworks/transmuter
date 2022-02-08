use crate::*;

#[derive(Accounts)]
pub struct DestroyMutation {}

pub fn handler(ctx: Context<DestroyMutation>) -> ProgramResult {
    Ok(())
}
