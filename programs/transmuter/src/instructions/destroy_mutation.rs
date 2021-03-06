//! What happens on mutation destruction?
//! 1) Escrow accounts are drained to the owner (ATAs created)
//! 2) Escrow accounts are closed and SOL credited to the owner
//! 3) Mutation state account is closed and SOL credited to the owner
//! 4) Any vaults created by takers for this mutation STAY UNTOUCHED. This means:
//!    - if they were locked, they stay locked (transmuter authority still controls them)
//!    - if they were unlocked & owned by taker, taker can withdraw at any point
//!    - if they were unlocked & owned by maker, maker can withdraw at any point

use crate::*;
use anchor_spl::associated_token::{AssociatedToken, Create};
use anchor_spl::token::{CloseAccount, Mint, Token, TokenAccount, Transfer};
use anchor_spl::{associated_token, token};

#[derive(Accounts)]
#[instruction(bump_auth: u8)]
pub struct DestroyMutation<'info> {
    // mutation
    #[account(has_one = authority, has_one = owner)]
    pub transmuter: Box<Account<'info, Transmuter>>,
    #[account(mut, close = owner,
        has_one = transmuter,
        has_one = token_a_escrow,
    )] //other 2 escrows conditionally checked in handler
    pub mutation: Box<Account<'info, Mutation>>,
    pub owner: Signer<'info>,
    /// CHECK:
    #[account(seeds = [transmuter.key().as_ref()], bump = bump_auth)]
    pub authority: AccountInfo<'info>,

    // tokens
    // a
    #[account(mut)]
    pub token_a_escrow: Box<Account<'info, TokenAccount>>,
    /// CHECK:
    #[account(mut)]
    pub token_a_dest: AccountInfo<'info>, //skip deser coz might be empty
    pub token_a_mint: Box<Account<'info, Mint>>,
    // b
    /// CHECK:
    #[account(mut)]
    pub token_b_escrow: AccountInfo<'info>, //skip deser coz might be empty
    /// CHECK:
    #[account(mut)]
    pub token_b_dest: AccountInfo<'info>, //skip deser coz might be empty
    pub token_b_mint: Box<Account<'info, Mint>>,
    // c
    /// CHECK:
    #[account(mut)]
    pub token_c_escrow: AccountInfo<'info>, //skip deser coz might be empty
    /// CHECK:
    #[account(mut)]
    pub token_c_dest: AccountInfo<'info>, //skip deser coz might be empty
    pub token_c_mint: Box<Account<'info, Mint>>,

    // misc
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> DestroyMutation<'info> {
    fn transfer_ctx(
        &self,
        from: AccountInfo<'info>,
        to: AccountInfo<'info>,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from,
                to,
                authority: self.authority.to_account_info(),
            },
        )
    }

    fn create_ata_ctx(
        &self,
        token_ata: AccountInfo<'info>,
        token_mint: AccountInfo<'info>,
    ) -> CpiContext<'_, '_, '_, 'info, Create<'info>> {
        CpiContext::new(
            self.associated_token_program.to_account_info(),
            Create {
                payer: self.owner.to_account_info(),
                associated_token: token_ata,
                authority: self.owner.to_account_info(),
                mint: token_mint,
                system_program: self.system_program.to_account_info(),
                token_program: self.token_program.to_account_info(),
                rent: self.rent.to_account_info(),
            },
        )
    }

    fn close_ctx(
        &self,
        account: AccountInfo<'info>,
    ) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            CloseAccount {
                account,
                destination: self.owner.to_account_info(),
                authority: self.authority.to_account_info(),
            },
        )
    }
}

impl<'info> Validate<'info> for DestroyMutation<'info> {
    fn validate(&self) -> Result<()> {
        if let Some(b_escrow) = self.mutation.token_b_escrow {
            assert_keys_eq!(self.token_b_escrow.key(), b_escrow, "b escrow");
        }

        if let Some(c_escrow) = self.mutation.token_c_escrow {
            assert_keys_eq!(self.token_c_escrow.key(), c_escrow, "c escrow");
        }

        Ok(())
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<DestroyMutation>) -> Result<()> {
    // --------------------------------------- create any necessary destination ATAs

    let config = ctx.accounts.mutation.config;

    let token_a_ata = ctx.accounts.token_a_dest.to_account_info();
    if token_a_ata.data_is_empty() {
        associated_token::create(
            ctx.accounts
                .create_ata_ctx(token_a_ata, ctx.accounts.token_a_mint.to_account_info()),
        )?;
    }

    let token_b_ata = ctx.accounts.token_b_dest.to_account_info();
    if config.maker_token_b.is_some() && token_b_ata.data_is_empty() {
        associated_token::create(
            ctx.accounts
                .create_ata_ctx(token_b_ata, ctx.accounts.token_b_mint.to_account_info()),
        )?;
    }

    let token_c_ata = ctx.accounts.token_c_dest.to_account_info();
    if config.maker_token_c.is_some() && token_c_ata.data_is_empty() {
        associated_token::create(
            ctx.accounts
                .create_ata_ctx(token_c_ata, ctx.accounts.token_c_mint.to_account_info()),
        )?;
    }

    // --------------------------------------- move tokens & close

    // first token
    let escrow_a = ctx.accounts.token_a_escrow.to_account_info();
    let dest_a = ctx.accounts.token_a_dest.to_account_info();
    token::transfer(
        ctx.accounts
            .transfer_ctx(escrow_a.clone(), dest_a)
            .with_signer(&[&ctx.accounts.transmuter.get_seeds()]),
        ctx.accounts.token_a_escrow.amount,
    )?;

    token::close_account(
        ctx.accounts
            .close_ctx(escrow_a)
            .with_signer(&[&ctx.accounts.transmuter.get_seeds()]),
    )?;

    // second token
    if config.maker_token_b.is_some() {
        let escrow_b = ctx.accounts.token_b_escrow.to_account_info();
        let escrow_b_acc: Account<TokenAccount> = Account::try_from(&escrow_b)?;
        let dest_b = ctx.accounts.token_b_dest.to_account_info();

        token::transfer(
            ctx.accounts
                .transfer_ctx(escrow_b.clone(), dest_b)
                .with_signer(&[&ctx.accounts.transmuter.get_seeds()]),
            escrow_b_acc.amount,
        )?;

        token::close_account(
            ctx.accounts
                .close_ctx(escrow_b)
                .with_signer(&[&ctx.accounts.transmuter.get_seeds()]),
        )?;
    }

    // third token
    if config.maker_token_c.is_some() {
        let escrow_c = ctx.accounts.token_c_escrow.to_account_info();
        let escrow_c_acc: Account<TokenAccount> = Account::try_from(&escrow_c)?;
        let dest_c = ctx.accounts.token_c_dest.to_account_info();

        token::transfer(
            ctx.accounts
                .transfer_ctx(escrow_c.clone(), dest_c)
                .with_signer(&[&ctx.accounts.transmuter.get_seeds()]),
            escrow_c_acc.amount,
        )?;

        token::close_account(
            ctx.accounts
                .close_ctx(escrow_c)
                .with_signer(&[&ctx.accounts.transmuter.get_seeds()]),
        )?;
    }

    Ok(())
}
