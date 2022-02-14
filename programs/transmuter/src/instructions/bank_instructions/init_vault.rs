use crate::*;
use gem_bank::{self, cpi::accounts::InitVault, program::GemBank};

#[derive(Accounts)]
#[instruction(bump_creator: u8)]
pub struct InitTakerVault<'info> {
    // mutation
    pub mutation: Box<Account<'info, Mutation>>,

    // bank
    #[account(mut)]
    pub bank: AccountInfo<'info>,

    // vault
    #[account(mut)]
    pub vault: AccountInfo<'info>,
    #[account(seeds = [
            b"creator".as_ref(),
            mutation.key().as_ref(),
            taker.key().as_ref(),
        ],
        bump = bump_creator)]
    pub creator: AccountInfo<'info>,

    // misc
    pub gem_bank: Program<'info, GemBank>,
    #[account(mut)]
    pub taker: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitTakerVault<'info> {
    fn init_vault_ctx(&self) -> CpiContext<'_, '_, '_, 'info, InitVault<'info>> {
        CpiContext::new(
            self.gem_bank.to_account_info(),
            InitVault {
                bank: self.bank.clone(),
                vault: self.vault.clone(),
                creator: self.creator.clone(),
                payer: self.taker.to_account_info(),
                system_program: self.system_program.to_account_info(),
            },
        )
    }
}

pub fn handler(ctx: Context<InitTakerVault>, bump_creator: u8, bump_vault: u8) -> ProgramResult {
    gem_bank::cpi::init_vault(
        ctx.accounts.init_vault_ctx().with_signer(&[&[
            b"creator".as_ref(),
            ctx.accounts.mutation.key().as_ref(),
            ctx.accounts.taker.key().as_ref(),
            &[bump_creator],
        ]]),
        bump_vault,
        ctx.accounts.taker.key(),
        "mutavault".to_string(),
    )
}
