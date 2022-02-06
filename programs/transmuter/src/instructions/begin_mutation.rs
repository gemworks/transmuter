use crate::*;

#[derive(Accounts)]
pub struct BeginMutation {}

pub fn handler(ctx: Context<BeginMutation>) -> ProgramResult {
    Ok(())
}
