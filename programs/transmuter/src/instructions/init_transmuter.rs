use crate::*;
use gem_bank::{self, cpi::accounts::InitBank, program::GemBank};

#[derive(Accounts)]
#[instruction(bump_auth: u8)]
pub struct InitTransmuter<'info> {
    // transmuter
    #[account(init, payer = payer, space = 8 + std::mem::size_of::<Transmuter>())]
    pub transmuter: Box<Account<'info, Transmuter>>,
    pub owner: Signer<'info>,
    #[account(seeds = [transmuter.key().as_ref()], bump = bump_auth)]
    pub authority: AccountInfo<'info>,

    // taker banks
    #[account(mut)]
    pub bank_a: Signer<'info>,
    pub gem_bank: Program<'info, GemBank>,

    // misc
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    //
    // optional:
    // bank_b: signer + mut
    // bank_c: signer + mut
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
}

pub fn handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, InitTransmuter<'info>>,
    bump_auth: u8,
) -> ProgramResult {
    let transmuter = &mut ctx.accounts.transmuter;
    let key = transmuter.key();

    transmuter.version = LATEST_TRANSMUTER_VERSION;
    transmuter.owner = ctx.accounts.owner.key();

    transmuter.authority = ctx.accounts.authority.key();
    transmuter.authority_seed = key;
    transmuter.authority_bump_seed = [bump_auth];

    let full_seeds = [key.as_ref(), &[bump_auth]];
    let remaining_accs = &mut ctx.remaining_accounts.iter();

    // init first bank
    let bank_a = ctx.accounts.bank_a.to_account_info();
    transmuter.bank_a = bank_a.key();
    gem_bank::cpi::init_bank(
        ctx.accounts
            .init_bank_ctx(bank_a)
            .with_signer(&[&full_seeds]),
    )?;

    // init second bank
    if let Ok(bank_b) = next_account_info(remaining_accs) {
        {
            let transmuter = &mut ctx.accounts.transmuter;
            transmuter.bank_b = Some(bank_b.key());
        }
        gem_bank::cpi::init_bank(
            ctx.accounts
                .init_bank_ctx(bank_b.clone())
                .with_signer(&[&full_seeds]),
        )?;
    }

    // init third bank
    if let Ok(bank_c) = next_account_info(remaining_accs) {
        {
            let transmuter = &mut ctx.accounts.transmuter;
            transmuter.bank_c = Some(bank_c.key());
        }
        gem_bank::cpi::init_bank(
            ctx.accounts
                .init_bank_ctx(bank_c.clone())
                .with_signer(&[&full_seeds]),
        )?;
    }

    Ok(())
}
