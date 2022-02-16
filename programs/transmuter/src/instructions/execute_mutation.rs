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

    // taker banks + vaults (B and C might be fake - cheaper (compute) than making them optional)
    pub bank_a: AccountInfo<'info>,
    #[account(mut)]
    pub vault_a: Box<Account<'info, Vault>>,
    pub bank_b: AccountInfo<'info>,
    #[account(mut)]
    pub vault_b: AccountInfo<'info>,
    pub bank_c: AccountInfo<'info>,
    #[account(mut)]
    pub vault_c: AccountInfo<'info>,
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
    // instead of doing PDA derivation (expensive) simply check if owner = prog id
    // it's not possible to set arbitrary data on accounts owned by the program
    #[account(mut, owner = *program_id, has_one = taker, has_one = mutation)]
    pub execution_receipt: Box<Account<'info, ExecutionReceipt>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
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
        vault: AccountInfo<'info>,
        taker_token: TakerTokenConfig,
        new_vault_lock: bool,
        vault_previously_locked: bool,
    ) -> ProgramResult {
        match taker_token.vault_action {
            VaultAction::ChangeOwner => {
                // if was previously locked, need to unlock
                if vault_previously_locked {
                    gem_bank::cpi::set_vault_lock(
                        self.set_vault_lock_ctx(bank.clone(), vault.clone())
                            .with_signer(&[&self.transmuter.get_seeds()]),
                        false,
                    )?;
                }
                // default action
                gem_bank::cpi::update_vault_owner(
                    self.change_vault_owner_ctx(bank, vault),
                    self.transmuter.owner,
                )
            }
            VaultAction::Lock => {
                // since already locked, simply return
                if vault_previously_locked {
                    return Ok(());
                }
                // default action
                gem_bank::cpi::set_vault_lock(
                    self.set_vault_lock_ctx(bank, vault)
                        .with_signer(&[&self.transmuter.get_seeds()]),
                    new_vault_lock,
                )
            }
            VaultAction::DoNothing => {
                // if was previously locked, need to unlock
                if vault_previously_locked {
                    gem_bank::cpi::set_vault_lock(
                        self.set_vault_lock_ctx(bank, vault)
                            .with_signer(&[&self.transmuter.get_seeds()]),
                        false,
                    )?;
                }
                // default action
                Ok(())
            }
        }
    }

    pub fn lock_vaults_for_mutatino_duration(&self, config: &MutationConfig) -> ProgramResult {
        gem_bank::cpi::set_vault_lock(
            self.set_vault_lock_ctx(self.bank_a.clone(), self.vault_a.to_account_info())
                .with_signer(&[&self.transmuter.get_seeds()]),
            true,
        )?;
        if config.taker_token_b.is_some() {
            gem_bank::cpi::set_vault_lock(
                self.set_vault_lock_ctx(self.bank_b.clone(), self.vault_b.clone())
                    .with_signer(&[&self.transmuter.get_seeds()]),
                true,
            )?;
        }
        if config.taker_token_c.is_some() {
            gem_bank::cpi::set_vault_lock(
                self.set_vault_lock_ctx(self.bank_c.clone(), self.vault_c.clone())
                    .with_signer(&[&self.transmuter.get_seeds()]),
                true,
            )?;
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

impl<'info> Validate<'info> for ExecuteMutation<'info> {
    fn validate(&self) -> ProgramResult {
        let config = self.mutation.config;

        // validate banks & vaults
        config
            .taker_token_a
            .assert_correct_bank(self.bank_a.key())?;
        config
            .taker_token_a
            .assert_sufficient_amount(&self.vault_a)?;
        assert_keys_eq!(
            self.vault_a.key(),
            self.execution_receipt.vault_a.unwrap(),
            "vault doesn't match that on ER"
        );

        if let Some(taker_token_b) = config.taker_token_b {
            let vault_b: Account<'_, Vault> = Account::try_from(&self.vault_b)?;
            taker_token_b.assert_correct_bank(self.bank_b.key())?;
            taker_token_b.assert_sufficient_amount(&vault_b)?;
            assert_keys_eq!(
                self.vault_b.key(),
                self.execution_receipt.vault_b.unwrap(),
                "vault doesn't match that on ER"
            );
        }

        if let Some(taker_token_c) = config.taker_token_c {
            let vault_c: Account<'_, Vault> = Account::try_from(&self.vault_c)?;
            taker_token_c.assert_correct_bank(self.bank_c.key())?;
            taker_token_c.assert_sufficient_amount(&vault_c)?;
            assert_keys_eq!(
                self.vault_c.key(),
                self.execution_receipt.vault_c.unwrap(),
                "vault doesn't match that on ER"
            );
        }

        // validate escrows
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
pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, ExecuteMutation<'info>>,
) -> ProgramResult {
    // --------------------------------------- create any necessary ATAs
    // tried factoring out as a fn, but somehow increases compute requirements

    let token_a_ata = ctx.accounts.token_a_taker_ata.to_account_info();
    if token_a_ata.data_is_empty() {
        associated_token::create(
            ctx.accounts
                .create_ata_ctx(token_a_ata, ctx.accounts.token_a_mint.to_account_info()),
        )?;
    }

    let token_b_ata = ctx.accounts.token_b_taker_ata.to_account_info();
    if ctx.accounts.mutation.config.maker_token_b.is_some() && token_b_ata.data_is_empty() {
        associated_token::create(
            ctx.accounts
                .create_ata_ctx(token_b_ata, ctx.accounts.token_b_mint.to_account_info()),
        )?;
    }

    let token_c_ata = ctx.accounts.token_c_taker_ata.to_account_info();
    if ctx.accounts.mutation.config.maker_token_c.is_some() && token_c_ata.data_is_empty() {
        associated_token::create(
            ctx.accounts
                .create_ata_ctx(token_c_ata, ctx.accounts.token_c_mint.to_account_info()),
        )?;
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

    // --------------------------------------- execution receipt

    let execution_receipt = &mut ctx.accounts.execution_receipt;
    let config = ctx.accounts.mutation.config;

    let mut vaults_previously_locked = false;

    match execution_receipt.state {
        ExecutionState::NotStarted => {
            execution_receipt.record_mutation_complete_ts(config.mutation_duration_sec)?;
            // if need time to complete, mark pending and exit
            if config.mutation_duration_sec > 0 {
                // mark pending
                execution_receipt.mark_pending();
                // lock vaults for duration of mutation
                ctx.accounts.lock_vaults_for_mutatino_duration(&config)?;
                return Ok(());
            }
            // else mark complete and continue
            execution_receipt.try_mark_complete()?;
        }
        ExecutionState::Pending => {
            // will error out if time isn't due yet
            execution_receipt.try_mark_complete()?;
            // this is the only case where vaults were previously locked
            vaults_previously_locked = true;
        }
        ExecutionState::Complete => {
            // can't complete the mutation twice
            return Err(ErrorCode::MutationAlreadyComplete.into());
        }
    }

    // --------------------------------------- taker vaults

    // first bank
    ctx.accounts.perform_vault_action(
        ctx.accounts.bank_a.to_account_info(),
        ctx.accounts.vault_a.to_account_info(),
        ctx.accounts.mutation.config.taker_token_a,
        true,
        vaults_previously_locked,
    )?;

    // second bank
    if let Some(taker_token_b) = config.taker_token_b {
        ctx.accounts.perform_vault_action(
            ctx.accounts.bank_b.to_account_info(),
            ctx.accounts.vault_b.to_account_info(),
            taker_token_b,
            true,
            vaults_previously_locked,
        )?;
    }

    // third bank
    if let Some(taker_token_c) = config.taker_token_c {
        ctx.accounts.perform_vault_action(
            ctx.accounts.bank_c.to_account_info(),
            ctx.accounts.vault_c.to_account_info(),
            taker_token_c,
            true,
            vaults_previously_locked,
        )?;
    }

    // --------------------------------------- move tokens

    // first token
    ctx.accounts.perform_token_transfer(
        ctx.accounts.token_a_escrow.to_account_info(),
        ctx.accounts.token_a_taker_ata.to_account_info(),
        config.maker_token_a,
        false,
    )?;

    // second token
    if let Some(maker_token_b) = config.maker_token_b {
        ctx.accounts.perform_token_transfer(
            ctx.accounts.token_b_escrow.to_account_info(),
            ctx.accounts.token_b_taker_ata.to_account_info(),
            maker_token_b,
            false,
        )?;
    }

    // third token
    if let Some(maker_token_c) = config.maker_token_c {
        ctx.accounts.perform_token_transfer(
            ctx.accounts.token_c_escrow.to_account_info(),
            ctx.accounts.token_c_taker_ata.to_account_info(),
            maker_token_c,
            false,
        )?;
    }

    Ok(())
}
