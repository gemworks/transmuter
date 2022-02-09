use crate::*;

#[derive(Accounts)]
pub struct WhitelistTokens {}

pub fn handler(ctx: Context<WhitelistTokens>) -> ProgramResult {
    Ok(())
}
