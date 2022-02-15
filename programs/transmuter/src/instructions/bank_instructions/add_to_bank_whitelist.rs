use crate::*;
use gem_bank::{self, cpi::accounts::AddToWhitelist, program::GemBank, state::Bank};

#[derive(Accounts)]
#[instruction(bump_auth: u8)]
pub struct AddToBankWhitelist<'info> {
    // mutation
    #[account(has_one = authority, has_one = owner)]
    pub transmuter: Box<Account<'info, Transmuter>>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(seeds = [transmuter.key().as_ref()], bump = bump_auth)]
    pub authority: AccountInfo<'info>,

    // cpi
    #[account(mut)]
    pub bank: Box<Account<'info, Bank>>,
    pub address_to_whitelist: AccountInfo<'info>,
    // trying to deserialize here leads to errors (doesn't exist yet)
    #[account(mut)]
    pub whitelist_proof: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub gem_bank: Program<'info, GemBank>,
}

impl<'info> AddToBankWhitelist<'info> {
    fn add_to_whitelist_ctx(&self) -> CpiContext<'_, '_, '_, 'info, AddToWhitelist<'info>> {
        CpiContext::new(
            self.gem_bank.to_account_info(),
            AddToWhitelist {
                bank: self.bank.to_account_info(),
                bank_manager: self.authority.clone(),
                address_to_whitelist: self.address_to_whitelist.clone(),
                whitelist_proof: self.whitelist_proof.clone(),
                system_program: self.system_program.to_account_info(),
                payer: self.owner.to_account_info(),
            },
        )
    }
}

pub fn handler(ctx: Context<AddToBankWhitelist>, bump_wl: u8, whitelist_type: u8) -> ProgramResult {
    gem_bank::cpi::add_to_whitelist(
        ctx.accounts
            .add_to_whitelist_ctx()
            .with_signer(&[&ctx.accounts.transmuter.get_seeds()]),
        bump_wl,
        whitelist_type,
    )
}
