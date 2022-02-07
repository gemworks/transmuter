use crate::*;

#[derive(Accounts)]
pub struct UpdateMutation {}

pub fn handler(ctx: Context<UpdateMutation>) -> ProgramResult {
    Ok(())
}
