use crate::*;

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct BeginMutation<'info> {
    #[account(has_one = authority)]
    pub mutation: Box<Account<'info, Mutation>>,
    #[account(seeds = [mutation.key().as_ref()], bump = bump)]
    pub authority: AccountInfo<'info>,
}

pub fn handler(ctx: Context<BeginMutation>) -> ProgramResult {
    Ok(())
}
