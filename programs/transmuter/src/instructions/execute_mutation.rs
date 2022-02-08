use crate::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use gem_bank::{self, cpi::accounts::SetVaultLock, program::GemBank};

#[derive(Accounts)]
#[instruction(bump_auth: u8, bump_a: u8, bump_b: u8, bump_c: u8)]
pub struct ExecuteMutation<'info> {
    // mutation
    #[account(has_one = authority)]
    pub mutation: Box<Account<'info, Mutation>>,
    #[account(seeds = [mutation.key().as_ref()], bump = bump_auth)]
    pub authority: AccountInfo<'info>,

    // taker banks + vaults
    #[account(mut)]
    pub vault_a: AccountInfo<'info>,
    pub bank_a: AccountInfo<'info>,
    // todo can make optional
    #[account(mut)]
    pub vault_b: AccountInfo<'info>,
    pub bank_b: AccountInfo<'info>,
    #[account(mut)]
    pub vault_c: AccountInfo<'info>,
    pub bank_c: AccountInfo<'info>,
    pub gem_bank: Program<'info, GemBank>,

    // maker escrows
    // a
    #[account(seeds = [
            b"escrow".as_ref(),
            mutation.key().as_ref(),
            token_a_mint.key().as_ref(),
        ],
        bump = bump_a)]
    pub token_a_escrow: Box<Account<'info, TokenAccount>>,
    #[account(init_if_needed,
        associated_token::mint = token_a_mint,
        associated_token::authority = receiver,
        payer = receiver)]
    pub token_a_destination: Box<Account<'info, TokenAccount>>,
    pub token_a_mint: Box<Account<'info, Mint>>,
    // b
    // todo can make optional
    #[account(seeds = [
            b"escrow".as_ref(),
            mutation.key().as_ref(),
            token_b_mint.key().as_ref(),
        ],
        bump = bump_a)]
    pub token_b_escrow: Box<Account<'info, TokenAccount>>,
    #[account(init_if_needed,
        associated_token::mint = token_b_mint,
        associated_token::authority = receiver,
        payer = receiver)]
    pub token_b_destination: Box<Account<'info, TokenAccount>>,
    pub token_b_mint: Box<Account<'info, Mint>>,
    // c
    #[account(seeds = [
            b"escrow".as_ref(),
            mutation.key().as_ref(),
            token_c_mint.key().as_ref(),
        ],
        bump = bump_a)]
    pub token_c_escrow: Box<Account<'info, TokenAccount>>,
    #[account(init_if_needed,
        associated_token::mint = token_c_mint,
        associated_token::authority = receiver,
        payer = receiver)]
    pub token_c_destination: Box<Account<'info, TokenAccount>>,
    pub token_c_mint: Box<Account<'info, Mint>>,

    // misc
    #[account(mut)]
    pub receiver: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> ExecuteMutation<'info> {
    fn set_lock_vault_ctx(
        &self,
        bank: AccountInfo<'info>,
        vault: AccountInfo<'info>,
    ) -> CpiContext<'_, '_, '_, 'info, SetVaultLock<'info>> {
        CpiContext::new(
            self.gem_bank.to_account_info(),
            SetVaultLock {
                bank,
                vault,
                bank_manager: self.authority.clone(),
            },
        )
    }

    fn transfer_ctx(
        &self,
        token_escrow: AccountInfo<'info>,
        token_destination: AccountInfo<'info>,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: token_escrow,
                to: token_destination,
                authority: self.authority.to_account_info(),
            },
        )
    }
}

pub fn handler(ctx: Context<ExecuteMutation>) -> ProgramResult {
    Ok(())
}
