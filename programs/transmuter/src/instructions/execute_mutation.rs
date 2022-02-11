use crate::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
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

    // token accs
    // a
    #[account(mut, seeds = [
            b"escrow".as_ref(),
            mutation.key().as_ref(),
            token_a_mint.key().as_ref(),
        ],
        bump = bump_a)]
    pub token_a_escrow: AccountInfo<'info>, //not deserializing intentionally
    #[account(init_if_needed,
        associated_token::mint = token_a_mint,
        associated_token::authority = taker,
        payer = taker)]
    pub token_a_taker_ata: Box<Account<'info, TokenAccount>>,
    pub token_a_mint: Box<Account<'info, Mint>>,
    // b
    // todo can make optional
    #[account(mut, seeds = [
            b"escrow".as_ref(),
            mutation.key().as_ref(),
            token_b_mint.key().as_ref(),
        ],
        bump = bump_b)]
    pub token_b_escrow: AccountInfo<'info>,
    // todo currently creating 3 dest token accs even if we only need 1 - can take offchain & thus avoid doing it
    #[account(init_if_needed,
        associated_token::mint = token_b_mint,
        associated_token::authority = taker,
        payer = taker)]
    pub token_b_taker_ata: Box<Account<'info, TokenAccount>>,
    pub token_b_mint: Box<Account<'info, Mint>>,
    // c
    #[account(mut, seeds = [
            b"escrow".as_ref(),
            mutation.key().as_ref(),
            token_c_mint.key().as_ref(),
        ],
        bump = bump_c)]
    pub token_c_escrow: AccountInfo<'info>,
    #[account(init_if_needed,
        associated_token::mint = token_c_mint,
        associated_token::authority = taker,
        payer = taker)]
    pub token_c_taker_ata: Box<Account<'info, TokenAccount>>,
    pub token_c_mint: Box<Account<'info, Mint>>,

    // misc
    #[account(mut)]
    pub taker: Signer<'info>,
    #[account(init_if_needed, seeds = [
        b"receipt".as_ref(),
        mutation.key().as_ref(),
        taker.key().as_ref(),
    ],
    bump = bump_receipt,
    payer = taker,
    space = 8 + std::mem::size_of::<ExecutionReceipt>())]
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

    fn perform_token_transfer(
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
    reverse: bool,
) -> ProgramResult {
    // --------------------------------------- uses & payment
    // this section must go first, or we can have 10 ppl triggering a mutation with 1 use
    // if it has mutation time > 0

    let mutation = &mut ctx.accounts.mutation;

    // update uses
    if reverse {
        mutation.increment_uses()?;
    } else {
        mutation.try_decrement_uses()?;
    }

    // collect payment
    let amount_due = mutation.config.price_config.calc_and_record_payment();
    if amount_due > 0 {
        ctx.accounts.pay_owner(amount_due)?;
    }

    // --------------------------------------- execution receipt

    // todo if no reversals or abortions we can skip this part

    let mut execution_receipt = &mut ctx.accounts.execution_receipt;

    // todo test
    if execution_receipt.is_complete() {
        return Err(ErrorCode::ExecutionAlreadyComplete.into());
    }

    // todo test
    if reverse && !execution_receipt.is_complete() {
        return Err(ErrorCode::ExecutionNotComplete.into());
    }

    // if no execution receipt, we're running for the 1st time = init one
    if execution_receipt.is_empty() {
        let time_config = ctx.accounts.mutation.config.time_config;
        execution_receipt.init_receipt(time_config)?;
    // if one exists and is pending, we're running 2nd+ time = try move to completed
    } else if execution_receipt.state == ExecutionState::Pending {
        execution_receipt.try_mark_complete()?;
    }

    // --------------------------------------- perform action on taker vaults

    let remaining_accs = &mut ctx.remaining_accounts.iter();
    let mutation = &mut ctx.accounts.mutation;
    let config = mutation.config;

    // during reversal we want to UNlock vault
    // not worried about other branches in perform_vault_action,
    // since reversals only possible when all vaults set to Lock option (checked during init mut)
    let lock_vault = !reverse;

    // first bank
    let bank_a = ctx.accounts.bank_a.to_account_info();
    let vault_a = &ctx.accounts.vault_a;
    let taker_token_a = mutation.config.taker_token_a;
    ctx.accounts
        .perform_vault_action(bank_a, vault_a, taker_token_a, lock_vault)?;

    // second bank
    if let Some(taker_token_b) = config.taker_token_b {
        let bank_b = next_account_info(remaining_accs)?;
        let vault_b = next_account_info(remaining_accs)?;
        let vault_b_acc: Account<'_, Vault> = Account::try_from(vault_b)?;
        ctx.accounts.perform_vault_action(
            bank_b.clone(),
            &vault_b_acc,
            taker_token_b,
            lock_vault,
        )?;
    }

    // third bank
    if let Some(taker_token_c) = config.taker_token_c {
        let bank_c = next_account_info(remaining_accs)?;
        let vault_c = next_account_info(remaining_accs)?;
        let vault_c_acc: Account<'_, Vault> = Account::try_from(vault_c)?;
        ctx.accounts.perform_vault_action(
            bank_c.clone(),
            &vault_c_acc,
            taker_token_c,
            lock_vault,
        )?;
    }

    // --------------------------------------- move tokens

    // todo test
    // if we got this far but execution is pending, we don't transfer tokens
    if ctx.accounts.execution_receipt.is_pending() {
        return Ok(());
    }

    // first token
    let escrow_a = ctx.accounts.token_a_escrow.to_account_info();
    let taker_ata_a = ctx.accounts.token_a_taker_ata.to_account_info();
    ctx.accounts
        .perform_token_transfer(escrow_a, taker_ata_a, config.maker_token_a, reverse)?;

    // second token
    if let Some(maker_token_b) = config.maker_token_b {
        let escrow_b = ctx.accounts.token_b_escrow.to_account_info();
        let taker_ata_b = ctx.accounts.token_b_taker_ata.to_account_info();
        ctx.accounts
            .perform_token_transfer(escrow_b, taker_ata_b, maker_token_b, reverse)?;
    }

    // third token
    if let Some(maker_token_c) = config.maker_token_c {
        let escrow_c = ctx.accounts.token_c_escrow.to_account_info();
        let taker_ata_c = ctx.accounts.token_c_taker_ata.to_account_info();
        ctx.accounts
            .perform_token_transfer(escrow_c, taker_ata_c, maker_token_c, reverse)?;
    }

    Ok(())
}
