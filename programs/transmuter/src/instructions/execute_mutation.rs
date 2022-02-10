use crate::*;
use anchor_lang::solana_program::{hash::hash, program::invoke, system_instruction};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use gem_bank::state::Vault;
use gem_bank::{
    self, cpi::accounts::SetVaultLock, cpi::accounts::UpdateVaultOwner, program::GemBank,
};

#[derive(Accounts)]
#[instruction(bump_auth: u8, bump_a: u8, bump_b: u8, bump_c: u8, bump_receipt: u8)]
pub struct ExecuteMutation<'info> {
    // mutation
    #[account(has_one = authority, has_one = owner)]
    pub transmuter: Box<Account<'info, Transmuter>>,
    #[account(mut)]
    pub mutation: Box<Account<'info, Mutation>>,
    pub owner: AccountInfo<'info>,
    #[account(seeds = [transmuter.key().as_ref()], bump = bump_auth)]
    pub authority: AccountInfo<'info>,

    // taker banks + vaults (2 more in optional accs)
    pub bank_a: AccountInfo<'info>,
    #[account(mut)]
    pub vault_a: Box<Account<'info, Vault>>,
    pub gem_bank: Program<'info, GemBank>,

    // maker escrows
    // a
    // intentionally not checking if it's a TokenAccount - in some cases it'll be empty
    #[account(mut, seeds = [
            b"escrow".as_ref(),
            mutation.key().as_ref(),
            token_a_mint.key().as_ref(),
        ],
        bump = bump_a)]
    pub token_a_escrow: AccountInfo<'info>,
    // intentionally not checking if it's a TokenAccount - in some cases it'll be empty
    #[account(init_if_needed,
        associated_token::mint = token_a_mint,
        associated_token::authority = taker,
        payer = taker)]
    pub token_a_destination: Box<Account<'info, TokenAccount>>,
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
    pub token_b_destination: Box<Account<'info, TokenAccount>>,
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
    pub token_c_destination: Box<Account<'info, TokenAccount>>,
    pub token_c_mint: Box<Account<'info, Mint>>,

    // misc
    #[account(mut)]
    pub taker: Signer<'info>,
    // have to deserialize manually, since we don't always need it
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
        token_escrow: AccountInfo<'info>,
        token_destination: AccountInfo<'info>,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: token_escrow,
                to: token_destination,
                authority: self.authority.clone(),
            },
        )
    }

    fn pay_owner(&self, lamports: u64) -> ProgramResult {
        invoke(
            &system_instruction::transfer(self.taker.key, self.owner.key, lamports),
            &[
                self.taker.to_account_info(),
                self.owner.clone(),
                self.system_program.to_account_info(),
            ],
        )
    }

    fn perform_vault_action(
        &self,
        bank: AccountInfo<'info>,
        vault: &Account<'info, Vault>,
        taker_token: TakerTokenConfig,
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
                    true,
                )?;
            }
            VaultAction::DoNothing => {
                // since not doing CPI, need to manually check vault belongs to bank
                require!(vault.bank == bank.key(), VaultDoesNotBelongToBank);
            }
        }
        Ok(())
    }
}

pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, ExecuteMutation<'info>>,
    bump_receipt: u8,
) -> ProgramResult {
    let mutation = &mut ctx.accounts.mutation;

    // decrement uses or throw an error if at 0
    mutation.try_decrement_uses()?;

    // settle any payment
    let amount_due = mutation.config.price_config.calc_and_record_payment();
    if amount_due > 0 {
        ctx.accounts.pay_owner(amount_due)?;
    }

    // --------------------------------------- perform action on taker vaults

    let mutation = &mut ctx.accounts.mutation;
    let remaining_accs = &mut ctx.remaining_accounts.iter();
    let config = mutation.config;

    // first bank
    let bank_a = ctx.accounts.bank_a.to_account_info();
    let vault_a = &ctx.accounts.vault_a;
    let taker_token_a = mutation.config.taker_token_a;
    ctx.accounts
        .perform_vault_action(bank_a, vault_a, taker_token_a)?;

    // second bank
    if let Some(taker_token_b) = config.taker_token_b {
        let bank_b = next_account_info(remaining_accs)?;
        let vault_b = next_account_info(remaining_accs)?;
        let vault_b_acc: Account<'_, Vault> = Account::try_from(vault_b)?;
        ctx.accounts
            .perform_vault_action(bank_b.clone(), &vault_b_acc, taker_token_b)?;
    }

    // third bank
    if let Some(taker_token_c) = config.taker_token_c {
        let bank_c = next_account_info(remaining_accs)?;
        let vault_c = next_account_info(remaining_accs)?;
        let vault_c_acc: Account<'_, Vault> = Account::try_from(vault_c)?;
        ctx.accounts
            .perform_vault_action(bank_c.clone(), &vault_c_acc, taker_token_c)?;
    }

    // --------------------------------------- if mutation time > 0, verify sufficient time passed

    if config.time_config.mutation_time_sec > 0 {
        let execution_receipt = &mut ctx.accounts.execution_receipt;
        let execution_receipt_result: std::result::Result<
            Account<'_, ExecutionReceipt>,
            ProgramError,
        > = Account::try_from(execution_receipt);

        // try deserialize the PDA - if succeeds, means we're calling a 2nd+ time
        if let Ok(execution_receipt_acc) = execution_receipt_result {
            // if not enough time has passed this will throw an error and terminate the prog
            execution_receipt_acc.assert_mutation_complete()?;
        } else {
            // else, if fails, means we're calling the 1st time and need to create the PDA
            create_pda_with_space(
                &[
                    b"receipt".as_ref(),
                    ctx.accounts.mutation.key().as_ref(),
                    ctx.accounts.taker.key().as_ref(),
                    &[bump_receipt], //todo is this a security vulnerability?
                ],
                execution_receipt,
                8 + std::mem::size_of::<ExecutionReceipt>(),
                ctx.program_id,
                &ctx.accounts.taker.to_account_info(),
                &ctx.accounts.system_program.to_account_info(),
            )?;

            let disc = hash("account:ExecutionReceipt".as_bytes());
            let mutation_complete_ts =
                ExecutionReceipt::calc_mutation_complete_ts(config.time_config.mutation_time_sec)?;

            let mut execution_receipt_raw = execution_receipt.data.borrow_mut();
            execution_receipt_raw[..8].clone_from_slice(&disc.to_bytes()[..8]);
            execution_receipt_raw[8..16].clone_from_slice(&mutation_complete_ts.to_le_bytes());

            return Ok(());
        };
    }

    // --------------------------------------- send tokens to taker

    // first token
    let escrow_a = ctx.accounts.token_a_escrow.to_account_info();
    let destination_a = ctx.accounts.token_a_destination.to_account_info();
    token::transfer(
        ctx.accounts
            .transfer_ctx(escrow_a, destination_a)
            .with_signer(&[&ctx.accounts.transmuter.get_seeds()]),
        config.maker_token_a.total_funding,
    )?;

    // second token
    if let Some(maker_token_b) = config.maker_token_b {
        let escrow_b = ctx.accounts.token_b_escrow.to_account_info();
        let destination_b = ctx.accounts.token_b_destination.to_account_info();
        token::transfer(
            ctx.accounts
                .transfer_ctx(escrow_b, destination_b)
                .with_signer(&[&ctx.accounts.transmuter.get_seeds()]),
            maker_token_b.total_funding,
        )?;
    }

    // third token
    if let Some(maker_token_c) = config.maker_token_c {
        let escrow_c = ctx.accounts.token_c_escrow.to_account_info();
        let destination_c = ctx.accounts.token_c_destination.to_account_info();
        token::transfer(
            ctx.accounts
                .transfer_ctx(escrow_c, destination_c)
                .with_signer(&[&ctx.accounts.transmuter.get_seeds()]),
            maker_token_c.total_funding,
        )?;
    }

    Ok(())
}
