use crate::*;
use gem_bank::{self, cpi::accounts::InitVault, program::GemBank};

#[derive(Accounts)]
#[instruction(bump_creator: u8, bump_receipt: u8)]
pub struct InitTakerVault<'info> {
    // mutation
    pub transmuter: Box<Account<'info, Transmuter>>,
    #[account(has_one = transmuter)]
    pub mutation: Box<Account<'info, Mutation>>,

    // CPI to bank
    #[account(mut)]
    pub bank: AccountInfo<'info>,
    #[account(mut)]
    pub vault: AccountInfo<'info>,
    #[account(seeds = [
            b"creator".as_ref(),
            mutation.key().as_ref(),
            taker.key().as_ref(),
        ],
        bump = bump_creator)]
    pub creator: AccountInfo<'info>,
    pub gem_bank: Program<'info, GemBank>,

    // misc
    #[account(mut)]
    pub taker: Signer<'info>,
    #[account(init_if_needed, seeds = [
            b"receipt".as_ref(),
            mutation.key().as_ref(),
            taker.key().as_ref()
        ],
        bump = bump_receipt,
        payer = taker,
        space = 8 + std::mem::size_of::<ExecutionReceipt>())]
    pub execution_receipt: Account<'info, ExecutionReceipt>,
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

// todo test conditionals
pub fn handler(ctx: Context<InitTakerVault>, bump_creator: u8, bump_vault: u8) -> ProgramResult {
    let transmuter = &ctx.accounts.transmuter;
    let receipt = &mut ctx.accounts.execution_receipt;
    let bank = ctx.accounts.bank.key();
    let vault = ctx.accounts.vault.key();

    // todo think about this some more
    if receipt.is_pending() || receipt.is_complete() {
        return Err(ErrorCode::MutationAlreadyComplete.into());
    }

    if bank == transmuter.bank_a {
        receipt.vault_a = Some(vault);
    } else if transmuter.bank_b.is_some() && bank == transmuter.bank_b.unwrap() {
        receipt.vault_b = Some(vault);
    } else if transmuter.bank_c.is_some() && bank == transmuter.bank_c.unwrap() {
        receipt.vault_c = Some(vault);
    } else {
        return Err(ErrorCode::NoneOfTheBanksMatch.into());
    }

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
