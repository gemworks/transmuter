use crate::*;

#[derive(Accounts)]
pub struct CompleteMutation {

}

pub fn handler(ctx: Context<CompleteMutation>) -> ProgramResult {
    Ok(())
}