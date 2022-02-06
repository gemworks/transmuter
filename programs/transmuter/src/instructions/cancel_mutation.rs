use crate::*;

#[derive(Accounts)]
pub struct CancelMutation {

}

pub fn handler(ctx: Context<CancelMutation>) -> ProgramResult {
    Ok(())
}