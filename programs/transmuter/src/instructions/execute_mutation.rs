use crate::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};
use anchor_spl::associated_token;
use anchor_spl::associated_token::{AssociatedToken, Create};
use anchor_spl::token::{self, Token, Transfer};
use gem_bank::state::Vault;
use gem_bank::{
    self, cpi::accounts::SetVaultLock, cpi::accounts::UpdateVaultOwner, program::GemBank,
};

#[derive(Accounts)]
#[instruction(bump_receipt: u8)]
pub struct ExecuteMutation<'info> {
    // mutation
    #[account(has_one = authority, has_one = owner)]
    pub transmuter: Box<Account<'info, Transmuter>>,
    #[account(mut,
        has_one = transmuter,
        has_one = token_a_escrow,
    )] //other 2 escrows conditionally checked in handler
    pub mutation: Box<Account<'info, Mutation>>,
    #[account(mut)]
    pub owner: AccountInfo<'info>,
    // skipping validation to save compute, has_one = auth is enough
    pub authority: AccountInfo<'info>,

    // taker banks + vaults (2 more in optional accs)
    pub bank_a: AccountInfo<'info>,
    #[account(mut)]
    pub vault_a: Box<Account<'info, Vault>>,
    pub gem_bank: Program<'info, GemBank>,

    // tokens - skipping deserialization due to compute. Ok coz:
    // a
    #[account(mut)]
    pub token_a_escrow: AccountInfo<'info>, //has_one check enough
    #[account(mut)]
    pub token_a_taker_ata: AccountInfo<'info>, //if not a TA, transfer will fail
    pub token_a_mint: AccountInfo<'info>, //if wrong mint, transfer will fail
    // b
    #[account(mut)]
    pub token_b_escrow: AccountInfo<'info>,
    #[account(mut)]
    pub token_b_taker_ata: AccountInfo<'info>, //may/not be TA, can't deserialize
    pub token_b_mint: AccountInfo<'info>,
    // c
    #[account(mut)]
    pub token_c_escrow: AccountInfo<'info>,
    #[account(mut)]
    pub token_c_taker_ata: AccountInfo<'info>, //may/not be TA, can't deserialize
    pub token_c_mint: AccountInfo<'info>,

    // misc
    #[account(mut)]
    pub taker: Signer<'info>,
    #[account(mut, seeds = [
            b"receipt".as_ref(),
            mutation.key().as_ref(),
            taker.key().as_ref()
        ],
        bump = bump_receipt)]
    pub execution_receipt: Box<Account<'info, ExecutionReceipt>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    //
    // optional
    // bank_b
    // vault_b: mut
    // bank_c
    // vault_c: mut
}

impl<'info> ExecuteMutation<'info> {
    fn set_vault_lock_ctx(
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

    fn change_vault_owner_ctx(
        &self,
        bank: AccountInfo<'info>,
        vault: AccountInfo<'info>,
    ) -> CpiContext<'_, '_, '_, 'info, UpdateVaultOwner<'info>> {
        CpiContext::new(
            self.gem_bank.to_account_info(),
            UpdateVaultOwner {
                bank,
                vault,
                owner: self.taker.to_account_info(),
            },
        )
    }

    fn transfer_ctx(
        &self,
        from: AccountInfo<'info>,
        to: AccountInfo<'info>,
        authority: AccountInfo<'info>,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from,
                to,
                authority,
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
                payer: self.taker.to_account_info(),
                associated_token: token_ata,
                authority: self.taker.to_account_info(),
                mint: token_mint,
                system_program: self.system_program.to_account_info(),
                token_program: self.token_program.to_account_info(),
                rent: self.rent.to_account_info(),
            },
        )
    }

    pub fn make_payment(
        &self,
        from: AccountInfo<'info>,
        to: AccountInfo<'info>,
        lamports: u64,
    ) -> ProgramResult {
        invoke(
            &system_instruction::transfer(from.key, to.key, lamports),
            &[from, to, self.system_program.to_account_info()],
        )
    }

    pub fn perform_vault_action(
        &self,
        bank: AccountInfo<'info>,
        vault: &Account<'info, Vault>,
        er_vault: Pubkey,
        taker_token: TakerTokenConfig,
        vault_lock: bool,
    ) -> ProgramResult {
        // bank & vault validation
        taker_token.assert_correct_bank(bank.key())?;
        taker_token.assert_sufficient_amount(vault)?;
        assert_keys_eq!(vault.key(), er_vault, "vaults don't match");

        // both methods below will check that vault actually belongs to bank
        match taker_token.vault_action {
            VaultAction::ChangeOwner => {
                gem_bank::cpi::update_vault_owner(
                    self.change_vault_owner_ctx(bank, vault.to_account_info()),
                    self.transmuter.owner,
                )?;
            }
            VaultAction::Lock => {
                gem_bank::cpi::set_vault_lock(
                    self.set_vault_lock_ctx(bank, vault.to_account_info())
                        .with_signer(&[&self.transmuter.get_seeds()]),
                    vault_lock,
                )?;
            }
            VaultAction::DoNothing => {
                // since not doing CPI, need to manually check vault belongs to bank
                require!(vault.bank == bank.key(), VaultDoesNotBelongToBank);
            }
        }
        Ok(())
    }

    pub fn perform_token_transfer(
        &self,
        escrow: AccountInfo<'info>,
        taker_ata: AccountInfo<'info>,
        maker_token: MakerTokenConfig,
        reverse: bool,
    ) -> ProgramResult {
        if reverse {
            token::transfer(
                self.transfer_ctx(taker_ata, escrow, self.taker.to_account_info()),
                maker_token.amount_per_use,
            )
        } else {
            token::transfer(
                self.transfer_ctx(escrow, taker_ata, self.authority.to_account_info())
                    .with_signer(&[&self.transmuter.get_seeds()]),
                maker_token.amount_per_use,
            )
        }
    }
}

pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, ExecuteMutation<'info>>,
) -> ProgramResult {
    // --------------------------------------- verify other 2 escrows

    let mutation = &ctx.accounts.mutation;

    if let Some(b_escrow) = mutation.token_b_escrow {
        assert_keys_eq!(ctx.accounts.token_b_escrow.key(), b_escrow, "b escrow");
    }

    if let Some(c_escrow) = mutation.token_c_escrow {
        assert_keys_eq!(ctx.accounts.token_c_escrow.key(), c_escrow, "c escrow");
    }

    // --------------------------------------- create any necessary ATAs

    let config = ctx.accounts.mutation.config;

    let token_a_ata = ctx.accounts.token_a_taker_ata.to_account_info();
    if token_a_ata.data_is_empty() {
        let token_a_mint = ctx.accounts.token_a_mint.to_account_info();
        associated_token::create(ctx.accounts.create_ata_ctx(token_a_ata, token_a_mint))?;
    }

    let token_b_ata = ctx.accounts.token_b_taker_ata.to_account_info();
    if config.maker_token_b.is_some() && token_b_ata.data_is_empty() {
        let token_b_mint = ctx.accounts.token_b_mint.to_account_info();
        associated_token::create(ctx.accounts.create_ata_ctx(token_b_ata, token_b_mint))?;
    }

    let token_c_ata = ctx.accounts.token_c_taker_ata.to_account_info();
    if config.maker_token_c.is_some() && token_c_ata.data_is_empty() {
        let token_c_mint = ctx.accounts.token_c_mint.to_account_info();
        associated_token::create(ctx.accounts.create_ata_ctx(token_c_ata, token_c_mint))?;
    }

    // --------------------------------------- uses & payment
    // this section must go first, or we can have 10 ppl triggering a mutation with 1 use
    // if it has mutation time > 0

    let mutation = &mut ctx.accounts.mutation;
    mutation.try_decrement_uses()?;

    let price = mutation.config.price.price_lamports;
    if price > 0 {
        ctx.accounts.make_payment(
            ctx.accounts.taker.to_account_info(),
            ctx.accounts.owner.to_account_info(),
            price,
        )?;
    }

    // --------------------------------------- taker vaults

    let remaining_accs = &mut ctx.remaining_accounts.iter();
    let mutation = &mut ctx.accounts.mutation;
    let config = mutation.config;

    // first bank
    let bank_a = ctx.accounts.bank_a.to_account_info();
    let vault_a = &ctx.accounts.vault_a;
    let er_vault_a = ctx.accounts.execution_receipt.vault_a.unwrap(); //save compute
    let taker_token_a = mutation.config.taker_token_a;
    ctx.accounts
        .perform_vault_action(bank_a, vault_a, er_vault_a, taker_token_a, true)?;

    // second bank
    if let Some(taker_token_b) = config.taker_token_b {
        let bank_b = next_account_info(remaining_accs)?;
        let vault_b = next_account_info(remaining_accs)?;
        let er_vault_b = ctx.accounts.execution_receipt.vault_b.unwrap();
        let vault_b_acc: Account<'_, Vault> = Account::try_from(vault_b)?;
        ctx.accounts.perform_vault_action(
            bank_b.clone(),
            &vault_b_acc,
            er_vault_b,
            taker_token_b,
            true,
        )?;
    }

    // third bank
    if let Some(taker_token_c) = config.taker_token_c {
        let bank_c = next_account_info(remaining_accs)?;
        let vault_c = next_account_info(remaining_accs)?;
        let er_vault_c = ctx.accounts.execution_receipt.vault_c.unwrap();
        let vault_c_acc: Account<'_, Vault> = Account::try_from(vault_c)?;
        ctx.accounts.perform_vault_action(
            bank_c.clone(),
            &vault_c_acc,
            er_vault_c,
            taker_token_c,
            true,
        )?;
    }

    // --------------------------------------- execution receipt

    let config = ctx.accounts.mutation.config;
    let execution_receipt_info = &mut ctx.accounts.execution_receipt;

    match execution_receipt_info.state {
        ExecutionState::NotStarted => {
            execution_receipt_info.record_mutation_complete_ts(config.mutation_time_sec)?;
            // if need time to complete, mark pending and exit
            if config.mutation_time_sec > 0 {
                execution_receipt_info.mark_pending();
                return Ok(());
            }
            // else mark complete and continue
            execution_receipt_info.try_mark_complete()?;
        }
        ExecutionState::Pending => {
            // will error out if time isn't due yet
            execution_receipt_info.try_mark_complete()?;
        }
        ExecutionState::Complete => {
            // can't complete the mutation twice
            return Err(ErrorCode::MutationAlreadyComplete.into());
        }
    }

    // --------------------------------------- move tokens

    // first token
    let escrow_a = ctx.accounts.token_a_escrow.to_account_info();
    let taker_ata_a = ctx.accounts.token_a_taker_ata.to_account_info();
    ctx.accounts
        .perform_token_transfer(escrow_a, taker_ata_a, config.maker_token_a, false)?;

    // second token
    if let Some(maker_token_b) = config.maker_token_b {
        let escrow_b = ctx.accounts.token_b_escrow.to_account_info();
        let taker_ata_b = ctx.accounts.token_b_taker_ata.to_account_info();
        ctx.accounts
            .perform_token_transfer(escrow_b, taker_ata_b, maker_token_b, false)?;
    }

    // third token
    if let Some(maker_token_c) = config.maker_token_c {
        let escrow_c = ctx.accounts.token_c_escrow.to_account_info();
        let taker_ata_c = ctx.accounts.token_c_taker_ata.to_account_info();
        ctx.accounts
            .perform_token_transfer(escrow_c, taker_ata_c, maker_token_c, false)?;
    }

    Ok(())
}
