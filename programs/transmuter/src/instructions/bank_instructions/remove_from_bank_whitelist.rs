use crate::*;
use gem_bank::{
    self,
    cpi::accounts::RemoveFromWhitelist,
    program::GemBank,
    state::{Bank, WhitelistProof},
};

#[derive(Accounts)]
#[instruction(bump_auth: u8)]
pub struct RemoveFromBankWhitelist<'info> {
    // transmuter
    #[account(has_one = authority, has_one = owner)]
    pub transmuter: Box<Account<'info, Transmuter>>,
    #[account(mut)]
    pub owner: Signer<'info>,
    /// CHECK:
    #[account(mut, seeds = [transmuter.key().as_ref()], bump = bump_auth)]
    pub authority: AccountInfo<'info>,

    // cpi
    #[account(mut)]
    pub bank: Box<Account<'info, Bank>>,
    /// CHECK:
    pub address_to_remove: AccountInfo<'info>,
    #[account(mut)]
    pub whitelist_proof: Box<Account<'info, WhitelistProof>>,
    pub gem_bank: Program<'info, GemBank>,
}

impl<'info> RemoveFromBankWhitelist<'info> {
    fn remove_from_whitelist_ctx(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, RemoveFromWhitelist<'info>> {
        CpiContext::new(
            self.gem_bank.to_account_info(),
            RemoveFromWhitelist {
                bank: self.bank.to_account_info(),
                bank_manager: self.authority.clone(),
                address_to_remove: self.address_to_remove.clone(),
                whitelist_proof: self.whitelist_proof.to_account_info(),
                funds_receiver: self.owner.to_account_info(),
            },
        )
    }
}

pub fn handler(ctx: Context<RemoveFromBankWhitelist>, bump_wl: u8) -> Result<()> {
    gem_bank::cpi::remove_from_whitelist(
        ctx.accounts
            .remove_from_whitelist_ctx()
            .with_signer(&[&ctx.accounts.transmuter.get_seeds()]),
        bump_wl,
    )
}
