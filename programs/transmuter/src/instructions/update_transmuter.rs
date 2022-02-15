use crate::*;

#[derive(Accounts)]
pub struct UpdateTransmuter {}

pub fn handler(ctx: Context<UpdateTransmuter>) -> ProgramResult {
    Ok(())
}
