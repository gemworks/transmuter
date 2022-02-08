use crate::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use gem_bank::{self, cpi::accounts::InitBank, program::GemBank};

#[derive(Accounts)]
#[instruction(bump_auth: u8, bump_a: u8, bump_b: u8, bump_c: u8)]
pub struct InitMutation<'info> {
    // mutation
    #[account(init, payer = payer, space = 8 + std::mem::size_of::<Mutation>())]
    pub mutation: Box<Account<'info, Mutation>>,
    pub owner: Signer<'info>,
    #[account(seeds = [mutation.key().as_ref()], bump = bump_auth)]
    pub authority: AccountInfo<'info>,

    // taker banks
    #[account(mut)]
    pub bank_a: Signer<'info>,
    // todo can make optional
    #[account(mut)]
    pub bank_b: Signer<'info>,
    #[account(mut)]
    pub bank_c: Signer<'info>,
    pub gem_bank: Program<'info, GemBank>,

    // maker escrows
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
    #[account(init, seeds = [
            b"escrow".as_ref(),
            mutation.key().as_ref(),
            token_b_mint.key().as_ref(),
        ],
        bump = bump_b,
        token::mint = token_b_mint,
        token::authority = authority,
        payer = owner)]
    pub token_b_escrow: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub token_b_source: AccountInfo<'info>,
    pub token_b_mint: Box<Account<'info, Mint>>,
    // c
    #[account(init, seeds = [
            b"escrow".as_ref(),
            mutation.key().as_ref(),
            token_c_mint.key().as_ref(),
        ],
        bump = bump_c,
        token::mint = token_c_mint,
        token::authority = authority,
        payer = owner)]
    pub token_c_escrow: Box<Account<'info, TokenAccount>>,
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
    fn init_bank_ctx(
        &self,
        bank: AccountInfo<'info>,
    ) -> CpiContext<'_, '_, '_, 'info, InitBank<'info>> {
        CpiContext::new(
            self.gem_bank.to_account_info(),
            InitBank {
                bank,
                // can't use mutation owner
                bank_manager: self.authority.clone(),
                payer: self.payer.to_account_info(),
                system_program: self.system_program.to_account_info(),
            },
        )
    }

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
}

// todo can be DRYed up
pub fn handler(ctx: Context<InitMutation>, bump_auth: u8, config: MutationConfig) -> ProgramResult {
    let mutation = &mut ctx.accounts.mutation;
    let mutation_key = mutation.key();

    mutation.version = LATEST_MUTATION_VERSION;
    mutation.owner = ctx.accounts.owner.key();
    mutation.authority = ctx.accounts.authority.key();
    mutation.authority_seed = mutation_key;
    mutation.authority_bump_seed = [bump_auth];
    mutation.config = config;
    mutation.paid = false;
    mutation.state = MutationState::Open;

    let full_seeds = [mutation_key.as_ref(), &[bump_auth]];

    // --------------------------------------- init taker banks
    // init first bank
    let bank_a = ctx.accounts.bank_a.to_account_info();
    require!(
        bank_a.key() == config.taker_token_a.gem_bank,
        BankDoesNotMatch
    );
    gem_bank::cpi::init_bank(
        ctx.accounts
            .init_bank_ctx(bank_a)
            .with_signer(&[&full_seeds]),
    )?;

    // init second bank
    if let Some(taker_token_b) = config.taker_token_b {
        let bank_b = ctx.accounts.bank_b.to_account_info();
        require!(bank_b.key() == taker_token_b.gem_bank, BankDoesNotMatch);
        gem_bank::cpi::init_bank(
            ctx.accounts
                .init_bank_ctx(bank_b)
                .with_signer(&[&full_seeds]),
        )?;
    }

    // init third bank
    if let Some(taker_token_c) = config.taker_token_c {
        let bank_c = ctx.accounts.bank_c.to_account_info();
        require!(bank_c.key() == taker_token_c.gem_bank, BankDoesNotMatch);
        gem_bank::cpi::init_bank(
            ctx.accounts
                .init_bank_ctx(bank_c)
                .with_signer(&[&full_seeds]),
        )?;
    }

    // --------------------------------------- fund maker escrow

    // fund first escrow
    if config.maker_token_a.source == MakerTokenSource::Prefunded {
        let mint_a = ctx.accounts.token_a_mint.to_account_info();
        // safe to .unwrap() because mint always specified for prefunded reward
        require!(
            mint_a.key() == config.maker_token_a.mint.unwrap(),
            MintDoesNotMatch
        );
        let source_a = ctx.accounts.token_a_source.to_account_info();
        let escrow_a = ctx.accounts.token_a_escrow.to_account_info();

        token::transfer(
            ctx.accounts.transfer_ctx(source_a, escrow_a),
            config.maker_token_a.amount,
        )?;
    } else {
        //todo record CM ID
    }

    // fund second escrow
    if let Some(maker_token_b) = config.maker_token_b {
        if maker_token_b.source == MakerTokenSource::Prefunded {
            let mint_b = ctx.accounts.token_b_mint.to_account_info();
            // safe to .unwrap() because mint always specified for prefunded reward
            require!(
                mint_b.key() == maker_token_b.mint.unwrap(),
                MintDoesNotMatch
            );
            let source_b = ctx.accounts.token_b_source.to_account_info();
            let escrow_b = ctx.accounts.token_b_escrow.to_account_info();

            token::transfer(
                ctx.accounts.transfer_ctx(source_b, escrow_b),
                maker_token_b.amount,
            )?;
        } else {
            // todo record CM ID
        }
    }

    // fund third escrow
    if let Some(maker_token_c) = config.maker_token_c {
        if maker_token_c.source == MakerTokenSource::Prefunded {
            let mint_c = ctx.accounts.token_c_mint.to_account_info();
            // safe to .unwrap() because mint always specified for prefunded reward
            require!(
                mint_c.key() == maker_token_c.mint.unwrap(),
                MintDoesNotMatch
            );
            let source_c = ctx.accounts.token_c_source.to_account_info();
            let escrow_c = ctx.accounts.token_c_escrow.to_account_info();

            token::transfer(
                ctx.accounts.transfer_ctx(source_c, escrow_c),
                maker_token_c.amount,
            )?;
        } else {
            // todo record CM ID
        }
    }

    Ok(())
}
