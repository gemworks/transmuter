use crate::*;

#[derive(Accounts)]
pub struct UpdateTransmuter<'info> {
    // transmuter
    #[account(mut, has_one = owner)]
    pub transmuter: Box<Account<'info, Transmuter>>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateTransmuter>, new_owner: Pubkey) -> ProgramResult {
    let transmuter = &mut ctx.accounts.transmuter;

    transmuter.owner = new_owner;

    Ok(())
}
