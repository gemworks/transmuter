use crate::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use gem_bank::{self, cpi::accounts::SetVaultLock, program::GemBank};
use mpl_candy_machine::{self, cpi::accounts::MintNFT, program::CandyMachineV2};

#[derive(Accounts)]
#[instruction(bump_auth: u8)]
pub struct CMExecuteMutation<'info> {
    // mutation
    #[account(has_one = authority)]
    pub mutation: Box<Account<'info, Mutation>>,
    #[account(seeds = [mutation.key().as_ref()], bump = bump_auth)]
    pub authority: AccountInfo<'info>,

    // // taker banks + vaults
    // // vault will be checked to be part of bank at gem_bank level, no need to repeat here
    // #[account(mut)]
    // pub vault_a: AccountInfo<'info>,
    // pub bank_a: AccountInfo<'info>,
    // // todo can make optional
    // #[account(mut)]
    // pub vault_b: AccountInfo<'info>,
    // pub bank_b: AccountInfo<'info>,
    // #[account(mut)]
    // pub vault_c: AccountInfo<'info>,
    // pub bank_c: AccountInfo<'info>,
    // pub gem_bank: Program<'info, GemBank>,

    // CM
    // With the following accounts we aren't using anchor macros because they are CPI'd
    // through to token-metadata which will do all the validations we need on them.
    #[account(mut)]
    pub candy_machine: UncheckedAccount<'info>,
    pub candy_machine_creator: UncheckedAccount<'info>,
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    #[account(mut)]
    pub mint: UncheckedAccount<'info>,
    pub mint_authority: Signer<'info>,
    pub update_authority: Signer<'info>,
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,
    pub token_metadata_program: UncheckedAccount<'info>,
    pub clock: UncheckedAccount<'info>,
    pub recent_blockhashes: UncheckedAccount<'info>,
    pub instruction_sysvar_account: UncheckedAccount<'info>,
    pub candy_machine_program: Program<'info, CandyMachineV2>,

    // misc
    #[account(mut)]
    pub receiver: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    //
    // OPTIONAL ACCOUNTS:
    // > Only needed if candy machine has a gatekeeper
    // gateway_token
    // > Only needed if candy machine has a gatekeeper and it has expire_on_use set to true:
    // gateway program
    // network_expire_feature
    // > Only needed if candy machine has whitelist_mint_settings
    // whitelist_token_account
    // > Only needed if candy machine has whitelist_mint_settings and mode is BurnEveryTime
    // whitelist_token_mint
    // whitelist_burn_authority
    // > Only needed if candy machine has token mint
    // token_account_info
    // transfer_authority_info
}

impl<'info> CMExecuteMutation<'info> {
    // fn set_lock_vault_ctx(
    //     &self,
    //     bank: AccountInfo<'info>,
    //     vault: AccountInfo<'info>,
    // ) -> CpiContext<'_, '_, '_, 'info, SetVaultLock<'info>> {
    //     CpiContext::new(
    //         self.gem_bank.to_account_info(),
    //         SetVaultLock {
    //             bank,
    //             vault,
    //             bank_manager: self.authority.clone(),
    //         },
    //     )
    // }

    fn mint_nft_ctx(&self) -> CpiContext<'_, '_, '_, 'info, MintNFT<'info>> {
        CpiContext::new(
            self.candy_machine_program.to_account_info(),
            MintNFT {
                candy_machine: self.candy_machine.to_account_info(),
                candy_machine_creator: self.candy_machine_creator.to_account_info(),
                payer: self.receiver.to_account_info(),
                wallet: self.receiver.to_account_info(),
                metadata: self.metadata.to_account_info(),
                mint: self.mint.to_account_info(),
                mint_authority: self.mint_authority.to_account_info(),
                update_authority: self.update_authority.to_account_info(),
                master_edition: self.master_edition.to_account_info(),
                token_metadata_program: self.token_metadata_program.to_account_info(),
                rent: self.rent.to_account_info(),
                clock: self.clock.to_account_info(),
                recent_blockhashes: self.recent_blockhashes.to_account_info(),
                instruction_sysvar_account: self.instruction_sysvar_account.to_account_info(),
                system_program: self.system_program.to_account_info(),
                token_program: self.token_program.to_account_info(),
            },
        )
    }
}

// todo can be DRYed up
pub fn handler(ctx: Context<CMExecuteMutation>, creator_bump: u8) -> ProgramResult {
    let mutation = &mut ctx.accounts.mutation;
    let config = mutation.config;

    mutation.state = MutationState::Closed;

    // --------------------------------------- lock taker banks

    // // lock first bank
    // let bank_a = ctx.accounts.bank_a.to_account_info();
    // let vault_a = ctx.accounts.vault_a.to_account_info();
    // require!(
    //     bank_a.key() == config.taker_token_a.gem_bank,
    //     BankDoesNotMatch
    // );
    // gem_bank::cpi::set_vault_lock(
    //     ctx.accounts
    //         .set_lock_vault_ctx(bank_a, vault_a)
    //         .with_signer(&[&ctx.accounts.mutation.get_seeds()]),
    //     true,
    // )?;
    //
    // // lock second bank
    // if let Some(taker_token_b) = config.taker_token_b {
    //     let bank_b = ctx.accounts.bank_b.to_account_info();
    //     let vault_b = ctx.accounts.vault_b.to_account_info();
    //     require!(bank_b.key() == taker_token_b.gem_bank, BankDoesNotMatch);
    //     gem_bank::cpi::set_vault_lock(
    //         ctx.accounts
    //             .set_lock_vault_ctx(bank_b, vault_b)
    //             .with_signer(&[&ctx.accounts.mutation.get_seeds()]),
    //         true,
    //     )?;
    // }
    //
    // // lock third bank
    // if let Some(taker_token_c) = config.taker_token_c {
    //     let bank_c = ctx.accounts.bank_c.to_account_info();
    //     let vault_c = ctx.accounts.vault_c.to_account_info();
    //     require!(bank_c.key() == taker_token_c.gem_bank, BankDoesNotMatch);
    //     gem_bank::cpi::set_vault_lock(
    //         ctx.accounts
    //             .set_lock_vault_ctx(bank_c, vault_c)
    //             .with_signer(&[&ctx.accounts.mutation.get_seeds()]),
    //         true,
    //     )?;
    // }

    // --------------------------------------- mint new tokens from CM

    // send first token
    if config.maker_token_a.source == MakerTokenSource::Mint {
    } else {
        mpl_candy_machine::cpi::mint_nft(ctx.accounts.mint_nft_ctx(), creator_bump)?;
    }

    // send second token
    if let Some(maker_token_b) = config.maker_token_b {
        if maker_token_b.source == MakerTokenSource::Mint {
        } else {
            // todo prefunded
        }
    }

    // send third token
    if let Some(maker_token_c) = config.maker_token_c {
        if maker_token_c.source == MakerTokenSource::Mint {
        } else {
            // todo CM
        }
    }

    Ok(())
}
