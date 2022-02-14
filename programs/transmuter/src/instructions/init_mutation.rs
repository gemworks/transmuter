use crate::*;
use anchor_spl::token::{self, InitializeAccount, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
#[instruction(bump_auth: u8, bump_a: u8)]
pub struct InitMutation<'info> {
    // mutation
    #[account(has_one = authority)]
    pub transmuter: Box<Account<'info, Transmuter>>,
    #[account(init, payer = payer, space = 8 + std::mem::size_of::<Mutation>())]
    pub mutation: Box<Account<'info, Mutation>>,
    pub owner: Signer<'info>,
    #[account(seeds = [transmuter.key().as_ref()], bump = bump_auth)]
    pub authority: AccountInfo<'info>,

    // tokens
    // a
    #[account(init, seeds = [
            b"escrow".as_ref(),
            mutation.key().as_ref(),
            token_a_mint.key().as_ref(),
        ],
        bump = bump_a,
        token::mint = token_a_mint,
        token::authority = authority,
        payer = owner)]
    pub token_a_escrow: Box<Account<'info, TokenAccount>>,
    // intentionally not checking if it's a TokenAccount - in some cases it'll be empty
    #[account(mut)]
    pub token_a_source: AccountInfo<'info>,
    pub token_a_mint: Box<Account<'info, Mint>>,
    // b
    // todo can make optional
    #[account(mut)] //manually init'ing
    pub token_b_escrow: AccountInfo<'info>,
    #[account(mut)]
    pub token_b_source: AccountInfo<'info>,
    pub token_b_mint: Box<Account<'info, Mint>>,
    // c
    #[account(mut)] //manually init'ing
    pub token_c_escrow: AccountInfo<'info>,
    #[account(mut)]
    pub token_c_source: AccountInfo<'info>,
    pub token_c_mint: Box<Account<'info, Mint>>,

    // misc
    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> InitMutation<'info> {
    fn transfer_ctx(
        &self,
        token_source: AccountInfo<'info>,
        token_escrow: AccountInfo<'info>,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: token_source,
                to: token_escrow,
                authority: self.owner.to_account_info(),
            },
        )
    }

    fn fund_escrow(
        &self,
        mint: Pubkey,
        uses: u64,
        source: AccountInfo<'info>,
        escrow: AccountInfo<'info>,
        maker_token: MakerTokenConfig,
    ) -> ProgramResult {
        maker_token.assert_correct_mint(mint)?;
        maker_token.assert_sufficient_funding(uses)?;

        token::transfer(self.transfer_ctx(source, escrow), maker_token.total_funding)
    }

    fn init_token_account(
        &self,
        account: AccountInfo<'info>,
        mint: AccountInfo<'info>,
    ) -> CpiContext<'_, '_, '_, 'info, InitializeAccount<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            InitializeAccount {
                account,
                mint,
                authority: self.authority.to_account_info(),
                rent: self.rent.to_account_info(),
            },
        )
    }

    fn create_and_init_escrow(
        &self,
        token_account: AccountInfo<'info>,
        mint: AccountInfo<'info>,
        bump: u8,
    ) -> ProgramResult {
        // create
        create_pda_with_space(
            &[
                b"escrow".as_ref(),
                self.mutation.key().as_ref(),
                mint.key().as_ref(),
                &[bump],
            ],
            &token_account,
            anchor_spl::token::TokenAccount::LEN,
            &spl_token::id(),
            &self.payer.to_account_info(),
            &self.system_program.to_account_info(),
        )?;

        // init
        anchor_spl::token::initialize_account(self.init_token_account(token_account, mint))
    }
}

pub fn handler(
    ctx: Context<InitMutation>,
    config: MutationConfig,
    uses: u64,
    bump_b: u8,
    bump_c: u8,
) -> ProgramResult {
    let mutation = &mut ctx.accounts.mutation;

    mutation.transmuter = ctx.accounts.transmuter.key();
    mutation.config = config;
    mutation.init_uses(uses);
    mutation.config.assert_is_valid()?;
    mutation.token_a_escrow = ctx.accounts.token_a_escrow.key();
    if config.maker_token_b.is_some() {
        mutation.token_b_escrow = Some(ctx.accounts.token_b_escrow.key());
    }
    if config.maker_token_c.is_some() {
        mutation.token_c_escrow = Some(ctx.accounts.token_c_escrow.key());
    }

    // first escrow
    let mint_a = ctx.accounts.token_a_mint.to_account_info();
    let source_a = ctx.accounts.token_a_source.to_account_info();
    let escrow_a = ctx.accounts.token_a_escrow.to_account_info();
    let maker_token_a = config.maker_token_a;
    ctx.accounts
        .fund_escrow(mint_a.key(), uses, source_a, escrow_a, maker_token_a)?;

    // fund second escrow
    if let Some(maker_token_b) = config.maker_token_b {
        let mint_b = ctx.accounts.token_b_mint.to_account_info();
        let source_b = ctx.accounts.token_b_source.to_account_info();
        let escrow_b = ctx.accounts.token_b_escrow.to_account_info();

        // create
        ctx.accounts
            .create_and_init_escrow(escrow_b.clone(), mint_b.clone(), bump_b)?;

        // fund
        ctx.accounts
            .fund_escrow(mint_b.key(), uses, source_b, escrow_b, maker_token_b)?;
    }

    // fund third escrow
    if let Some(maker_token_c) = config.maker_token_c {
        let mint_c = ctx.accounts.token_c_mint.to_account_info();
        let source_c = ctx.accounts.token_c_source.to_account_info();
        let escrow_c = ctx.accounts.token_c_escrow.to_account_info();

        // create
        ctx.accounts
            .create_and_init_escrow(escrow_c.clone(), mint_c.clone(), bump_c)?;

        // fund
        ctx.accounts
            .fund_escrow(mint_c.key(), uses, source_c, escrow_c, maker_token_c)?;
    }

    Ok(())
}
