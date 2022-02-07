use crate::*;

#[derive(Accounts)]
pub struct BeginMutation<'info> {
    pub mutation: Box<Account<'info, Mutation>>,
}

pub fn handler(ctx: Context<BeginMutation>) -> ProgramResult {
    Ok(())
}
