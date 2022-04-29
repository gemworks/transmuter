use crate::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction;
use gem_bank::{self, cpi::accounts::InitBank, program::GemBank};
use std::str::FromStr;

pub const FEE_WALLET: &str = "2U9sG2BRF8TbUjor1Dms8rRRxVqAjJSktZYCwhXFNYCC"; //6th
pub const FEE_WALLET_2: &str = "BkRfbyZWsDwQWvJTibjJ1wuvBuFsw8HvfgHEEDCXHDRQ";
const FEE_LAMPORTS: u64 = 2_500_000_000; // 2.5 SOL per transmuter

#[derive(Accounts)]
pub struct InitTransmuter<'info> {
    // transmuter
    #[account(init, payer = payer, space = 8 + std::mem::size_of::<Transmuter>())]
    pub transmuter: Box<Account<'info, Transmuter>>,
    pub owner: Signer<'info>,
    /// CHECK:
    #[account(seeds = [transmuter.key().as_ref()], bump)]
    pub authority: AccountInfo<'info>,

    // taker banks
    #[account(mut)]
    pub bank_a: Signer<'info>,
    #[account(mut)]
    pub bank_b: Signer<'info>,
    #[account(mut)]
    pub bank_c: Signer<'info>,
    pub gem_bank: Program<'info, GemBank>,

    // misc
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK:
    #[account(mut, address = Pubkey::from_str(FEE_WALLET).unwrap())]
    pub fee_acc: AccountInfo<'info>,
    /// CHECK:
    #[account(mut, address = Pubkey::from_str(FEE_WALLET_2).unwrap())]
    pub fee_acc2: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitTransmuter<'info> {
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

    fn transfer_fee(&self, dest: &AccountInfo<'info>) -> Result<()> {
        invoke(
            &system_instruction::transfer(self.payer.key, dest.key, FEE_LAMPORTS / 2),
            &[
                self.payer.to_account_info(),
                dest.clone(),
                self.system_program.to_account_info(),
            ],
        )
        .map_err(Into::into)
    }
}

pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, InitTransmuter<'info>>,
    bump_auth: u8,
) -> Result<()> {
    let transmuter = &mut ctx.accounts.transmuter;
    let key = transmuter.key();

    transmuter.version = LATEST_TRANSMUTER_VERSION;
    transmuter.owner = ctx.accounts.owner.key();

    transmuter.authority = ctx.accounts.authority.key();
    transmuter.authority_seed = key;
    transmuter.authority_bump_seed = [bump_auth];

    let full_seeds = [key.as_ref(), &[bump_auth]];

    // init first bank
    let bank_a = ctx.accounts.bank_a.to_account_info();
    transmuter.bank_a = bank_a.key();
    gem_bank::cpi::init_bank(
        ctx.accounts
            .init_bank_ctx(bank_a)
            .with_signer(&[&full_seeds]),
    )?;

    // init second bank
    let transmuter = &mut ctx.accounts.transmuter;
    let bank_b = ctx.accounts.bank_b.to_account_info();
    transmuter.bank_b = bank_b.key();
    gem_bank::cpi::init_bank(
        ctx.accounts
            .init_bank_ctx(bank_b)
            .with_signer(&[&full_seeds]),
    )?;

    // init third bank
    let transmuter = &mut ctx.accounts.transmuter;
    let bank_c = ctx.accounts.bank_c.to_account_info();
    transmuter.bank_c = bank_c.key();
    gem_bank::cpi::init_bank(
        ctx.accounts
            .init_bank_ctx(bank_c)
            .with_signer(&[&full_seeds]),
    )?;

    //collect transmuter fee
    ctx.accounts.transfer_fee(&ctx.accounts.fee_acc)?;
    ctx.accounts.transfer_fee(&ctx.accounts.fee_acc2)?;

    Ok(())
}
