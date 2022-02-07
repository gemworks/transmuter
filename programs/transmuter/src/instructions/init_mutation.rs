use crate::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use gem_bank::{self, cpi::accounts::InitBank, program::GemBank};
use std::str::FromStr;

#[derive(Accounts)]
pub struct InitMutation<'info> {
    //mutation
    #[account(init, payer = payer, space = 8 + std::mem::size_of::<Mutation>())]
    pub mutation: Box<Account<'info, Mutation>>,
    pub mutation_owner: Signer<'info>,

    //cpi
    #[account(mut)]
    pub bank_a: Signer<'info>,
    // todo can make optional - for now jst pass .default keys
    #[account(mut)]
    pub bank_b: Signer<'info>,
    #[account(mut)]
    pub bank_c: Signer<'info>,
    pub gem_bank: Program<'info, GemBank>,

    //misc
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitMutation<'info> {
    fn init_bank_ctx(
        &self,
        bank: AccountInfo<'info>,
    ) -> CpiContext<'_, '_, '_, 'info, InitBank<'info>> {
        CpiContext::new(
            self.gem_bank.to_account_info(),
            InitBank {
                bank,
                bank_manager: self.mutation_owner.to_account_info(),
                payer: self.payer.to_account_info(),
                system_program: self.system_program.to_account_info(),
            },
        )
    }
}

pub fn handler(ctx: Context<InitMutation>, config: MutationConfig) -> ProgramResult {
    let mutation = &mut ctx.accounts.mutation;

    mutation.version = LATEST_MUTATION_VERSION;
    mutation.owner = ctx.accounts.mutation_owner.key();
    mutation.config = config;

    // init first bank
    let bank_a = ctx.accounts.bank_a.to_account_info();
    gem_bank::cpi::init_bank(ctx.accounts.init_bank_ctx(bank_a))?;

    // init second bank
    if config.in_token_b.is_some() {
        let bank_b = ctx.accounts.bank_b.to_account_info();
        gem_bank::cpi::init_bank(ctx.accounts.init_bank_ctx(bank_b))?;
    }

    // init third bank
    if config.in_token_c.is_some() {
        let bank_c = ctx.accounts.bank_c.to_account_info();
        gem_bank::cpi::init_bank(ctx.accounts.init_bank_ctx(bank_c))?;
    }

    Ok(())
}
