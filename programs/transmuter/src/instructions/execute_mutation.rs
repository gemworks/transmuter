use crate::*;
use anchor_lang::solana_program::{hash::hash, program::invoke, system_instruction};
use anchor_spl::associated_token;
use anchor_spl::associated_token::{AssociatedToken, Create};
use anchor_spl::token::{self, Token, Transfer};
use gem_bank::state::Vault;
use gem_bank::{
    self, cpi::accounts::SetVaultLock, cpi::accounts::UpdateVaultOwner, program::GemBank,
};

#[derive(Accounts)]
#[instruction(bump_a: u8, bump_b: u8, bump_c: u8, bump_receipt: u8)]
pub struct ExecuteMutation<'info> {
    // mutation
    #[account(has_one = authority, has_one = owner)]
    pub transmuter: Box<Account<'info, Transmuter>>,
    #[account(mut, has_one = transmuter)]
    pub mutation: Box<Account<'info, Mutation>>,
    pub owner: AccountInfo<'info>,
    // skipping validation to save compute, has_one = auth is enough
    pub authority: AccountInfo<'info>,

    // taker banks + vaults (2 more in optional accs)
    pub bank_a: AccountInfo<'info>,
    #[account(mut)]
    pub vault_a: Box<Account<'info, Vault>>,
    pub gem_bank: Program<'info, GemBank>,

    // tokens
    // a
    // todo not deserializing any of these due to compute limitations. Is that a sec problem?
    #[account(mut, seeds = [
            b"escrow".as_ref(),
            mutation.key().as_ref(),
            token_a_mint.key().as_ref(),
        ],
        bump = bump_a)]
    pub token_a_escrow: AccountInfo<'info>,
    #[account(mut)]
    pub token_a_taker_ata: AccountInfo<'info>,
    pub token_a_mint: AccountInfo<'info>,
    // b
    #[account(mut, seeds = [
            b"escrow".as_ref(),
            mutation.key().as_ref(),
            token_b_mint.key().as_ref(),
        ],
        bump = bump_b)]
    pub token_b_escrow: AccountInfo<'info>,
    #[account(mut)]
    pub token_b_taker_ata: AccountInfo<'info>,
    pub token_b_mint: AccountInfo<'info>,
    // c
    #[account(mut, seeds = [
            b"escrow".as_ref(),
            mutation.key().as_ref(),
            token_c_mint.key().as_ref(),
        ],
        bump = bump_c)]
    pub token_c_escrow: AccountInfo<'info>,
    #[account(mut)]
    pub token_c_taker_ata: AccountInfo<'info>,
    pub token_c_mint: AccountInfo<'info>,

    // misc
    #[account(mut)]
    pub taker: Signer<'info>,
    // manually init'ed / deserialized because we don't always need it
    #[account(mut)]
    pub execution_receipt: AccountInfo<'info>,
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

    pub fn pay_owner(&self, lamports: u64) -> ProgramResult {
        invoke(
            &system_instruction::transfer(self.taker.key, self.owner.key, lamports),
            &[
                self.taker.to_account_info(),
                self.owner.clone(),
                self.system_program.to_account_info(),
            ],
        )
    }

    pub fn perform_vault_action(
        &self,
        bank: AccountInfo<'info>,
        vault: &Account<'info, Vault>,
        taker_token: TakerTokenConfig,
        vault_lock: bool,
    ) -> ProgramResult {
        taker_token.assert_correct_bank(bank.key())?;
        taker_token.assert_sufficient_amount(vault)?;

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
                maker_token.total_funding,
            )
        } else {
            token::transfer(
                self.transfer_ctx(escrow, taker_ata, self.authority.to_account_info())
                    .with_signer(&[&self.transmuter.get_seeds()]),
                maker_token.total_funding,
            )
        }
    }
}

pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, ExecuteMutation<'info>>,
    bump_receipt: u8,
) -> ProgramResult {
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

    // todo ouch this actually need to be done per user
    let amount_due = mutation.config.price.calc_and_record_payment();
    if amount_due > 0 {
        ctx.accounts.pay_owner(amount_due)?;
    }

    // --------------------------------------- taker vaults

    let remaining_accs = &mut ctx.remaining_accounts.iter();
    let mutation = &mut ctx.accounts.mutation;
    let config = mutation.config;

    // first bank
    let bank_a = ctx.accounts.bank_a.to_account_info();
    let vault_a = &ctx.accounts.vault_a;
    let taker_token_a = mutation.config.taker_token_a;
    ctx.accounts
        .perform_vault_action(bank_a, vault_a, taker_token_a, true)?;

    // second bank
    if let Some(taker_token_b) = config.taker_token_b {
        let bank_b = next_account_info(remaining_accs)?;
        let vault_b = next_account_info(remaining_accs)?;
        let vault_b_acc: Account<'_, Vault> = Account::try_from(vault_b)?;
        ctx.accounts
            .perform_vault_action(bank_b.clone(), &vault_b_acc, taker_token_b, true)?;
    }

    // third bank
    if let Some(taker_token_c) = config.taker_token_c {
        let bank_c = next_account_info(remaining_accs)?;
        let vault_c = next_account_info(remaining_accs)?;
        let vault_c_acc: Account<'_, Vault> = Account::try_from(vault_c)?;
        ctx.accounts
            .perform_vault_action(bank_c.clone(), &vault_c_acc, taker_token_c, true)?;
    }

    // --------------------------------------- execution receipt
    // todo test every branch below

    let config = ctx.accounts.mutation.config;
    let execution_receipt_info = &mut ctx.accounts.execution_receipt;

    // only relevant if either:
    // - reversible (we'll need to know that mutation completed)
    // - mutation time > 0 (we'll need to know if mutation still pending)
    if config.reversible || config.mutation_time_sec > 0 {
        let execution_receipt_result: std::result::Result<
            Account<'_, ExecutionReceipt>,
            ProgramError,
        > = Account::try_from(execution_receipt_info);

        // deserialize an existing receipt
        if let Ok(mut execution_receipt) = execution_receipt_result {
            if execution_receipt.is_pending() {
                execution_receipt.try_mark_complete()?; //will error out if isn't due yet
            } else {
                return Err(ErrorCode::MutationAlreadyComplete.into());
            }

        // or create a receipt
        } else {
            create_pda_with_space(
                &[
                    b"receipt".as_ref(),
                    ctx.accounts.mutation.key().as_ref(),
                    ctx.accounts.taker.key().as_ref(),
                    &[bump_receipt], //todo is this a security vulnerability?
                ],
                execution_receipt_info,
                8 + std::mem::size_of::<ExecutionReceipt>(),
                ctx.program_id,
                &ctx.accounts.taker.to_account_info(),
                &ctx.accounts.system_program.to_account_info(),
            )?;

            let disc = hash("account:ExecutionReceipt".as_bytes());
            let mutation_complete_ts =
                ExecutionReceipt::calc_mutation_complete_ts(config.mutation_time_sec)?;

            let mut execution_receipt_raw = execution_receipt_info.data.borrow_mut();
            execution_receipt_raw[..8].clone_from_slice(&disc.to_bytes()[..8]);
            execution_receipt_raw[8..16].clone_from_slice(&mutation_complete_ts.to_le_bytes());

            if config.mutation_time_sec > 0 {
                return Ok(());
            } else {
                // if no extra wait is required, mark as complete (little endian)
                execution_receipt_raw[16..20].clone_from_slice(&[1, 0, 0, 0]);
            }
        };
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
